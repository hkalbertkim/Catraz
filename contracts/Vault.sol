// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPolicyEngine {
    function evaluate(
        address vault,
        address to,
        uint256 value,
        bool isKnownRecipient
    ) external view returns (bool requiresGuardian, uint256 policyDelaySeconds, string memory reason);
}

interface IGuardianModule {
    function isOperationApproved(bytes32 operationId) external view returns (bool);
}

contract Vault {
    error Unauthorized();
    error QueueRequired(bool requiresGuardian, uint256 delaySeconds, string reason);
    error DailyLimitExceeded(uint256 requested, uint256 remaining);
    error TransferFailed();
    error InvalidOperation();
    error OperationNotReady(uint256 eta);
    error GuardianApprovalRequired(bytes32 operationId);

    struct UserOperation {
        address sender;
        uint256 nonce;
        bytes initCode;
        bytes callData;
        uint256 callGasLimit;
        uint256 verificationGasLimit;
        uint256 preVerificationGas;
        uint256 maxFeePerGas;
        uint256 maxPriorityFeePerGas;
        bytes paymasterAndData;
        bytes signature;
    }

    struct QueuedTransfer {
        address to;
        uint256 value;
        bytes data;
        uint256 eta;
        bool requiresGuardian;
        bool executed;
        string policyReason;
    }

    address public owner;
    address public entryPoint;

    IPolicyEngine public policyEngine;
    IGuardianModule public guardianModule;

    uint256 public dailySpendingLimit;
    uint256 public spentToday;
    uint256 public lastSpendDay;

    uint256 public baseWithdrawalDelay;
    uint256 public queueNonce;

    mapping(address => bool) public knownRecipients;
    mapping(bytes32 => QueuedTransfer) public queuedTransfers;

    event Executed(address indexed to, uint256 value, bytes data);
    event Queued(bytes32 indexed operationId, address indexed to, uint256 value, uint256 eta, bool requiresGuardian, string reason);
    event Cancelled(bytes32 indexed operationId);
    event OwnerUpdated(address indexed oldOwner, address indexed newOwner);
    event EntryPointUpdated(address indexed oldEntryPoint, address indexed newEntryPoint);
    event DailyLimitUpdated(uint256 oldLimit, uint256 newLimit);
    event BaseDelayUpdated(uint256 oldDelay, uint256 newDelay);
    event RecipientTrusted(address indexed recipient, bool trusted);

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyOwnerOrEntryPoint() {
        if (msg.sender != owner && msg.sender != entryPoint) revert Unauthorized();
        _;
    }

    constructor(
        address _owner,
        address _entryPoint,
        address _policyEngine,
        address _guardianModule,
        uint256 _dailySpendingLimit,
        uint256 _baseWithdrawalDelay
    ) {
        owner = _owner;
        entryPoint = _entryPoint;
        policyEngine = IPolicyEngine(_policyEngine);
        guardianModule = IGuardianModule(_guardianModule);
        dailySpendingLimit = _dailySpendingLimit;
        baseWithdrawalDelay = _baseWithdrawalDelay;
        lastSpendDay = block.timestamp / 1 days;
    }

    receive() external payable {}

    function execute(address to, uint256 value, bytes calldata data) external onlyOwnerOrEntryPoint returns (bytes memory result) {
        (bool requiresGuardian, uint256 totalDelay, string memory reason) = _policyDecision(to, value);
        if (requiresGuardian || totalDelay > 0) {
            revert QueueRequired(requiresGuardian, totalDelay, reason);
        }

        _consumeDailyLimit(value);
        knownRecipients[to] = true;
        result = _call(to, value, data);

        emit Executed(to, value, data);
    }

    function queueTransfer(address to, uint256 value, bytes calldata data) external onlyOwner returns (bytes32 operationId) {
        (bool requiresGuardian, uint256 totalDelay, string memory reason) = _policyDecision(to, value);

        operationId = keccak256(
            abi.encode(address(this), block.chainid, queueNonce, to, value, data)
        );
        queueNonce += 1;

        queuedTransfers[operationId] = QueuedTransfer({
            to: to,
            value: value,
            data: data,
            eta: block.timestamp + totalDelay,
            requiresGuardian: requiresGuardian,
            executed: false,
            policyReason: reason
        });

        emit Queued(operationId, to, value, block.timestamp + totalDelay, requiresGuardian, reason);
    }

    function executeQueuedTransfer(bytes32 operationId) external onlyOwnerOrEntryPoint returns (bytes memory result) {
        QueuedTransfer storage op = queuedTransfers[operationId];
        if (op.to == address(0) || op.executed) revert InvalidOperation();
        if (block.timestamp < op.eta) revert OperationNotReady(op.eta);

        if (op.requiresGuardian && !guardianModule.isOperationApproved(operationId)) {
            revert GuardianApprovalRequired(operationId);
        }

        _consumeDailyLimit(op.value);
        knownRecipients[op.to] = true;
        op.executed = true;

        result = _call(op.to, op.value, op.data);
        emit Executed(op.to, op.value, op.data);
    }

    function cancelQueuedTransfer(bytes32 operationId) external onlyOwner {
        QueuedTransfer storage op = queuedTransfers[operationId];
        if (op.to == address(0) || op.executed) revert InvalidOperation();

        delete queuedTransfers[operationId];
        emit Cancelled(operationId);
    }

    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData) {
        if (msg.sender != entryPoint) revert Unauthorized();
        if (userOp.sender != address(this)) return 1;

        address recovered = _recoverEthSignedMessage(userOpHash, userOp.signature);
        if (recovered != owner) return 1;

        if (missingAccountFunds > 0) {
            (bool sent, ) = payable(msg.sender).call{value: missingAccountFunds}("");
            sent;
        }

        return 0;
    }

    function updateOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "owner=0");
        emit OwnerUpdated(owner, newOwner);
        owner = newOwner;
    }

    function updateEntryPoint(address newEntryPoint) external onlyOwner {
        require(newEntryPoint != address(0), "entryPoint=0");
        emit EntryPointUpdated(entryPoint, newEntryPoint);
        entryPoint = newEntryPoint;
    }

    function updatePolicyEngine(address newPolicyEngine) external onlyOwner {
        require(newPolicyEngine != address(0), "policyEngine=0");
        policyEngine = IPolicyEngine(newPolicyEngine);
    }

    function updateGuardianModule(address newGuardianModule) external onlyOwner {
        require(newGuardianModule != address(0), "guardianModule=0");
        guardianModule = IGuardianModule(newGuardianModule);
    }

    function updateDailySpendingLimit(uint256 newLimit) external onlyOwner {
        emit DailyLimitUpdated(dailySpendingLimit, newLimit);
        dailySpendingLimit = newLimit;
    }

    function updateBaseWithdrawalDelay(uint256 newDelay) external onlyOwner {
        emit BaseDelayUpdated(baseWithdrawalDelay, newDelay);
        baseWithdrawalDelay = newDelay;
    }

    function setTrustedRecipient(address recipient, bool trusted) external onlyOwner {
        knownRecipients[recipient] = trusted;
        emit RecipientTrusted(recipient, trusted);
    }

    function _policyDecision(
        address to,
        uint256 value
    ) internal view returns (bool requiresGuardian, uint256 totalDelay, string memory reason) {
        bool isKnownRecipient = knownRecipients[to];
        (requiresGuardian, uint256 policyDelaySeconds, string memory policyReason) = policyEngine.evaluate(
            address(this),
            to,
            value,
            isKnownRecipient
        );

        totalDelay = baseWithdrawalDelay > policyDelaySeconds ? baseWithdrawalDelay : policyDelaySeconds;
        reason = policyReason;
    }

    function _consumeDailyLimit(uint256 value) internal {
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay != lastSpendDay) {
            lastSpendDay = currentDay;
            spentToday = 0;
        }

        uint256 newSpent = spentToday + value;
        if (newSpent > dailySpendingLimit) {
            revert DailyLimitExceeded(value, dailySpendingLimit - spentToday);
        }

        spentToday = newSpent;
    }

    function _call(address to, uint256 value, bytes memory data) internal returns (bytes memory result) {
        (bool ok, bytes memory ret) = to.call{value: value}(data);
        if (!ok) revert TransferFailed();
        return ret;
    }

    function _recoverEthSignedMessage(bytes32 hash, bytes memory sig) internal pure returns (address) {
        if (sig.length != 65) return address(0);

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        if (v < 27) v += 27;
        if (v != 27 && v != 28) return address(0);

        bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
        return ecrecover(digest, v, r, s);
    }
}
