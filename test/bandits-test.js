const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Bandits", function () {

  let Bandits;
  let timeToken;
  let owner;
  let address1;
  let address2;
  let address3;
  
  beforeEach(async function() {
    const maxSupply = "5";
    const mintPrice = "1";
    [owner, address1, address2, address3] = await ethers.getSigners();
    
    // Deploying Time token:
    const timeContract = await ethers.getContractFactory("Time");
    timeToken = await timeContract.deploy();
    await timeToken.connect(owner).deployed();
    console.log(`${"Time token"} deployed to: ${timeToken.address}`);

    // Deploying Bandits token:
    const BanditsContract = await ethers.getContractFactory("Bandits");
    Bandits = await BanditsContract.deploy(
      maxSupply,
      mintPrice,
      timeToken.address,
    );
    await Bandits.connect(owner).deployed();
    console.log(`Bandits deployed to: ${Bandits.address}`);

  });
  
  describe("Mint mechanism", function() {

    it("Should mint tokens for the users", async function () {
      const ethPayment = {value: ethers.utils.parseEther("10")}
      await Bandits.connect(address1).mintBandit(1, ethPayment);
      expect(await Bandits.balanceOf(address1.address)).to.equal(1);

    });

    it("Should fail if max supply is at limit", async function () {
      const ethPayment = {value: ethers.utils.parseEther("10")}
      await Bandits.connect(address1).mintBandit(2, ethPayment);
      await Bandits.connect(address2).mintBandit(2, ethPayment);

      await expect(
        Bandits.connect(address3).mintBandit(1, ethPayment)
      ).to.be.revertedWith("No supply left");

    });

    it("Should fail if user try to mint more than 2", async function () {
      const ethPayment = {value: ethers.utils.parseEther("10")}
      await expect(
        Bandits.connect(address1).mintBandit(3, ethPayment)
      ).to.be.revertedWith("Can't mint > 2");

    });

    it("Should fail if msg.value is not enough", async function () {
      await expect(
        Bandits.connect(address1).mintBandit(2)
      ).to.be.revertedWith("Not enough ether");

    });

  });

  describe("Time mechanism", function() {

    describe("Buy hours", function () {

      it("Should add hours to the token", async function () {
        const ethPayment = {value: ethers.utils.parseEther("1")}
        const ethPayment2 = {value: ethers.utils.parseEther("100")}
  
        await Bandits.connect(address1).mintBandit(1, ethPayment);
        await timeToken.connect(address1).buy(50, ethPayment2);
        await Bandits.connect(address1).buyHours(24, 0);
        expect(await Bandits.getBanditTimeLeft(0)).to.equal(2678400);
  
      });

      it("Should not add hours if it's not the owner", async function () {
        const ethPayment = {value: ethers.utils.parseEther("1")}
        const ethPayment2 = {value: ethers.utils.parseEther("100")}
  
        await Bandits.connect(address1).mintBandit(1, ethPayment);
        await timeToken.connect(address1).buy(50, ethPayment2);
        await expect(Bandits.connect(address2).buyHours(24, 0)).to.be.revertedWith("Not the owner of token");
  
      });

      it("Should not add hours if the right amount of time token is not sent", async function () {
        const ethPayment = {value: ethers.utils.parseEther("1")}
        const ethPayment2 = {value: ethers.utils.parseEther("100")}
  
        await Bandits.connect(address1).mintBandit(1, ethPayment);
        await expect(Bandits.connect(address1).buyHours(24, 0)).to.be.revertedWith("Not enough time tokens");
  
      });

    });

    describe("Buy days", function () {

      it("Should add days to the token", async function () {
        const ethPayment = {value: ethers.utils.parseEther("1")}
        const ethPayment2 = {value: ethers.utils.parseEther("100")}
  
        await Bandits.connect(address1).mintBandit(1, ethPayment);
        await timeToken.connect(address1).buy(50, ethPayment2);
        await Bandits.connect(address1).buyDays(1, 0);
        expect(await Bandits.getBanditTimeLeft(0)).to.equal(2678400);
  
      });

      it("Should not add days if it's not the owner", async function () {
        const ethPayment = {value: ethers.utils.parseEther("1")}
        const ethPayment2 = {value: ethers.utils.parseEther("100")}
  
        await Bandits.connect(address1).mintBandit(1, ethPayment);
        await timeToken.connect(address1).buy(50, ethPayment2);
        await expect(Bandits.connect(address2).buyDays(24, 0)).to.be.revertedWith("Not the owner of token");
  
      });

      it("Should not add days if the right amount of time token is not sent", async function () {
        const ethPayment = {value: ethers.utils.parseEther("1")}
        const ethPayment2 = {value: ethers.utils.parseEther("100")}
  
        await Bandits.connect(address1).mintBandit(1, ethPayment);
        await expect(Bandits.connect(address1).buyDays(24, 0)).to.be.revertedWith("Not enough time tokens");
  
      });

    });
    
  });

  describe("Dynamic mechanism", function() {

    it("Should set the base URI", async function () {
      const ethPayment = {value: ethers.utils.parseEther("10")}

      await Bandits.connect(owner).setBaseURIs(5, "PhaseFiveURI");
      await Bandits.connect(address1).mintBandit(1, ethPayment);
      expect(await Bandits.tokenURI(0)).to.equal("PhaseFiveURI0.json");

    });

  });


  it("Should burn the token", async function () {
    const ethPayment = {value: ethers.utils.parseEther("1")}
    await Bandits.connect(address1).mintBandit(1, ethPayment);
    await Bandits.connect(address1).burnToken(0);

    expect(await Bandits.balanceOf(address1.address)).to.equal(0);

  });

  it("Should burn the token if it's not owner", async function () {
    const ethPayment = {value: ethers.utils.parseEther("1")}
    await Bandits.connect(address1).mintBandit(1, ethPayment);

    await expect(Bandits.connect(address2).burnToken(0)).to.be.revertedWith("Not token owner");

  });

  it("Should withdraw the money from the contract to the owner", async function() {
    const ethPayment = {value: ethers.utils.parseEther("1")}
    await Bandits.connect(address3).mintBandit(1, ethPayment);
    let banditsBalance = await ethers.provider.getBalance(Bandits.address);
    await Bandits.connect(owner).withdraw();
    let ownerBalance = await ethers.provider.getBalance(owner.address);
    expect(ownerBalance).to.be.greaterThanOrEqual(banditsBalance);

  });

  it("Should not withdraw the money from the contract if it's no the owner", async function() {
    const ethPayment = {value: ethers.utils.parseEther("1")}
    await Bandits.connect(address3).mintBandit(1, ethPayment);

    await expect(
      Bandits.connect(address3).withdraw()
    ).to.be.rejectedWith("Ownable: caller is not the owner");

  });

});
