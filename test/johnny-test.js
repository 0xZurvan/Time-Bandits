const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Main", function () {

  let Johnny;
  let timeToken;
  let reviveToken;
  let owner;
  let address1;
  let address2;
  let address3;
  
  beforeEach(async function() {
    const JohnnyContractName = "Johnny";
    const JohnnyContractSymbol = "JOHNNY"
    const maxSupply = "5";
    const mintPrice = "1";
    [owner, address1, address2, address3] = await ethers.getSigners();
    
    // Deploying Time token:
    const timeContract = await ethers.getContractFactory("Time");
    timeToken = await timeContract.deploy();
    await timeToken.connect(owner).deployed();
    console.log(`${"Time token"} deployed to: ${timeToken.address}`);

    // Deploying Revive token:
    const reviveContract = await ethers.getContractFactory("Revive");
    reviveToken = await reviveContract.deploy();
    await reviveToken.connect(owner).deployed();
    console.log(`${"Revive token"} deployed to: ${reviveToken.address}`);

    // Deploying Johnny token:
    const JohnnyContract = await ethers.getContractFactory(JohnnyContractName);
    Johnny = await JohnnyContract.deploy(
      JohnnyContractName,
      JohnnyContractSymbol,
      maxSupply,
      mintPrice,
      timeToken.address,
      reviveToken.address
    );
    await Johnny.connect(owner).deployed();
    console.log(`${JohnnyContractName} deployed to: ${Johnny.address}`);

  });
  
  describe("Mint mechanism", function() {

    it("Should activate minting", async function() {
      await Johnny.connect(owner).flipIsMintingActive();
      const isMintingActive = await Johnny.isMintingActive();
  
      expect(isMintingActive).to.be.true;
  
    });


    it("Should mint tokens for the users", async function () {
      const ethPayment = {value: ethers.utils.parseEther("10")}
      await Johnny.connect(owner).flipIsMintingActive();
      await Johnny.connect(address1).mintJohnny(1, ethPayment);
      expect(await Johnny.balanceOf(address1.address)).to.equal(1);

    });

  });

  describe("Time mechanism", function() {
    
    it("Should add hours to the token", async function () {
      const ethPayment = {value: ethers.utils.parseEther("1")}
      const ethPayment2 = {value: ethers.utils.parseEther("100")}

      await Johnny.connect(owner).flipIsMintingActive();
      await Johnny.connect(address1).mintJohnny(1, ethPayment);
      await timeToken.connect(address1).buy(address1.address, 50, ethPayment2);
      await Johnny.connect(address1).buyHours(24, 0);
      expect(await Johnny.tokenIdToTimeLeft(0)).to.equal(43286400);

    });

    it("Should add days to the token", async function () {
      const ethPayment = {value: ethers.utils.parseEther("1")}
      const ethPayment2 = {value: ethers.utils.parseEther("100")}

      await Johnny.connect(owner).flipIsMintingActive();
      await Johnny.connect(address1).mintJohnny(1, ethPayment);
      await timeToken.connect(address1).buy(address1.address, 50, ethPayment2);
      await Johnny.connect(address1).buyDays(1, 0);
      expect(await Johnny.tokenIdToTimeLeft(0)).to.equal(43286400);

    });

    it("Should revive the token", async function () {
      const ethPayment = {value: ethers.utils.parseEther("1")}
      const ethPayment2 = {value: ethers.utils.parseEther("50")}

      await Johnny.connect(owner).flipIsMintingActive();
      await Johnny.connect(address1).mintJohnny(1, ethPayment);
      await reviveToken.connect(address1).buy(address1.address, 50, ethPayment2);
      await Johnny.connect(address1).reviveToken(0);

      expect(await Johnny.tokenIdToTimeLeft(0)).to.equal(43200000);

    });
    
  });

  describe("Dynamic mechanism", function() {

    it("Should update the base extension", async function() {
      await Johnny.connect(owner).updateBaseExtension(".json2");
      expect(await Johnny.baseExtension()).to.equal(".json2");

    });

    it("Should set the base URI", async function () {
      const ethPayment = {value: ethers.utils.parseEther("10")}

      await Johnny.connect(owner).setBaseURIs(5, "PhaseFiveURI");
      await Johnny.connect(owner).flipIsMintingActive();
      await Johnny.connect(address1).mintJohnny(1, ethPayment);
      expect(await Johnny.tokenURI(0)).to.equal("PhaseFiveURI0.json");

    });

  });


  it("Should burn the token", async function () {
    const ethPayment = {value: ethers.utils.parseEther("1")}

    await Johnny.connect(owner).flipIsMintingActive();
    await Johnny.connect(address1).mintJohnny(1, ethPayment);
    await Johnny.connect(address1).burnToken(0);

    expect(await Johnny.balanceOf(address1.address)).to.equal(0);

  });

  it("Should withdraw the money from the contract to the owner", async function() {
    await Johnny.connect(owner).flipIsMintingActive();
    const ethPayment = {value: ethers.utils.parseEther("1")}
    await Johnny.connect(address3).mintJohnny(1, ethPayment);
    await Johnny.connect(owner).withdraw();
    let ownerBalance = await Johnny.balanceOf(owner.address);
    expect(await Johnny.balanceOf(Johnny.address)).to.equal(ownerBalance);

  });


  
});
