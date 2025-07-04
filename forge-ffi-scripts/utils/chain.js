const { ethers } = require("ethers");

function bet_min() {
  if(process.env.CHAIN == "BASE" || process.env.CHAIN == "ETHEREUM") {
    return "1000000";
  }
  throw new Error("CHAIN not set");
}

function cgi_port() {
  if(process.env.CGI_PORT){
    return process.env.CGI_PORT;
  }
  if(process.env.CHAIN == "BASE") {
    return '9000';
  }
  if(process.env.CHAIN == "ETHEREUM") {
    return '9001';
  }
  throw new Error("CHAIN not set");
}

async function sell(wallet, amountIn, amountOut, gasPrice, foom, weth) {
  let router_address='';
  let router_fee='';
  if(process.env.CHAIN == "BASE") {
    router_address = '0x2626664c2603336E57B271c5C0b26F421741e481';
    router_fee = 3000;
  } else if(process.env.CHAIN == "ETHEREUM") {
    router_address = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'; // confirm !!!
    router_fee = 500;
  } else {
    throw new Error("CHAIN not set");
  }

  const allowance = await foom.allowance(wallet.address, router_address);
  if(allowance.lt(amountIn)) {
    console.log("approving foom...");
    const approveTx = await foom.approve(router_address, amountIn.mul(10), { gasPrice: gasPrice.mul(110).div(100) });
    const approveReceipt = await approveTx.wait();
    console.log("approve tx hash: %s", approveReceipt.transactionHash);
  }
  const router = new ethers.Contract(router_address, router_abi(), wallet);
  const params = {
    tokenIn: foom_address(),
    tokenOut: weth_address(),
    fee: router_fee,
    recipient: wallet.address,
    amountIn: amountIn,
    amountOutMinimum: amountOut,
    sqrtPriceLimitX96: 0
  };
  const sellTx = await router.exactInputSingle(params, {gasPrice: gasPrice.mul(110).div(100)});
  const sellReceipt = await sellTx.wait();
  console.log("Sell tx hash: %s", sellReceipt.transactionHash);
  const wethBalance = await weth.balanceOf(wallet.address);
  //console.log("WETH balance: %s", ethers.utils.formatEther(wethBalance));
  const withdrawTx = await weth.withdraw(wethBalance);
  const withdrawReceipt = await withdrawTx.wait();
  console.log("Withdraw tx hash: %s", withdrawReceipt.transactionHash);
  return;
}

