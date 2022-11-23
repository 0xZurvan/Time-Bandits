const hre = require("hardhat");

async function main() {

  let owner;
  const timeAddr = '';
  [owner] = await ethers.getSigners();
  const Johnny = await hre.ethers.getContractFactory("Johnny");
  const johnny = await Johnny.deploy(
    "Johnny", "JOHNNY", 108, 2, timeAddr,
  );

  await johnny.connect(owner).deployed();
  console.log("Johnny deployed to:", johnny.address);
  console.log("Owner address:", owner.address);
  

  async function setBaseURIs() {
  
    let uris = [];
    let index = 0;
    let phase = 5;
  
    for(index; index <= uris.length; index++) {
      await johnny.connect(owner).setBaseURIs(phase, uris[index]);
      index++;
      phase--;
    }
  
  }

  setBaseURIs();


}



main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
