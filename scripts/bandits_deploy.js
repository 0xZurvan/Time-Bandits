const hre = require("hardhat");

async function main() {

  let owner;
  const timeAddr = '';
  [owner] = await ethers.getSigners();
  const Bandits = await hre.ethers.getContractFactory("Bandits");
  const bandits = await Bandits.deploy(
    "Bandits", "BANDITS", 108, 2, timeAddr,
  );

  await bandits.connect(owner).deployed();
  console.log("Bandits deployed to:", bandits.address);
  console.log("Owner address:", owner.address);
  

  async function setBaseURIs() {
  
    let uris = [];
    let index = 0;
    let phase = 5;
  
    for(index; index <= uris.length; index++) {
      await bandits.connect(owner).setBaseURIs(phase, uris[index]);
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
