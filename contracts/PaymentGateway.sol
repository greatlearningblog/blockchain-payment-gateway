// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PaymentGateway {
    address public owner;
    event PaymentReceived(address indexed from, uint256 amount, uint256 timestamp);
    
    constructor() {
        owner = msg.sender;
    }

    // Function to receive payment
    function pay() external payable {
        require(msg.value > 0, "Payment must be greater than 0");
        emit PaymentReceived(msg.sender, msg.value, block.timestamp);
    }
    
    // Function to withdraw funds (only owner)
    function withdraw(uint256 amount) external {
        require(msg.sender == owner, "Only owner can withdraw funds");
        require(address(this).balance >= amount, "Insufficient balance");
        payable(owner).transfer(amount);
    }
    
    // Fallback function to accept Ether
    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value, block.timestamp);
    }
}
