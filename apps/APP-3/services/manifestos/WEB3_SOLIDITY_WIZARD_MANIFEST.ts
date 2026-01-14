/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🔗 WEB3 SOLIDITY WIZARD MANIFEST - O ARQUITETO DA BLOCKCHAIN 🔗        ║
 * ║                                                                              ║
 * ║         "Code is Law. Smart Contracts são a nova constituição."             ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const WEB3_SOLIDITY_WIZARD_MANIFEST = {
  id: 'web3-solidity-wizard',
  name: 'Web3 Solidity Wizard',
  version: '1.0.0',
  description: 'Especialista em Blockchain, Smart Contracts, DeFi, NFTs e Web3',
  
  keywords: [
    'web3', 'blockchain', 'ethereum', 'solidity', 'smart contract',
    'defi', 'nft', 'erc20', 'erc721', 'erc1155', 'dao',
    'hardhat', 'foundry', 'truffle', 'remix',
    'metamask', 'wallet', 'wagmi', 'viem', 'ethers.js',
    'polygon', 'arbitrum', 'optimism', 'base', 'avalanche',
    'uniswap', 'aave', 'compound', 'opensea',
    'ipfs', 'the graph', 'chainlink', 'oracle'
  ],

  philosophy: {
    core: 'Smart Contracts são imutáveis. Um bug é para sempre. Audite antes de deployar.',
    principles: [
      'Security First - Audite, teste, verifique formalmente',
      'Gas Optimization - Cada operação custa dinheiro real',
      'Immutability Aware - Código deployado não pode ser alterado',
      'Upgradability Patterns - Proxies quando necessário',
      'Test Everything - 100% coverage é o mínimo',
      'Formal Verification - Para contratos críticos',
      'Decentralization - Evite pontos únicos de falha'
    ],
    antiPatterns: [
      'Deploy sem auditoria',
      'Ignorar reentrancy attacks',
      'Confiar em tx.origin',
      'Não usar SafeMath (pre-0.8)',
      'Loops sem limite de gas',
      'Armazenar dados sensíveis on-chain'
    ]
  },

  architecture: `
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         WEB3 ARCHITECTURE                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         FRONTEND (dApp)                                 │   │
│  │  [React/Next.js] + [wagmi/viem] + [RainbowKit/ConnectKit]              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         BLOCKCHAIN LAYER                                │   │
│  │                                                                         │   │
│  │  [Smart Contracts (Solidity)]                                          │   │
│  │       │                                                                 │   │
│  │       ├── ERC20 (Tokens)                                               │   │
│  │       ├── ERC721 (NFTs)                                                │   │
│  │       ├── ERC1155 (Multi-Token)                                        │   │
│  │       ├── DeFi Protocols                                               │   │
│  │       └── DAO Governance                                               │   │
│  │                                                                         │   │
│  │  [Networks]: Ethereum, Polygon, Arbitrum, Base, Optimism               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         INFRASTRUCTURE                                  │   │
│  │  [The Graph] [IPFS] [Chainlink Oracles] [Alchemy/Infura]               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
`,

  networks: {
    ethereum: { chainId: 1, type: 'Mainnet', gas: 'High', security: 'Maximum' },
    polygon: { chainId: 137, type: 'L2 Sidechain', gas: 'Low', security: 'High' },
    arbitrum: { chainId: 42161, type: 'L2 Optimistic', gas: 'Low', security: 'High' },
    optimism: { chainId: 10, type: 'L2 Optimistic', gas: 'Low', security: 'High' },
    base: { chainId: 8453, type: 'L2 Optimistic', gas: 'Very Low', security: 'High' },
    avalanche: { chainId: 43114, type: 'L1', gas: 'Low', security: 'High' }
  },

  tools: {
    development: {
      hardhat: 'Framework mais popular, plugins extensivos',
      foundry: 'Mais rápido, testes em Solidity, fuzzing',
      remix: 'IDE online, bom para prototipagem'
    },
    frontend: {
      wagmi: 'React hooks para Ethereum',
      viem: 'TypeScript client, alternativa ao ethers.js',
      'ethers.js': 'Biblioteca clássica, bem documentada',
      rainbowkit: 'UI de conexão de wallet',
      connectkit: 'Alternativa ao RainbowKit'
    },
    security: {
      slither: 'Análise estática de Solidity',
      mythril: 'Análise simbólica',
      echidna: 'Fuzzing para smart contracts',
      certora: 'Verificação formal'
    }
  },

  codeTemplates: {
    erc20Token: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, ERC20Burnable, Ownable {
    constructor(address initialOwner)
        ERC20("MyToken", "MTK")
        Ownable(initialOwner)
    {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}`,

    erc721NFT: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor(address initialOwner)
        ERC721("MyNFT", "MNFT")
        Ownable(initialOwner)
    {}

    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    // Required overrides
    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}`,

    hardhatConfig: `import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;`,

    wagmiSetup: `// wagmi.config.ts
import { http, createConfig } from 'wagmi';
import { mainnet, polygon, arbitrum, base } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, polygon, arbitrum, base],
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID! }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
});

// React Component
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';

function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  if (isConnected) {
    return (
      <div>
        <p>Connected: {address}</p>
        <p>Balance: {balance?.formatted} {balance?.symbol}</p>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      {connectors.map((connector) => (
        <button key={connector.id} onClick={() => connect({ connector })}>
          Connect with {connector.name}
        </button>
      ))}
    </div>
  );
}`,

    contractInteraction: `// Contract interaction with viem
import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Read-only client
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

// Wallet client for transactions
const account = privateKeyToAccount('0x...');
const walletClient = createWalletClient({
  account,
  chain: mainnet,
  transport: http(),
});

// Contract ABI
const abi = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// Read contract
const balance = await publicClient.readContract({
  address: '0x...',
  abi,
  functionName: 'balanceOf',
  args: ['0x...'],
});

// Write contract
const hash = await walletClient.writeContract({
  address: '0x...',
  abi,
  functionName: 'transfer',
  args: ['0x...', parseEther('1')],
});`
  },

  securityPatterns: {
    reentrancy: `// ❌ VULNERABLE
function withdraw() external {
    uint256 balance = balances[msg.sender];
    (bool success, ) = msg.sender.call{value: balance}("");
    require(success);
    balances[msg.sender] = 0; // State change AFTER external call
}

// ✅ SECURE - Checks-Effects-Interactions
function withdraw() external {
    uint256 balance = balances[msg.sender];
    balances[msg.sender] = 0; // State change BEFORE external call
    (bool success, ) = msg.sender.call{value: balance}("");
    require(success);
}

// ✅ SECURE - ReentrancyGuard
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Secure is ReentrancyGuard {
    function withdraw() external nonReentrant {
        // Safe from reentrancy
    }
}`,

    accessControl: `// Access Control with OpenZeppelin
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MyContract is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        // Only minters can call
    }

    function adminFunction() external onlyRole(ADMIN_ROLE) {
        // Only admins can call
    }
}`,

    upgradeableProxy: `// Upgradeable Contract Pattern (UUPS)
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract MyContractV1 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 public value;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    function setValue(uint256 _value) external {
        value = _value;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}`
  },

  gasOptimization: [
    'Use uint256 instead of smaller uints (EVM operates on 256 bits)',
    'Pack storage variables (multiple uint128 in one slot)',
    'Use calldata instead of memory for read-only function params',
    'Use immutable for values set once in constructor',
    'Use constant for compile-time constants',
    'Avoid loops with unbounded iterations',
    'Use events instead of storage for historical data',
    'Batch operations when possible',
    'Use unchecked blocks for safe arithmetic (post-0.8)'
  ],

  checklist: {
    preDeploy: [
      'All tests passing with 100% coverage?',
      'Slither analysis clean?',
      'External audit completed?',
      'Testnet deployment tested?',
      'Gas costs acceptable?',
      'Access control properly configured?',
      'Emergency pause mechanism?',
      'Upgrade path defined (if upgradeable)?'
    ],
    security: [
      'Reentrancy protection?',
      'Integer overflow/underflow safe (0.8+)?',
      'Access control on sensitive functions?',
      'No tx.origin for authentication?',
      'External calls at end of functions?',
      'Events emitted for state changes?',
      'No hardcoded addresses?'
    ]
  }
};

export default WEB3_SOLIDITY_WIZARD_MANIFEST;
