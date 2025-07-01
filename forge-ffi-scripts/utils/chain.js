function bet_min() {
  if(process.env.CHAIN == "BASE" || process.env.CHAIN == "ETHEREUM") {
    return "1000000";
  }
  throw new Error("CHAIN not set");
}

function rpc_url() {
  if(process.env.CHAIN == "BASE") {
    return 'https://mainnet.base.org/';
  }
  if(process.env.CHAIN == "ETHEREUM") {
    return 'https://ethereum-rpc.publicnode.com';
  }
  throw new Error("CHAIN not set");
}

function foom_url() {
  if(process.env.CHAIN == "BASE") {
    return 'https://foom.cash/files/base';
  }
  if(process.env.CHAIN == "ETHEREUM") {
    return 'https://foom.cash/files/ethereum';
  }
  throw new Error("CHAIN not set");
}

function gas_price_limit() {
  if(process.env.CHAIN == "BASE") {
    return "0.02";
  }
  if(process.env.CHAIN == "ETHEREUM") {
    return "1.5";
  }
  throw new Error("CHAIN not set");
}

function wait_blocks() {
  if(process.env.CHAIN == "BASE") {
    return 5;
  }
  if(process.env.CHAIN == "ETHEREUM") {
    return 2;
  }
  throw new Error("CHAIN not set");
}

function log_start() {
  if(process.env.CHAIN == "BASE") {
    return 30899833;
  }
  if(process.env.CHAIN == "ETHEREUM") {
    return 22826378;
  }
  throw new Error("CHAIN not set");
}

function dex_address() {
  if(process.env.CHAIN == "BASE") {
    return '0xc5adb6F67c54D187a9FD8bA4994855e35963B69D';
  }
  if(process.env.CHAIN == "ETHEREUM") {
    return '0x5cd0ad98ba6288ed7819246a1ebc0386c32c314b';
  }
  throw new Error("CHAIN not set");
}

