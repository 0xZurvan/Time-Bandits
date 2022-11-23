const hre = require("hardhat");

async function main() {
 
  const Time = await hre.ethers.getContractFactory("Time");
  const time = await Time.deploy();

  await time.deployed();

  console.log("Time deployed to:", time.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
