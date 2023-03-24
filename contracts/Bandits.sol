
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

interface ITime {
    function balanceOf(address account) external view returns (uint256);
}

contract Bandits is ERC721Enumerable, Ownable {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    using Strings for uint256;

    struct Bandit {
        bool isFrozen;
        uint256 frozenStage;
        uint256 timeLeft;
    }

    string public constant baseExtension = ".json";
    uint256 public constant hourPrice = 1e18;
    uint256 public constant dayPrice = 24e18;
    uint256 public immutable maxSupply;
    uint256 public immutable mintPrice;
    address private immutable timeTokenAddress;
    mapping(uint256 => string) private phaseToBaseURI;
    mapping(uint256 => Bandit) public tokenIdToBandit;

    constructor( 
       uint256 _maxSupply, 
       uint256 _mintPrice,
       address _setTimeTokenAddress
       )
    ERC721("Bandits", "BANDITS") {
        console.log("Contract deployed!");
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
        timeTokenAddress = _setTimeTokenAddress;
    }

    modifier onlyHolders() {
        require(balanceOf(msg.sender) >= 1);
        _;
    }

    receive() external payable {}

    function setBaseURIs(uint256 _phaseNumber, string memory _baseURI) external onlyOwner {
        phaseToBaseURI[_phaseNumber] = _baseURI;
    }
    
    function withdraw() external onlyOwner {
        require(address(this).balance > 0, "Contract is empty");

        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        if(!success) {
            revert("Something went wrong");
        }

        assert(address(this).balance == 0);
    }

    function fate() external onlyHolders {
        
        uint256 tokenId = generateRandomNumber();
        if(tokenIdToBandit[tokenId].isFrozen == false && tokenIdToBandit[tokenId].timeLeft >= 30 days) {
            tokenIdToBandit[tokenId].isFrozen = true;
            tokenIdToBandit[tokenId].frozenStage = 5;
            tokenIdToBandit[tokenId].timeLeft = 0;

        } else if(tokenIdToBandit[tokenId].isFrozen == false && tokenIdToBandit[tokenId].timeLeft >= 22 days) {
            tokenIdToBandit[tokenId].isFrozen = true;
            tokenIdToBandit[tokenId].frozenStage = 4;
            tokenIdToBandit[tokenId].timeLeft = 0;

        } else if(tokenIdToBandit[tokenId].isFrozen == false && tokenIdToBandit[tokenId].timeLeft >= 14 days) {
            tokenIdToBandit[tokenId].isFrozen = true;
            tokenIdToBandit[tokenId].frozenStage = 3;
            tokenIdToBandit[tokenId].timeLeft = 0;

        } else if(tokenIdToBandit[tokenId].isFrozen == false && tokenIdToBandit[tokenId].timeLeft >= 7 days) {
            tokenIdToBandit[tokenId].isFrozen = true;
            tokenIdToBandit[tokenId].frozenStage = 2;
            tokenIdToBandit[tokenId].timeLeft = 0;

        } else if(tokenIdToBandit[tokenId].isFrozen == false && tokenIdToBandit[tokenId].timeLeft <= 1 seconds) {
            tokenIdToBandit[tokenId].isFrozen = true;
            tokenIdToBandit[tokenId].frozenStage = 1;
            tokenIdToBandit[tokenId].timeLeft = 0;
        }
    }

    function buyHours(uint256 _amount, uint256 _tokenId) external payable {
        require(ownerOf(_tokenId) == msg.sender, "Not the owner of token");
        require(ITime(timeTokenAddress).balanceOf(msg.sender) >= _amount + hourPrice, "Not enough time tokens");
        require(tokenIdToBandit[_tokenId].timeLeft >= 1 seconds, "Can't buy time in dead phase");
        require(tokenIdToBandit[_tokenId].isFrozen == false, "Token is frozen!");

        tokenIdToBandit[_tokenId].timeLeft = tokenIdToBandit[_tokenId].timeLeft + (_amount * 1 hours);
    }

    function buyDays(uint256 _amount, uint256 _tokenId) external payable {
        require(ownerOf(_tokenId) == msg.sender, "Not the owner of token");
        require(ITime(timeTokenAddress).balanceOf(msg.sender) >= _amount + dayPrice, "Not enough time tokens");
        require(tokenIdToBandit[_tokenId].timeLeft >= 1 seconds, "Can't buy time in dead phase");
        require(tokenIdToBandit[_tokenId].isFrozen == false, "Token is frozen!");

        tokenIdToBandit[_tokenId].timeLeft = tokenIdToBandit[_tokenId].timeLeft + (_amount * 1 days);
    }

    function mintBandit(uint256 _amount) external payable {
        require(maxSupply > totalSupply() + _amount, "No supply left");
        require(msg.value >= _amount * mintPrice, "Not enough ether");
        require(_amount <= 2, "Can't mint > 2");

        for(uint256 _nfts; _nfts < _amount; _nfts++) {
            uint256 newTokenId = _tokenIds.current();
            tokenIdToBandit[newTokenId].timeLeft = 30 days;
            tokenIdToBandit[newTokenId].isFrozen;
            _safeMint(msg.sender, newTokenId);
            _tokenIds.increment();
            console.log("NFT w/ ID %s has been minted to %s", newTokenId, msg.sender);
        }
    }

    function walletOfOwner(address _owner) external view returns(uint256[] memory) {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);

        for(uint256 _index; _index < ownerTokenCount; _index++){
            tokenIds[_index] = tokenOfOwnerByIndex(_owner, _index);
        }

        return tokenIds;
    }

    function getBanditTimeLeft(uint256 _tokenId) external view returns(uint256) {
        return tokenIdToBandit[_tokenId].timeLeft;
    }

    function burnToken(uint256 _tokenId) public {
        require(ownerOf(_tokenId) == msg.sender, "Not token owner");
        _burn(_tokenId);
    }

    function tokenURI(uint256 _tokenId) public view virtual override returns(string memory _tokenURI) {
        require(_exists(_tokenId), "ERC721Metadata: URI query for nonexistent token");

        if(tokenIdToBandit[_tokenId].timeLeft >= 30 days || tokenIdToBandit[_tokenId].frozenStage == 5) {
            string memory currentBaseURI = phaseToBaseURI[5];
            return bytes(currentBaseURI).length > 0 ?
                string(abi.encodePacked(currentBaseURI, _tokenId.toString(), baseExtension)) : "";

        } else if(tokenIdToBandit[_tokenId].timeLeft >= 22 days || tokenIdToBandit[_tokenId].frozenStage == 4) {
            string memory currentBaseURI = phaseToBaseURI[4];
            return bytes(currentBaseURI).length > 0 ?
                string(abi.encodePacked(currentBaseURI, _tokenId.toString(), baseExtension)) : "";

        } else if(tokenIdToBandit[_tokenId].timeLeft >= 14 days || tokenIdToBandit[_tokenId].frozenStage == 3) {
            string memory currentBaseURI = phaseToBaseURI[3];
            return bytes(currentBaseURI).length > 0 ?
                string(abi.encodePacked(currentBaseURI, _tokenId.toString(), baseExtension)) : "";

        } else if(tokenIdToBandit[_tokenId].timeLeft >= 7 days || tokenIdToBandit[_tokenId].frozenStage == 2) {
            string memory currentBaseURI = phaseToBaseURI[2];
            return bytes(currentBaseURI).length > 0 ?
                string(abi.encodePacked(currentBaseURI, _tokenId.toString(), baseExtension)) : "";

        } else if (tokenIdToBandit[_tokenId].timeLeft <= 1 seconds || tokenIdToBandit[_tokenId].frozenStage == 1) {
            string memory currentBaseURI = phaseToBaseURI[1];
            return bytes(currentBaseURI).length > 0 ?
                string(abi.encodePacked(currentBaseURI, _tokenId.toString(), baseExtension)) : "";
        }
    }

    function generateRandomNumber() internal view returns(uint) {
        return uint(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, blockhash(block.number), msg.sender))) % 108;
    }   
}

