/*

Johnny's Time
By. Kronos + Zurvan

━━┏┓┏━━━┓┏┓━┏┓┏━┓━┏┓┏━┓━┏┓┏┓━━┏┓┏┓┏━━━┓━━━━┏━━━━┓┏━━┓┏━┓┏━┓┏━━━┓
━━┃┃┃┏━┓┃┃┃━┃┃┃┃┗┓┃┃┃┃┗┓┃┃┃┗┓┏┛┃┃┃┃┏━┓┃━━━━┃┏┓┏┓┃┗┫┣┛┃┃┗┛┃┃┃┏━━┛
━━┃┃┃┃━┃┃┃┗━┛┃┃┏┓┗┛┃┃┏┓┗┛┃┗┓┗┛┏┛┗┛┃┗━━┓━━━━┗┛┃┃┗┛━┃┃━┃┏┓┏┓┃┃┗━━┓
┏┓┃┃┃┃━┃┃┃┏━┓┃┃┃┗┓┃┃┃┃┗┓┃┃━┗┓┏┛━━━┗━━┓┃━━━━━━┃┃━━━┃┃━┃┃┃┃┃┃┃┏━━┛
┃┗┛┃┃┗━┛┃┃┃━┃┃┃┃━┃┃┃┃┃━┃┃┃━━┃┃━━━━┃┗━┛┃━━━━━┏┛┗┓━┏┫┣┓┃┃┃┃┃┃┃┗━━┓
┗━━┛┗━━━┛┗┛━┗┛┗┛━┗━┛┗┛━┗━┛━━┗┛━━━━┗━━━┛━━━━━┗━━┛━┗━━┛┗┛┗┛┗┛┗━━━┛
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*/

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";


contract Time is ERC20, AccessControl {

    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public maxSupply = 20000e18;
    uint256 public buyPrice =  1e18;
    uint256 public burntSupply;


    constructor() ERC20("Time", "TIME") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

    }


    function buy(uint256 _amount) external payable {
        uint256 bigNumber = buyPrice * _amount;
          
        if(hasRole(MINTER_ROLE, _msgSender())) {
            require(msg.value == 0, "Yo, you can mint for free!");

        } else {
            require(msg.value >= bigNumber, "Error, not enough ethers");
            require(totalSupply() + bigNumber < (maxSupply - burntSupply), "Error, Max has been reached");
        }

        _mint(msg.sender, bigNumber);
        
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
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Error, Only admin can update");
        buyPrice = _newPrice;

    }


   function updateMaxSupply(uint256 _newMaxSupply) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Error, Only admin can update");
        maxSupply = _newMaxSupply;
    }
   

    function withdraw() external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Error, only admin can withdraw");
        require(address(this).balance > 0, "Error, the contract is empty");

        payable(msg.sender).transfer(address(this).balance);
    }

} 