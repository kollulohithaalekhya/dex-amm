# DEX AMM (Automated Market Maker)

A simple decentralized exchange (DEX) implementing a constant-product Automated Market Maker (AMM), similar to Uniswap v2.

This project supports:
- Adding and removing liquidity
- Token swaps in both directions
- 0.3% swap fee retained in the pool
- Full test coverage
- Dockerized execution for reproducibility

---

##  Project Structure

```
contracts/
├─ DEX.sol          # Core AMM smart contract
└─ MockERC20.sol    # ERC20 tokens for testing

scripts/
└─ deploy.js        # Deployment script

test/
└─ DEX.test.js      # Comprehensive test suite

Dockerfile
docker-compose.yml
hardhat.config.js
package.json
```

---

## Tech Stack

- Solidity ^0.8.19
- Hardhat
- Ethers.js
- OpenZeppelin
- Mocha / Chai
- Docker & Docker Compose

---

##  Local Setup (Without Docker)

### 1. Install dependencies
```bash
npm install
```

### 2. Compile contracts
```bash
npx hardhat compile
```

### 3. Run tests
```bash
npx hardhat test
```

### 4. Run coverage
```bash
npm run coverage
```

---

##  Docker Setup (Recommended)

### 1. Build and start container
```bash
docker-compose up -d --build
```

### 2. Run tests inside container
```bash
docker-compose exec app npm test
```

### 3. Run coverage inside container
```bash
docker-compose exec app npm run coverage
```

### 4. Stop container
```bash
docker-compose down
```

---

##  Test Coverage

* Liquidity provision (initial & subsequent)
* Liquidity removal
* Token swaps (A → B, B → A)
* Fee behavior (k-value increase)
* Edge cases & revert conditions

Coverage reports are generated in:

```
coverage/
coverage.json
```

---

##  AMM Formula

Swap output is calculated using:

```
amountInWithFee = amountIn * 997
amountOut = (amountInWithFee * reserveOut) /
            (reserveIn * 1000 + amountInWithFee)
```

---