
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Time is ERC20, AccessControl {

    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 public buyPrice =  1e18;
    uint256 public  maxSupply = 20000e18;
    uint256 public burntSupply;

    error unsuccessfulWithdraw();

    constructor() ERC20("Time", "TIME") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    receive() external payable {}

    function buy(uint256 _amount) external payable {
        uint256 bigNumber = buyPrice * _amount;
        require(totalSupply() + bigNumber < (maxSupply - burntSupply), "Max has been reached");
        require(msg.value >= bigNumber, "Not enough ethers");

        _mint(msg.sender, bigNumber);
        assert(balanceOf(msg.sender) > 0);
        
    }

    function burn(address _account, uint256 _amount) external {
        require(
            hasRole(BURNER_ROLE, _msgSender()),
            "Must have burner role to burn... DUH."
        );
        require(maxSupply - burntSupply > 0, "Nothing to burn.");

        burntSupply += _amount;
        _burn(_account, _amount);
    }

    function updateBuyPrice(uint256 _newPrice) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Only admin can update");
        buyPrice = _newPrice;
    }

   function updateMaxSupply(uint256 _newMaxSupply) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Only admin can update");
        maxSupply = _newMaxSupply;
    }

    function withdraw() external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Only admin can withdraw");
        require(address(this).balance > 0, "Contract is empty");

        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        if(!success) {
            revert unsuccessfulWithdraw();
        }

        assert(address(this).balance == 0);
    }

} 