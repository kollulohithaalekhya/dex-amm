const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  // Deploy Mock Token A
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");

  const tokenA = await MockERC20.deploy(
    "Token A",
    "TKA",
    hre.ethers.utils.parseEther("1000000")
  );
  await tokenA.deployed();

  const tokenB = await MockERC20.deploy(
    "Token B",
    "TKB",
    hre.ethers.utils.parseEther("1000000")
  );
  await tokenB.deployed();

  console.log("TokenA deployed to:", tokenA.address);
  console.log("TokenB deployed to:", tokenB.address);

  // Deploy DEX
  const DEX = await hre.ethers.getContractFactory("DEX");
  const dex = await DEX.deploy(tokenA.address, tokenB.address);
  await dex.deployed();

  console.log("DEX deployed to:", dex.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
