// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GuardianModule {
    error Unauthorized();
    error AlreadyGuardian();
    error NotGuardian();
    error AlreadyApproved(bytes32 operationId, address guardian);

    address public owner;
    uint256 public requiredApprovals;

    mapping(address => bool) public guardians;
    mapping(bytes32 => uint256) public approvalCount;
    mapping(bytes32 => mapping(address => bool)) public hasApproved;

    event OwnerUpdated(address indexed oldOwner, address indexed newOwner);
    event GuardianAdded(address indexed guardian);
    event GuardianRemoved(address indexed guardian);
    event RequiredApprovalsUpdated(uint256 oldValue, uint256 newValue);
    event OperationApproved(bytes32 indexed operationId, address indexed guardian, uint256 approvalCount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyGuardian() {
        if (!guardians[msg.sender]) revert Unauthorized();
        _;
    }

    constructor(address _owner, address[] memory initialGuardians, uint256 _requiredApprovals) {
        require(_owner != address(0), "owner=0");
        require(_requiredApprovals > 0, "approvals=0");

        owner = _owner;
        requiredApprovals = _requiredApprovals;

        for (uint256 i = 0; i < initialGuardians.length; i++) {
            address guardian = initialGuardians[i];
            if (guardian == address(0) || guardians[guardian]) {
                continue;
            }
            guardians[guardian] = true;
            emit GuardianAdded(guardian);
        }
    }

    function approveOperation(bytes32 operationId) external onlyGuardian {
        if (hasApproved[operationId][msg.sender]) {
            revert AlreadyApproved(operationId, msg.sender);
        }

        hasApproved[operationId][msg.sender] = true;
        approvalCount[operationId] += 1;

        emit OperationApproved(operationId, msg.sender, approvalCount[operationId]);
    }

    function isOperationApproved(bytes32 operationId) external view returns (bool) {
        return approvalCount[operationId] >= requiredApprovals;
    }

    function addGuardian(address guardian) external onlyOwner {
        if (guardians[guardian]) revert AlreadyGuardian();
        guardians[guardian] = true;
        emit GuardianAdded(guardian);
    }

    function removeGuardian(address guardian) external onlyOwner {
        if (!guardians[guardian]) revert NotGuardian();
        guardians[guardian] = false;
        emit GuardianRemoved(guardian);
    }

    function updateRequiredApprovals(uint256 newRequiredApprovals) external onlyOwner {
        require(newRequiredApprovals > 0, "approvals=0");
        emit RequiredApprovalsUpdated(requiredApprovals, newRequiredApprovals);
        requiredApprovals = newRequiredApprovals;
    }

    function updateOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "owner=0");
        emit OwnerUpdated(owner, newOwner);
        owner = newOwner;
    }
}
