// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract DEX is ReentrancyGuard {
    address public tokenA;
    address public tokenB;

    uint256 public reserveA;
    uint256 public reserveB;

    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidity;

    event LiquidityAdded(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidityMinted
    );

    event LiquidityRemoved(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidityBurned
    );

    event Swap(
        address indexed trader,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(address _tokenA, address _tokenB) {
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    function addLiquidity(uint256 amountA, uint256 amountB)
        external
        returns (uint256 liquidityMinted)
    {
       require(amountA > 0 && amountB > 0, "INVALID_AMOUNTS");

        if (totalLiquidity == 0) {
            liquidityMinted = _sqrt(amountA * amountB);
        } else {
            uint256 amountBRequired = (amountA * reserveB) / reserveA;
            require(amountB == amountBRequired, "INVALID_RATIO");

            liquidityMinted = (amountA * totalLiquidity) / reserveA;
        }

        require(liquidityMinted > 0, "INSUFFICIENT_LIQUIDITY_MINTED");

        // transfer tokens in
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);

        // update reserves
        reserveA += amountA;
        reserveB += amountB;

        // update LP accounting
        totalLiquidity += liquidityMinted;
        liquidity[msg.sender] += liquidityMinted;

        emit LiquidityAdded(msg.sender, amountA, amountB, liquidityMinted);

    }

    function removeLiquidity(uint256 liquidityAmount)
        external
        returns (uint256 amountA, uint256 amountB)
    {
        require(liquidityAmount > 0, "INVALID_LIQUIDITY_AMOUNT");
        require(liquidity[msg.sender] >= liquidityAmount, "INSUFFICIENT_LIQUIDITY");
        require(totalLiquidity > 0, "NO_LIQUIDITY");

        amountA = (liquidityAmount * reserveA) / totalLiquidity;
        amountB = (liquidityAmount * reserveB) / totalLiquidity;

        require(amountA > 0 && amountB > 0, "INSUFFICIENT_OUTPUT_AMOUNT");

        // effects
        liquidity[msg.sender] -= liquidityAmount;
        totalLiquidity -= liquidityAmount;

        reserveA -= amountA;
        reserveB -= amountB;

        // interactions
        IERC20(tokenA).transfer(msg.sender, amountA);
        IERC20(tokenB).transfer(msg.sender, amountB);

        emit LiquidityRemoved(msg.sender, amountA, amountB, liquidityAmount);

    }

    function swapAforB(uint256 amountAIn)
        external
        returns (uint256 amountBOut)
    {
        require(amountAIn > 0, "INVALID_INPUT_AMOUNT");

        amountBOut = getAmountOut(amountAIn, reserveA, reserveB);
        require(amountBOut > 0, "INSUFFICIENT_OUTPUT_AMOUNT");

        // effects
        reserveA += amountAIn;
        reserveB -= amountBOut;

        // interactions
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountAIn);
        IERC20(tokenB).transfer(msg.sender, amountBOut);

        emit Swap(msg.sender, tokenA, tokenB, amountAIn, amountBOut);

    }

    function swapBforA(uint256 amountBIn)
        external
        returns (uint256 amountAOut)
    {
        require(amountBIn > 0, "INVALID_INPUT_AMOUNT");

        amountAOut = getAmountOut(amountBIn, reserveB, reserveA);
        require(amountAOut > 0, "INSUFFICIENT_OUTPUT_AMOUNT");

        // effects
        reserveB += amountBIn;
        reserveA -= amountAOut;

        // interactions
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountBIn);
        IERC20(tokenA).transfer(msg.sender, amountAOut);

        emit Swap(msg.sender, tokenB, tokenA, amountBIn, amountAOut);

    }

    function getPrice() external view returns (uint256 price) {
        require(reserveA > 0 && reserveB > 0, "NO_LIQUIDITY");
        price = reserveB / reserveA;
    }

    function getReserves()
        external
        view
        returns (uint256 _reserveA, uint256 _reserveB)
    {
        return (reserveA, reserveB);
    }

    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "INSUFFICIENT_LIQUIDITY");

        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;

        amountOut = numerator / denominator;

    }
    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
