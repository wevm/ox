// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.13;

contract NonConformingEvents {
    // Non-conforming `to` parameter (not indexed).
    event Transfer(address indexed from, address to, uint256 value);

    function transfer(address recipient, uint256 amount) public {
        emit Transfer(msg.sender, recipient, amount);
        return;
    }
}
