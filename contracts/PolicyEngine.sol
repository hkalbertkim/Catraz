// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PolicyEngine {
    error Unauthorized();

    address public owner;

    uint256 public guardianThreshold;
    uint256 public newRecipientDelay;

    event OwnerUpdated(address indexed oldOwner, address indexed newOwner);
    event GuardianThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event NewRecipientDelayUpdated(uint256 oldDelay, uint256 newDelay);

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address _owner, uint256 _guardianThreshold, uint256 _newRecipientDelay) {
        owner = _owner;
        guardianThreshold = _guardianThreshold;
        newRecipientDelay = _newRecipientDelay;
    }

    function evaluate(
        address,
        address,
        uint256 value,
        bool isKnownRecipient
    ) external view returns (bool requiresGuardian, uint256 policyDelaySeconds, string memory reason) {
        requiresGuardian = value > guardianThreshold;
        policyDelaySeconds = isKnownRecipient ? 0 : newRecipientDelay;

        if (requiresGuardian && policyDelaySeconds > 0) {
            reason = "Value exceeds threshold and recipient is new";
        } else if (requiresGuardian) {
            reason = "Value exceeds guardian threshold";
        } else if (policyDelaySeconds > 0) {
            reason = "New recipient transfer delay";
        } else {
            reason = "Policy allows immediate execution";
        }
    }

    function updateOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "owner=0");
        emit OwnerUpdated(owner, newOwner);
        owner = newOwner;
    }

    function updateGuardianThreshold(uint256 newThreshold) external onlyOwner {
        emit GuardianThresholdUpdated(guardianThreshold, newThreshold);
        guardianThreshold = newThreshold;
    }

    function updateNewRecipientDelay(uint256 newDelay) external onlyOwner {
        emit NewRecipientDelayUpdated(newRecipientDelay, newDelay);
        newRecipientDelay = newDelay;
    }
}