async function manage(provider, wallet, lottery, foomdex, foom, weth, gasPrice, verbose=false) {
  if(verbose){console.log("Wallet address:", wallet.address);}
  const balance = await provider.getBalance(wallet.address);
  const minBalance = ethers.utils.parseEther(min_balance());
  if(balance.gt(minBalance) && verbose==false){
    return;
  }
  if(verbose){console.log("ETH balance:", ethers.utils.formatEther(balance));}
  const wethBalance = await weth.balanceOf(wallet.address);
  if(verbose){console.log("WETH balance: %s", ethers.utils.formatEther(wethBalance));}
  let foomBalance = await foom.balanceOf(wallet.address);
  if(verbose){console.log("FOOM balance: %s", ethers.utils.formatEther(foomBalance));}
  const walletBalance = await lottery.walletBalanceOf(wallet.address);
  if(verbose){console.log("Lottery balance: %s", ethers.utils.formatUnits(walletBalance, 18));}
  const slot0 = await foomdex.slot0();
  const price_raw = ethers.BigNumber.from(slot0.sqrtPriceX96).mul(ethers.BigNumber.from(slot0.sqrtPriceX96)).mul(10n**18n).div(2n**192n);
  if(verbose){console.log("DEX FOOM raw price in ETH: %s", ethers.utils.formatEther(price_raw));}
  const price = chain.dex_inverse()?ethers.BigNumber.from(10n**36n).div(price_raw):price_raw;
  if(verbose){console.log("DEX FOOM price in ETH: %s", ethers.utils.formatEther(price));}
  if(balance.gt(minBalance)){
    return;
  }
  console.log("ETH balance low %s < %s ETH. Try refilling...", ethers.utils.formatEther(balance), ethers.utils.formatEther(minBalance));
  let foomNeeded = minBalance.mul(2n*(10n**36n)).div(price);
  console.log("Need %s FOOM", ethers.utils.formatEther(foomNeeded));
  if(walletBalance.gt(0)){
    const dividendPeriod = await lottery.dividendPeriod();
    if(verbose){console.log("Dividend period: %s", dividendPeriod);}
    const walletWithdrawPeriod = await lottery.walletWithdrawPeriodOf(wallet.address);
    if(verbose){console.log("Wallet withdraw period: %s", walletWithdrawPeriod);}
    if(walletWithdrawPeriod.gte(dividendPeriod)){
      console.log("PayOut %s FOOM", ethers.utils.formatEther(walletBalance));
      const payoutTx = await lottery.payOut(walletBalance, { gasPrice: gasPrice.mul(110).div(100) });
      const payoutReceipt = await payoutTx.wait();
      console.log("Payout tx hash: %s", payoutReceipt.transactionHash);
      foomBalance = await foom.balanceOf(wallet.address);
      if(verbose){console.log("FOOM balance after payout: %s", ethers.utils.formatEther(foomBalance));}
    }
  }
  if(foomBalance.lt(foomNeeded)){
    if(foomBalance.lt(foomNeeded.div(2))){
      console.log("Not enough FOOM for refill");
      return;
    }
    foomNeeded = foomBalance;
  }
  const amountOut = price.mul(foomNeeded).div(10n**18n).mul(95n).div(100n);
  await sell(wallet, foomNeeded, amountOut, gasPrice, foom, weth);
  const newBalance = await provider.getBalance(wallet.address);
  if(verbose){console.log("ETH balance after sell: %s", ethers.utils.formatEther(newBalance));}
}

function rpc_url() {
  if(process.env.RPC_URL){
    return process.env.RPC_URL;
  }
  if(process.env.CHAIN == "BASE") {
    return 'https://mainnet.base.org/';
  }
  if(process.env.CHAIN == "ETHEREUM") {
    return 'https://ethereum-rpc.publicnode.com';
  }
  throw new Error("CHAIN not set");
}

function foom_url() {
  if(process.env.FOOM_URL){
    return process.env.FOOM_URL;
  }
  if(process.env.CHAIN == "BASE") {
    return 'https://foom.cash/files/base';
  }
  if(process.env.CHAIN == "ETHEREUM") {
    return 'https://foom.cash/files/ethereum';
  }
  throw new Error("CHAIN not set");
}

function min_balance() {
  if(process.env.MIN_BALANCE){
    return process.env.MIN_BALANCE;
  }
  if(process.env.CHAIN == "BASE") {
    return "0.001";
  }
  if(process.env.CHAIN == "ETHEREUM") {
    return "0.01";
  }
  throw new Error("CHAIN not set");
}

