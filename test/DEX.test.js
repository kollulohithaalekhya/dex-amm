const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DEX AMM", function () {
  let owner, user;
  let tokenA, tokenB, dex;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy Mock Tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");

    tokenA = await MockERC20.deploy(
      "Token A",
      "TKA",
      ethers.utils.parseEther("1000000")
    );
    await tokenA.deployed();

    tokenB = await MockERC20.deploy(
      "Token B",
      "TKB",
      ethers.utils.parseEther("1000000")
    );
    await tokenB.deployed();

    // Deploy DEX
    const DEX = await ethers.getContractFactory("DEX");
    dex = await DEX.deploy(tokenA.address, tokenB.address);
    await dex.deployed();

    // Distribute tokens to user
    await tokenA.transfer(user.address, ethers.utils.parseEther("10000"));
    await tokenB.transfer(user.address, ethers.utils.parseEther("10000"));
  });

  it("should deploy contracts correctly", async function () {
    expect(await tokenA.totalSupply()).to.equal(
      ethers.utils.parseEther("1000000")
    );
    expect(await tokenB.totalSupply()).to.equal(
      ethers.utils.parseEther("1000000")
    );
    expect(await dex.tokenA()).to.equal(tokenA.address);
    expect(await dex.tokenB()).to.equal(tokenB.address);
  });
  it("should allow initial liquidity provision", async function () {
    const amountA = ethers.utils.parseEther("1000");
    const amountB = ethers.utils.parseEther("2000");

    // Approve tokens
    await tokenA.approve(dex.address, amountA);
    await tokenB.approve(dex.address, amountB);

    // Add liquidity
    await dex.addLiquidity(amountA, amountB);

    // Check reserves
    const [reserveA, reserveB] = await dex.getReserves();
    expect(reserveA).to.equal(amountA);
    expect(reserveB).to.equal(amountB);

    // Check total liquidity
    const totalLiquidity = await dex.totalLiquidity();
    expect(totalLiquidity).to.be.gt(0);
    });
    it("should enforce correct ratio for subsequent liquidity providers", async function () {
        const amountA1 = ethers.utils.parseEther("1000");
        const amountB1 = ethers.utils.parseEther("2000");

        // First LP
        await tokenA.approve(dex.address, amountA1);
        await tokenB.approve(dex.address, amountB1);
        await dex.addLiquidity(amountA1, amountB1);

        // Second LP (user)
        const amountA2 = ethers.utils.parseEther("500");
        const correctAmountB2 = ethers.utils.parseEther("1000");
        const wrongAmountB2 = ethers.utils.parseEther("1200");

        await tokenA.connect(user).approve(dex.address, amountA2);
        await tokenB.connect(user).approve(dex.address, wrongAmountB2);

        // Wrong ratio should fail
        await expect(
            dex.connect(user).addLiquidity(amountA2, wrongAmountB2)
        ).to.be.revertedWith("INVALID_RATIO");

        // Correct ratio should pass
        await tokenB.connect(user).approve(dex.address, correctAmountB2);
        await dex.connect(user).addLiquidity(amountA2, correctAmountB2);

        const totalLiquidity = await dex.totalLiquidity();
        expect(totalLiquidity).to.be.gt(0);
    });
    it("should allow liquidity providers to remove liquidity", async function () {
    const amountA = ethers.utils.parseEther("1000");
    const amountB = ethers.utils.parseEther("2000");

    // Add liquidity
    await tokenA.approve(dex.address, amountA);
    await tokenB.approve(dex.address, amountB);
    await dex.addLiquidity(amountA, amountB);

    const liquidityMinted = await dex.liquidity(owner.address);

    // Remove half liquidity
    const liquidityToRemove = liquidityMinted.div(2);
    await dex.removeLiquidity(liquidityToRemove);

    const [reserveA, reserveB] = await dex.getReserves();

    // Reserves should be reduced
    const expectedA = amountA.div(2);
    const expectedB = amountB.div(2);

    // allow 1 wei rounding difference
    expect(reserveA).to.be.closeTo(expectedA, 1);
    expect(reserveB).to.be.closeTo(expectedB, 1);


    // LP balance reduced
    const remainingLiquidity = await dex.liquidity(owner.address);
    expect(remainingLiquidity).to.equal(liquidityMinted.sub(liquidityToRemove));
    });
    it("should allow swapping Token A for Token B", async function () {
        const amountA = ethers.utils.parseEther("1000");
        const amountB = ethers.utils.parseEther("2000");

        // Add initial liquidity
        await tokenA.approve(dex.address, amountA);
        await tokenB.approve(dex.address, amountB);
        await dex.addLiquidity(amountA, amountB);

        const swapAmount = ethers.utils.parseEther("10");

        // Approve swap
        await tokenA.approve(dex.address, swapAmount);

        const balanceBBefore = await tokenB.balanceOf(owner.address);

        // Perform swap
        await dex.swapAforB(swapAmount);

        const balanceBAfter = await tokenB.balanceOf(owner.address);

        // User should receive some Token B
        expect(balanceBAfter).to.be.gt(balanceBBefore);

        const [reserveA, reserveB] = await dex.getReserves();

        // Reserve A increases, Reserve B decreases
        expect(reserveA).to.equal(amountA.add(swapAmount));
        expect(reserveB).to.be.lt(amountB);
    });
    it("should allow swapping Token B for Token A", async function () {
        const amountA = ethers.utils.parseEther("1000");
        const amountB = ethers.utils.parseEther("2000");

        // Add initial liquidity
        await tokenA.approve(dex.address, amountA);
        await tokenB.approve(dex.address, amountB);
        await dex.addLiquidity(amountA, amountB);

        const swapAmount = ethers.utils.parseEther("20");

        // Approve swap
        await tokenB.approve(dex.address, swapAmount);

        const balanceABefore = await tokenA.balanceOf(owner.address);

        // Perform swap
        await dex.swapBforA(swapAmount);

        const balanceAAfter = await tokenA.balanceOf(owner.address);

        // User should receive some Token A
        expect(balanceAAfter).to.be.gt(balanceABefore);

        const [reserveA, reserveB] = await dex.getReserves();

        // Reserve B increases, Reserve A decreases
        expect(reserveB).to.equal(amountB.add(swapAmount));
        expect(reserveA).to.be.lt(amountA);
    });
    it("should revert when adding liquidity with zero amounts", async function () {
        await expect(
            dex.addLiquidity(0, 0)
        ).to.be.revertedWith("INVALID_AMOUNTS");
    });
    it("should revert when swapping with zero input", async function () {
        await expect(
            dex.swapAforB(0)
        ).to.be.revertedWith("INVALID_INPUT_AMOUNT");
    });
    it("should revert when removing liquidity without LP tokens", async function () {
        await expect(
            dex.removeLiquidity(1)
        ).to.be.revertedWith("INSUFFICIENT_LIQUIDITY");
    });
    it("should revert when getting price with no liquidity", async function () {
        await expect(
            dex.getPrice()
        ).to.be.revertedWith("NO_LIQUIDITY");
    });
    it("should increase k value after a swap due to fees", async function () {
        const amountA = ethers.utils.parseEther("1000");
        const amountB = ethers.utils.parseEther("2000");

        // Add initial liquidity
        await tokenA.approve(dex.address, amountA);
        await tokenB.approve(dex.address, amountB);
        await dex.addLiquidity(amountA, amountB);

        const [reserveABefore, reserveBBefore] = await dex.getReserves();
        const kBefore = reserveABefore.mul(reserveBBefore);

        const swapAmount = ethers.utils.parseEther("10");
        await tokenA.approve(dex.address, swapAmount);
        await dex.swapAforB(swapAmount);

        const [reserveAAfter, reserveBAfter] = await dex.getReserves();
        const kAfter = reserveAAfter.mul(reserveBAfter);

        // k should increase because of fee retention
        expect(kAfter).to.be.gt(kBefore);
    });

});