function dex_abi() {
  if(process.env.CHAIN == "BASE" || process.env.CHAIN == "ETHEREUM") {
    return [
      "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    ];
  }
  throw new Error("CHAIN not set");
}

function weth_address() {
  if(process.env.CHAIN == "BASE") {
    return '0x4200000000000000000000000000000000000006';
  }
  if(process.env.CHAIN == "ETHEREUM") {
    return '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  }
  throw new Error("CHAIN not set");
}

function weth_abi() {
  return foom_abi();
}

function foom_address() {
  if(process.env.CHAIN == "BASE") {
    return '0x02300aC24838570012027E0A90D3FEcCEF3c51d2';
  }
  if(process.env.CHAIN == "ETHEREUM") {
    return '0xd0D56273290D339aaF1417D9bfa1bb8cFe8A0933';
  }
  throw new Error("CHAIN not set");
}

function foom_abi() {
  if(process.env.CHAIN == "BASE" || process.env.CHAIN == "ETHEREUM") {
    return [
      "function balanceOf(address) view returns (uint256)",
      "function approve(address,uint256) external returns (bool)",
      "function allowance(address,address) view returns (uint256)",
      "function walletBalanceOf(address) view returns (uint256)",
    ];
  }
  throw new Error("CHAIN not set");
}

function lottery_address() {
  if(process.env.CHAIN == "BASE") {
    return '0xdb203504ba1fea79164AF3CeFFBA88C59Ee8aAfD';
  }
  if(process.env.CHAIN == "ETHEREUM") {
    return '0xd5A3bBb90f919BB7EB53C0909F4e62f42F087Add';
  }
  throw new Error("CHAIN not set");
}

function lottery_abi() {
  return [
    { "inputs":
      [
        {"internalType":"contract IWithdraw","name":"_Withdraw","type":"address"},
        {"internalType":"contract ICancel","name":"_Cancel","type":"address"},
        {"internalType":"contract IUpdate1","name":"_Update1","type":"address"},
        {"internalType":"contract IUpdate3","name":"_Update3","type":"address"},
        {"internalType":"contract IUpdate5","name":"_Update5","type":"address"},
        {"internalType":"contract IUpdate11","name":"_Update11","type":"address"},
        {"internalType":"contract IUpdate21","name":"_Update21","type":"address"},
        {"internalType":"contract IUpdate44","name":"_Update44","type":"address"},
        {"internalType":"contract IUpdate89","name":"_Update89","type":"address"},
        {"internalType":"contract IUpdate179","name":"_Update179","type":"address"},
        {"internalType":"contract IERC20","name":"_Token","type":"address"},
        {"internalType":"contract ISwapRouter","name":"_Router","type":"address"},
        {"internalType":"uint256","name":"_BetMin","type":"uint256"}
      ],
      "stateMutability":"nonpayable",
      "type":"constructor"
    },
    { "anonymous":false,
      "inputs":
      [
        {"indexed":true,"internalType":"uint256","name":"index","type":"uint256"},
        {"indexed":true,"internalType":"uint256","name":"newHash","type":"uint256"}
      ],
      "name":"LogBetIn",
      "type":"event"
    },
    { "anonymous":false,
      "inputs":
      [
        {"indexed":true,"internalType":"uint256","name":"index","type":"uint256"}
      ],
      "name":"LogCancel",
      "type":"event"
    },
    { "anonymous":false,
      "inputs":
      [
        {"indexed":true,"internalType":"address","name":"owner","type":"address"},
        {"indexed":true,"internalType":"address","name":"newGenerator","type":"address"}
      ],
      "name":"LogChangeGenerator",
      "type":"event"
    },
    { "anonymous":false,
      "inputs":
      [
        {"indexed":true,"internalType":"address","name":"owner","type":"address"},
        {"indexed":true,"internalType":"address","name":"newOwner","type":"address"}
      ],
      "name":"LogChangeOwner",
      "type":"event"
    },
    { "anonymous":false,
      "inputs":
      [
        {"indexed":true,"internalType":"address","name":"owner","type":"address"}
      ],
      "name":"LogClose",
      "type":"event"
    },
    { "anonymous":false,
      "inputs":
      [
        {"indexed":true,"internalType":"uint256","name":"index","type":"uint256"},
        {"indexed":true,"internalType":"uint256","name":"commitIndex","type":"uint256"},
        {"indexed":true,"internalType":"uint256","name":"commitHash","type":"uint256"}
      ],
      "name":"LogCommit",
      "type":"event"
    },
    { "anonymous":false,
      "inputs":
      [
        {"indexed":true,"internalType":"uint256","name":"commitBlockHash","type":"uint256"}
      ],
      "name":"LogHash",
      "type":"event"
    },
    { "anonymous":false,
      "inputs":
      [
        {"indexed":true,"internalType":"uint256","name":"betId","type":"uint256"},
        {"indexed":false,"internalType":"bytes32[]","name":"prayer","type":"bytes32[]"}
      ],
      "name":"LogPrayer",
      "type":"event"
    },
    { "anonymous":false,
      "inputs":
      [
        {"indexed":true,"internalType":"address","name":"owner","type":"address"}
      ],
      "name":"LogReopen",
      "type":"event"
    },
    { "anonymous":false,
      "inputs":
      [
        {"indexed":true,"internalType":"address","name":"owner","type":"address"}
      ],
      "name":"LogResetCommit",
      "type":"event"
    },
    { "anonymous":false,
      "inputs":
      [
        {"indexed":true,"internalType":"uint256","name":"lastRoot","type":"uint256"},
        {"indexed":true,"internalType":"uint256","name":"revealSecret","type":"uint256"}
      ],
      "name":"LogSecret",
      "type":"event"
    },
    { "anonymous":false,
      "inputs":
      [
        {"indexed":true,"internalType":"uint256","name":"index","type":"uint256"},
        {"indexed":true,"internalType":"uint256","name":"newRand","type":"uint256"},
        {"indexed":true,"internalType":"uint256","name":"newRoot","type":"uint256"}
      ],
      "name":"LogUpdate",
      "type":"event"
    },
    { "anonymous":false,
      "inputs":
      [
        {"indexed":true,"internalType":"uint256","name":"nullifierHash","type":"uint256"},
        {"indexed":true,"internalType":"uint256","name":"reward","type":"uint256"},
        {"indexed":true,"internalType":"address","name":"recipient","type":"address"}
      ],
      "name":"LogWin",
      "type":"event"
    },
    { "anonymous":false,
      "inputs":
      [
        {"indexed":true,"internalType":"address","name":"owner","type":"address"}
      ],
      "name":"LogWithdraw",
      "type":"event"
    },
    { "stateMutability":"payable",
      "type":"fallback"
    },
    { "inputs":[],
      "name":"D",
      "outputs":[
        {"internalType":"uint64","name":"periodStartBlock","type":"uint64"},
        {"internalType":"uint64","name":"commitBlock","type":"uint64"},
        {"internalType":"uint32","name":"nextIndex","type":"uint32"},
        {"internalType":"uint16","name":"dividendPeriod","type":"uint16"},
        {"internalType":"uint8","name":"betsLimit","type":"uint8"},
        {"internalType":"uint8","name":"betsStart","type":"uint8"},
        {"internalType":"uint8","name":"betsIndex","type":"uint8"},
        {"internalType":"uint8","name":"commitIndex","type":"uint8"},
        {"internalType":"uint8","name":"status","type":"uint8"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"adminwithdraw",
      "outputs":[],
      "stateMutability":"nonpayable",
      "type":"function"
    },
    { "inputs":[],
      "name":"betMin",
      "outputs":
      [
        {"internalType":"uint128","name":"","type":"uint128"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"betPower1",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"betPower2",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"betPower3",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"betSum",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "name":"bets",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"betsIndex",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"betsLimit",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"betsMax",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"cancel",
      "outputs":
      [
        {"internalType":"contract ICancel","name":"","type":"address"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"uint256[2]","name":"_pA","type":"uint256[2]"},
        {"internalType":"uint256[2][2]","name":"_pB","type":"uint256[2][2]"},
        {"internalType":"uint256[2]","name":"_pC","type":"uint256[2]"},
        {"internalType":"uint256","name":"_betIndex","type":"uint256"},
        {"internalType":"address","name":"_recipient","type":"address"}
      ],
      "name":"cancelbet",
      "outputs":[],
      "stateMutability":"nonpayable",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"address","name":"_who","type":"address"}
      ],
      "name":"changeGenerator",
      "outputs":[],
      "stateMutability":"nonpayable",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"address","name":"_who","type":"address"}
      ],
      "name":"changeOwner",
      "outputs":[],
      "stateMutability":"nonpayable",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"address","name":"_router","type":"address"}
      ],
      "name":"changeRouter",
      "outputs":[],
      "stateMutability":"nonpayable",
      "type":"function"
    },
    { "inputs":[],
      "name":"close",
      "outputs":[],
      "stateMutability":"nonpayable",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"uint256[2]","name":"_pA","type":"uint256[2]"},
        {"internalType":"uint256[2][2]","name":"_pB","type":"uint256[2][2]"},
        {"internalType":"uint256[2]","name":"_pC","type":"uint256[2]"},
        {"internalType":"uint256","name":"_root","type":"uint256"},
        {"internalType":"uint256","name":"_nullifierHash","type":"uint256"},
        {"internalType":"address","name":"_recipient","type":"address"},
        {"internalType":"address","name":"_relayer","type":"address"},
        {"internalType":"uint256","name":"_fee","type":"uint256"},
        {"internalType":"uint256","name":"_refund","type":"uint256"},
        {"internalType":"uint256","name":"_rewardbits","type":"uint256"},
        {"internalType":"uint256","name":"_invest","type":"uint256"}
      ],
      "name":"collect",
      "outputs":[],
      "stateMutability":"payable",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"address","name":"_who","type":"address"}
      ],
      "name":"collectDividend",
      "outputs":[],
      "stateMutability":"nonpayable",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"uint256","name":"_commitHash","type":"uint256"},
        {"internalType":"uint256","name":"_maxUpdate","type":"uint256"}
      ],
      "name":"commit",
      "outputs":[],
      "stateMutability":"nonpayable",
      "type":"function"
    },
    { "inputs":[],
      "name":"commitBlockHash",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"commitHash",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"commitIndex",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"currentBalance",
      "outputs":
      [
        {"internalType":"uint128","name":"","type":"uint128"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"dividendFeePerCent",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"dividendPeriod",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"generator",
      "outputs":
      [
        {"internalType":"address","name":"","type":"address"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"generatorFeePerCent",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"lastRoot",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"maxUpdate",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"nextIndex",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "name":"nullifier",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"owner",
      "outputs":
      [
        {"internalType":"address","name":"","type":"address"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"uint256","name":"_amount","type":"uint256"}
      ],
      "name":"payOut",
      "outputs":[],
      "stateMutability":"nonpayable",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"uint256","name":"period","type":"uint256"}
      ],
      "name":"periodBets",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"periodBlocks",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"uint256","name":"period","type":"uint256"}
      ],
      "name":"periodShares",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "name":"periods",
      "outputs":
      [
        {"internalType":"uint128","name":"bets","type":"uint128"},
        {"internalType":"uint128","name":"shares","type":"uint128"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"uint256","name":"_secrethash","type":"uint256"},
        {"internalType":"uint256","name":"_power","type":"uint256"}
      ],
      "name":"play",
      "outputs":[],
      "stateMutability":"payable",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"uint256","name":"_secrethash","type":"uint256"},
        {"internalType":"uint256","name":"_power","type":"uint256"},
        {"internalType":"string","name":"_prayer","type":"string"}
      ],
      "name":"playAndPray",
      "outputs":[],
      "stateMutability":"payable",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"uint256","name":"_secrethash","type":"uint256"},
        {"internalType":"uint256","name":"_power","type":"uint256"}
      ],
      "name":"playETH",
      "outputs":[],
      "stateMutability":"payable",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"uint256","name":"_secrethash","type":"uint256"},
        {"internalType":"uint256","name":"_power","type":"uint256"},
        {"internalType":"string","name":"_prayer","type":"string"}
      ],
      "name":"playETHAndPray",
      "outputs":[],
      "stateMutability":"payable",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"uint256","name":"_betId","type":"uint256"},
        {"internalType":"string","name":"_prayer","type":"string"}
      ],
      "name":"pray",
      "outputs":[],
      "stateMutability":"payable",
      "type":"function"
    },
    { "inputs":[],
      "name":"prayer",
      "outputs":
      [
        {"internalType":"string","name":"","type":"string"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"rememberHash",
      "outputs":[],
      "stateMutability":"nonpayable",
      "type":"function"
    },
    { "inputs":[],
      "name":"reopen",
      "outputs":[],
      "stateMutability":"nonpayable",
      "type":"function"
    },
    { "inputs":[],
      "name":"resetcommit",
      "outputs":[],
      "stateMutability":"payable",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"uint256","name":"_revealSecret","type":"uint256"},
        {"internalType":"uint256[2]","name":"_pA","type":"uint256[2]"},
        {"internalType":"uint256[2][2]","name":"_pB","type":"uint256[2][2]"},
        {"internalType":"uint256[2]","name":"_pC","type":"uint256[2]"},
        {"internalType":"uint256","name":"_newRoot","type":"uint256"}
      ],
      "name":"reveal",
      "outputs":[],
      "stateMutability":"nonpayable",
      "type":"function"
    },
    {
      "inputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "name":"roots",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"router",
      "outputs":
      [
        {"internalType":"contract ISwapRouter","name":"","type":"address"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"uint256","name":"_revealSecret","type":"uint256"}
      ],
      "name":"secret",
      "outputs":[],
      "stateMutability":"nonpayable",
      "type":"function"
    },
    { "inputs":[],
      "name":"token",
      "outputs":
      [
        {"internalType":"contract IERC20","name":"","type":"address"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"update1",
      "outputs":
      [
        {"internalType":"contract IUpdate1","name":"","type":"address"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"update11",
      "outputs":
      [
        {"internalType":"contract IUpdate11","name":"","type":"address"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"update179",
      "outputs":
      [
        {"internalType":"contract IUpdate179","name":"","type":"address"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"update21",
      "outputs":
      [
        {"internalType":"contract IUpdate21","name":"","type":"address"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"update3",
      "outputs":
      [
        {"internalType":"contract IUpdate3","name":"","type":"address"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"update44",
      "outputs":
      [
        {"internalType":"contract IUpdate44","name":"","type":"address"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"update5",
      "outputs":
      [
        {"internalType":"contract IUpdate5","name":"","type":"address"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"update89",
      "outputs":
      [
        {"internalType":"contract IUpdate89","name":"","type":"address"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"updateDividendPeriod",
      "outputs":[],
      "stateMutability":"nonpayable",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"address","name":"_owner","type":"address"}
      ],
      "name":"walletBalanceOf",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"address","name":"_owner","type":"address"}
      ],
      "name":"walletDividendPeriodOf",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"address","name":"_owner","type":"address"}
      ],
      "name":"walletSharesOf",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":
      [
        {"internalType":"address","name":"_owner","type":"address"}
      ],
      "name":"walletWithdrawPeriodOf",
      "outputs":
      [
        {"internalType":"uint256","name":"","type":"uint256"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "inputs":[],
      "name":"withdraw",
      "outputs":
      [
        {"internalType":"contract IWithdraw","name":"","type":"address"}
      ],
      "stateMutability":"view",
      "type":"function"
    },
    { "stateMutability":"payable",
      "type":"receive"
    }
  ];
}

module.exports = {
  dex_address,
  dex_abi,
  weth_address,
  bet_min,
  rpc_url,
  foom_url,
  gas_price_limit,
  wait_blocks,
  log_start,
  foom_address,
  foom_abi,
  lottery_address,
  lottery_abi,
  weth_abi,
};