function gas_price_limit() {
  if(process.env.GAS_PRICE_LIMIT){
    return process.env.GAS_PRICE_LIMIT;
  }
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
    return 22832278;
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

function dex_inverse() {
  if(process.env.CHAIN == "BASE") {
    return false;
  }
  if(process.env.CHAIN == "ETHEREUM") {
    return true;
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
  if(process.env.CHAIN == "BASE" || process.env.CHAIN == "ETHEREUM") {
    return [
      "function balanceOf(address) view returns (uint256)",
      "function approve(address,uint256) external returns (bool)",
      "function allowance(address,address) view returns (uint256)",
      "function walletBalanceOf(address) view returns (uint256)",
      "function withdraw(uint256) external",
      "function deposit() external payable",
    ];
  }
  throw new Error("CHAIN not set");
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
    return '0x239AF915abcD0a5DCB8566e863088423831951f8';
  }
  throw new Error("CHAIN not set");
}

function router_abi() {
  return [
    {"inputs":[
      {"internalType":"address","name":"_factoryV2","type":"address"},
      {"internalType":"address","name":"factoryV3","type":"address"},
      {"internalType":"address","name":"_positionManager","type":"address"},
      {"internalType":"address","name":"_WETH9","type":"address"}
      ],"stateMutability":"nonpayable","type":"constructor"
    },
    {"inputs":[],"name":"WETH9","outputs":[{"internalType":"address","name":"","type":"address"}],
      "stateMutability":"view","type":"function"
    },
    {"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"approveMax","outputs":[],
      "stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"approveMaxMinusOne","outputs":[],
      "stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"approveZeroThenMax","outputs":[],
      "stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"approveZeroThenMaxMinusOne","outputs":[],
      "stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"bytes","name":"data","type":"bytes"}],"name":"callPositionManager","outputs":[
      {"internalType":"bytes","name":"result","type":"bytes"}],"stateMutability":"payable","type":"function"
    },
    {"inputs":[
      {"internalType":"bytes[]","name":"paths","type":"bytes[]"},
      {"internalType":"uint128[]","name":"amounts","type":"uint128[]"},
      {"internalType":"uint24","name":"maximumTickDivergence","type":"uint24"},
      {"internalType":"uint32","name":"secondsAgo","type":"uint32"}
      ],"name":"checkOracleSlippage","outputs":[],"stateMutability":"view","type":"function"
    },
    {"inputs":[
      {"internalType":"bytes","name":"path","type":"bytes"},
      {"internalType":"uint24","name":"maximumTickDivergence","type":"uint24"},
      {"internalType":"uint32","name":"secondsAgo","type":"uint32"}
      ],"name":"checkOracleSlippage","outputs":[],"stateMutability":"view","type":"function"
    },
    {"inputs":[{"components":[
      {"internalType":"bytes","name":"path","type":"bytes"},
      {"internalType":"address","name":"recipient","type":"address"},
      {"internalType":"uint256","name":"amountIn","type":"uint256"},
      {"internalType":"uint256","name":"amountOutMinimum","type":"uint256"}
      ],"internalType":"struct IV3SwapRouter.ExactInputParams","name":"params","type":"tuple"}],
      "name":"exactInput","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],
      "stateMutability":"payable","type":"function"
    },
    {"inputs":[{"components":[
      {"internalType":"address","name":"tokenIn","type":"address"},
      {"internalType":"address","name":"tokenOut","type":"address"},
      {"internalType":"uint24","name":"fee","type":"uint24"},
      {"internalType":"address","name":"recipient","type":"address"},
      {"internalType":"uint256","name":"amountIn","type":"uint256"},
      {"internalType":"uint256","name":"amountOutMinimum","type":"uint256"},
      {"internalType":"uint160","name":"sqrtPriceLimitX96","type":"uint160"}
      ],"internalType":"struct IV3SwapRouter.ExactInputSingleParams","name":"params","type":"tuple"}],
      "name":"exactInputSingle","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],
      "stateMutability":"payable","type":"function"
    },
    {"inputs":[{"components":[
      {"internalType":"bytes","name":"path","type":"bytes"},
      {"internalType":"address","name":"recipient","type":"address"},
      {"internalType":"uint256","name":"amountOut","type":"uint256"},
      {"internalType":"uint256","name":"amountInMaximum","type":"uint256"}
      ],"internalType":"struct IV3SwapRouter.ExactOutputParams","name":"params","type":"tuple"}],
      "name":"exactOutput","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],
      "stateMutability":"payable","type":"function"
    },
    {"inputs":[{"components":[
      {"internalType":"address","name":"tokenIn","type":"address"},
      {"internalType":"address","name":"tokenOut","type":"address"},
      {"internalType":"uint24","name":"fee","type":"uint24"},
      {"internalType":"address","name":"recipient","type":"address"},
      {"internalType":"uint256","name":"amountOut","type":"uint256"},
      {"internalType":"uint256","name":"amountInMaximum","type":"uint256"},
      {"internalType":"uint160","name":"sqrtPriceLimitX96","type":"uint160"}
      ],"internalType":"struct IV3SwapRouter.ExactOutputSingleParams","name":"params","type":"tuple"}],
      "name":"exactOutputSingle","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],
      "stateMutability":"payable","type":"function"
    },
    {"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],
      "stateMutability":"view","type":"function"
    },
    {"inputs":[],"name":"factoryV2","outputs":[{"internalType":"address","name":"","type":"address"}],
      "stateMutability":"view","type":"function"
    },
    {"inputs":[{"internalType":"address","name":"token","type":"address"},
      {"internalType":"uint256","name":"amount","type":"uint256"}],
      "name":"getApprovalType","outputs":[{"internalType":"enum IApproveAndCall.ApprovalType","name":"","type":"uint8"}],
      "stateMutability":"nonpayable","type":"function"
    },
    {"inputs":[{"components":[{"internalType":"address","name":"token0","type":"address"},
      {"internalType":"address","name":"token1","type":"address"},
      {"internalType":"uint256","name":"tokenId","type":"uint256"},
      {"internalType":"uint256","name":"amount0Min","type":"uint256"},
      {"internalType":"uint256","name":"amount1Min","type":"uint256"}],
      "internalType":"struct IApproveAndCall.IncreaseLiquidityParams","name":"params","type":"tuple"}],
      "name":"increaseLiquidity","outputs":[{"internalType":"bytes","name":"result","type":"bytes"}],
      "stateMutability":"payable","type":"function"
    },
    {"inputs":[{"components":[{"internalType":"address","name":"token0","type":"address"},
      {"internalType":"address","name":"token1","type":"address"},
      {"internalType":"uint24","name":"fee","type":"uint24"},
      {"internalType":"int24","name":"tickLower","type":"int24"},
      {"internalType":"int24","name":"tickUpper","type":"int24"},
      {"internalType":"uint256","name":"amount0Min","type":"uint256"},
      {"internalType":"uint256","name":"amount1Min","type":"uint256"},
      {"internalType":"address","name":"recipient","type":"address"}],
      "internalType":"struct IApproveAndCall.MintParams","name":"params","type":"tuple"}],
      "name":"mint","outputs":[{"internalType":"bytes","name":"result","type":"bytes"}],
      "stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"bytes32","name":"previousBlockhash","type":"bytes32"},
      {"internalType":"bytes[]","name":"data","type":"bytes[]"}],
      "name":"multicall","outputs":[{"internalType":"bytes[]","name":"","type":"bytes[]"}],
      "stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"uint256","name":"deadline","type":"uint256"},
      {"internalType":"bytes[]","name":"data","type":"bytes[]"}],
      "name":"multicall","outputs":[{"internalType":"bytes[]","name":"","type":"bytes[]"}],
      "stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"bytes[]","name":"data","type":"bytes[]"}],
      "name":"multicall","outputs":[{"internalType":"bytes[]","name":"results","type":"bytes[]"}],
      "stateMutability":"payable","type":"function"
    },
    {"inputs":[],"name":"positionManager","outputs":[{"internalType":"address","name":"","type":"address"}],
      "stateMutability":"view","type":"function"
    },
    {"inputs":[{"internalType":"address","name":"token","type":"address"},
      {"internalType":"uint256","name":"value","type":"uint256"}],
      "name":"pull","outputs":[],"stateMutability":"payable","type":"function"
    },
    {"inputs":[],"name":"refundETH","outputs":[],"stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"address","name":"token","type":"address"},
      {"internalType":"uint256","name":"value","type":"uint256"},
      {"internalType":"uint256","name":"deadline","type":"uint256"},
      {"internalType":"uint8","name":"v","type":"uint8"},
      {"internalType":"bytes32","name":"r","type":"bytes32"},
      {"internalType":"bytes32","name":"s","type":"bytes32"}],
      "name":"selfPermit","outputs":[],"stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"address","name":"token","type":"address"},
      {"internalType":"uint256","name":"nonce","type":"uint256"},
      {"internalType":"uint256","name":"expiry","type":"uint256"},
      {"internalType":"uint8","name":"v","type":"uint8"},
      {"internalType":"bytes32","name":"r","type":"bytes32"},
      {"internalType":"bytes32","name":"s","type":"bytes32"}],
      "name":"selfPermitAllowed","outputs":[],"stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"address","name":"token","type":"address"},
      {"internalType":"uint256","name":"nonce","type":"uint256"},
      {"internalType":"uint256","name":"expiry","type":"uint256"},
      {"internalType":"uint8","name":"v","type":"uint8"},
      {"internalType":"bytes32","name":"r","type":"bytes32"},
      {"internalType":"bytes32","name":"s","type":"bytes32"}],
      "name":"selfPermitAllowedIfNecessary","outputs":[],"stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"address","name":"token","type":"address"},
      {"internalType":"uint256","name":"value","type":"uint256"},
      {"internalType":"uint256","name":"deadline","type":"uint256"},
      {"internalType":"uint8","name":"v","type":"uint8"},
      {"internalType":"bytes32","name":"r","type":"bytes32"},
      {"internalType":"bytes32","name":"s","type":"bytes32"}],
      "name":"selfPermitIfNecessary","outputs":[],
      "stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},
      {"internalType":"uint256","name":"amountOutMin","type":"uint256"},
      {"internalType":"address[]","name":"path","type":"address[]"},
      {"internalType":"address","name":"to","type":"address"}],
      "name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],
      "stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},
      {"internalType":"uint256","name":"amountInMax","type":"uint256"},
      {"internalType":"address[]","name":"path","type":"address[]"},
      {"internalType":"address","name":"to","type":"address"}],
      "name":"swapTokensForExactTokens","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],
      "stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"address","name":"token","type":"address"},
      {"internalType":"uint256","name":"amountMinimum","type":"uint256"},
      {"internalType":"address","name":"recipient","type":"address"}],
      "name":"sweepToken","outputs":[],"stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"address","name":"token","type":"address"},
      {"internalType":"uint256","name":"amountMinimum","type":"uint256"}],
      "name":"sweepToken","outputs":[],"stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"address","name":"token","type":"address"},
      {"internalType":"uint256","name":"amountMinimum","type":"uint256"},
      {"internalType":"uint256","name":"feeBips","type":"uint256"},
      {"internalType":"address","name":"feeRecipient","type":"address"}],
      "name":"sweepTokenWithFee","outputs":[],"stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"address","name":"token","type":"address"},
      {"internalType":"uint256","name":"amountMinimum","type":"uint256"},
      {"internalType":"address","name":"recipient","type":"address"},
      {"internalType":"uint256","name":"feeBips","type":"uint256"},
      {"internalType":"address","name":"feeRecipient","type":"address"}],
      "name":"sweepTokenWithFee","outputs":[],"stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"int256","name":"amount0Delta","type":"int256"},
      {"internalType":"int256","name":"amount1Delta","type":"int256"},
      {"internalType":"bytes","name":"_data","type":"bytes"}],
      "name":"uniswapV3SwapCallback","outputs":[],"stateMutability":"nonpayable","type":"function"
    },
    {"inputs":[{"internalType":"uint256","name":"amountMinimum","type":"uint256"},
      {"internalType":"address","name":"recipient","type":"address"}],
      "name":"unwrapWETH9","outputs":[],"stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"uint256","name":"amountMinimum","type":"uint256"}],
      "name":"unwrapWETH9","outputs":[],"stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"uint256","name":"amountMinimum","type":"uint256"},
      {"internalType":"address","name":"recipient","type":"address"},
      {"internalType":"uint256","name":"feeBips","type":"uint256"},
      {"internalType":"address","name":"feeRecipient","type":"address"}],
      "name":"unwrapWETH9WithFee","outputs":[],"stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"uint256","name":"amountMinimum","type":"uint256"},
      {"internalType":"uint256","name":"feeBips","type":"uint256"},
      {"internalType":"address","name":"feeRecipient","type":"address"}],
      "name":"unwrapWETH9WithFee","outputs":[],"stateMutability":"payable","type":"function"
    },
    {"inputs":[{"internalType":"uint256","name":"value","type":"uint256"}],
      "name":"wrapETH","outputs":[],"stateMutability":"payable","type":"function"
    },
    {"stateMutability":"payable","type":"receive"}
  ];
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
  cgi_port,
  dex_inverse,
  sell,
  manage
};
