// npx hardhat test test/time-test.js

const { expect } = require("chai");
const { ethers } = require("hardhat");
const keccak256 = require('keccak256');

describe("Time", function () {

  let Time;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploying Time token:
    const timeContract = await ethers.getContractFactory("Time");
    Time = await timeContract.deploy();
    await Time.connect(owner).deployed();
    console.log(`${"Time token"} deployed to: ${Time.address}`);

  });

  describe("Buy", function () {

    it("Should buy time tokens", async function () {
      const ethPayment = {value: ethers.utils.parseEther("100")}
      const amount = 50;

      await Time.connect(user1).buy(amount, ethPayment);
      const userBalance = await Time.connect(user1).balanceOf(user1.address);
      const bigNumberStr = "50000000000000000000";

      expect(userBalance).to.be.equal(bigNumberStr);

    });

    it("Should not buy time if the right eth amount is sent", async function () {
      const amount = 50;
      await expect(
        Time.connect(user1).buy(amount)
      ).to.be.revertedWith("Not enough ethers");

    });

  });

  describe("Withdraw", function () {

    it("Should withdraw the money from the contract to the owner", async function() {
      const ethPayment = {value: ethers.utils.parseEther("1")}
      await Time.connect(user1).buy(1, ethPayment);
      let timeBalance = await ethers.provider.getBalance(Time.address);
      await Time.connect(owner).withdraw();
      let ownerBalance = await ethers.provider.getBalance(owner.address);
      expect(ownerBalance).to.be.greaterThanOrEqual(timeBalance);
  
    });
  
    it("Should not withdraw the money from the contract if it's no the owner", async function() {
      const ethPayment = {value: ethers.utils.parseEther("1")}
      await Time.connect(user1).buy(1, ethPayment);
  
      await expect(
        Time.connect(user1).withdraw()
      ).to.be.rejectedWith("Only admin can withdraw");
  
    });

  });

  describe("Burn", function () {

    it("Should burn the tokens from the account", async function () {
      const ethPayment = {value: ethers.utils.parseEther("1")}
      await Time.connect(user1).buy(1, ethPayment);

      const BURNER_ROLE = keccak256("BURNER_ROLE");
      await Time.connect(owner).grantRole(BURNER_ROLE, owner.address);

      await Time.connect(owner).burn(user1.address, 1000000000000000000n);
      const balance = await Time.balanceOf(user1.address);
      expect(balance).to.be.equal(0);

    });

    it("Should not burn the tokens from the account if it has not balance", async function () {
      const BURNER_ROLE = keccak256("BURNER_ROLE");
      await Time.connect(owner).grantRole(BURNER_ROLE, owner.address);

      await expect(
        Time.connect(owner).burn(user1.address, 1000000000000000000n)
      ).to.be.rejectedWith("ERC20: burn amount exceeds balance");

    });

    it("Should not burn if doesn't have burner role", async function () {
      const ethPayment = {value: ethers.utils.parseEther("1")}
      await Time.connect(user1).buy(1, ethPayment);

      await expect(
        Time.connect(owner).burn(user1.address, 1000000000000000000n)
      ).to.be.rejectedWith("Must have burner role to burn... DUH.");

    });
  
  });

  describe("Update methods", function () {

    it("Should update max supply", async function () {
      await Time.connect(owner).updateMaxSupply(20);
      expect(
        await Time.connect(owner).maxSupply()
      ).be.equal(20);

    });

    it("Should not update max supply if is not admin", async function () {
      await expect(
        Time.connect(user1).updateMaxSupply(20)
      ).to.be.rejectedWith("Only admin can update");

    });

    it("Should update buy price", async function () {
      await Time.connect(owner).updateBuyPrice(20);
      expect(
        await Time.connect(owner).buyPrice()
      ).be.equal(20);

    });

    it("Should not update buy price if is not admin", async function () {
      await expect(
        Time.connect(user1).updateBuyPrice(20)
      ).to.be.rejectedWith("Only admin can update");

    });

  });

});