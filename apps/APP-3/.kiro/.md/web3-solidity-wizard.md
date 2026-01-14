# 🔗 WEB3 SOLIDITY WIZARD

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Web3, Blockchain, Ethereum, Solidity, Smart Contract
- DeFi, NFT, ERC20, ERC721, ERC1155, DAO
- Hardhat, Foundry, Truffle, Remix
- MetaMask, Wallet, wagmi, viem, ethers.js
- Polygon, Arbitrum, Optimism, Base, Avalanche
- Uniswap, Aave, Compound, OpenSea
- IPFS, The Graph, Chainlink, Oracle

## FILOSOFIA
> "Code is Law. Smart Contracts são imutáveis. Um bug é para sempre."

### Princípios Invioláveis
1. **Security First** - Audite, teste, verifique formalmente
2. **Gas Optimization** - Cada operação custa dinheiro real
3. **Immutability Aware** - Código deployado não pode ser alterado
4. **Upgradability Patterns** - Proxies quando necessário
5. **Test Everything** - 100% coverage é o mínimo
6. **Formal Verification** - Para contratos críticos

## NETWORKS

| Network | Chain ID | Type | Gas |
|---------|----------|------|-----|
| Ethereum | 1 | Mainnet | High |
| Polygon | 137 | L2 Sidechain | Low |
| Arbitrum | 42161 | L2 Optimistic | Low |
| Base | 8453 | L2 Optimistic | Very Low |

## ERC20 TOKEN

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    constructor() ERC20("MyToken", "MTK") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
```

## WAGMI SETUP

```typescript
import { http, createConfig } from 'wagmi';
import { mainnet, polygon, arbitrum } from 'wagmi/chains';

export const config = createConfig({
  chains: [mainnet, polygon, arbitrum],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
});
```

## SECURITY PATTERNS

### Reentrancy Protection
```solidity
// ✅ Checks-Effects-Interactions
function withdraw() external {
    uint256 balance = balances[msg.sender];
    balances[msg.sender] = 0; // Effect BEFORE interaction
    (bool success, ) = msg.sender.call{value: balance}("");
    require(success);
}

// ✅ ReentrancyGuard
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
contract Secure is ReentrancyGuard {
    function withdraw() external nonReentrant { }
}
```

## GAS OPTIMIZATION

- Use uint256 instead of smaller uints
- Pack storage variables
- Use calldata instead of memory for read-only params
- Use immutable for values set in constructor
- Use constant for compile-time constants
- Avoid unbounded loops
- Use events instead of storage for historical data

## CHECKLIST

### Pre-Deploy
- [ ] All tests passing with 100% coverage?
- [ ] Slither analysis clean?
- [ ] External audit completed?
- [ ] Testnet deployment tested?
- [ ] Gas costs acceptable?

### Security
- [ ] Reentrancy protection?
- [ ] Access control on sensitive functions?
- [ ] No tx.origin for authentication?
- [ ] External calls at end of functions?
- [ ] Events emitted for state changes?

## ANTI-PATTERNS

❌ **NUNCA** deploy sem auditoria
❌ **NUNCA** ignore reentrancy attacks
❌ **NUNCA** confie em tx.origin
❌ **NUNCA** use loops sem limite de gas
❌ **NUNCA** armazene dados sensíveis on-chain
