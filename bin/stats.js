#!/usr/bin/node
const dotenv = require("dotenv");
const { ethers } = require("ethers");
const { readLast,getLines } = require("./utils/mimcMerkleTree.js");
const sprintfjs = require("sprintf-js");
const chain = require("../forge-ffi-scripts/utils/chain.js");

////////////////////////////// MAIN ///////////////////////////////////////////

async function main() {
  dotenv.config();
  if(!process.env.FOOM_URL) {
    process.env.FOOM_URL = chain.foom_url();
  }

  const provider = new ethers.providers.JsonRpcProvider(chain.rpc_url());
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const lottery = new ethers.Contract(chain.lottery_address(), chain.lottery_abi(), wallet);

  const foom = new ethers.Contract(chain.foom_address(), chain.foom_abi(), wallet);
  const foomBalance = await foom.balanceOf(lottery.address);
  console.log("FOOM Lottery balance: %s M FOOM", ethers.utils.formatEther(foomBalance)/1000000);
  // read last
  const [nextIndex,blockNumber,lastRoot,lastLeaf] = readLast();
  console.log("FOOM Lottery total number of tickets: %d", nextIndex);

  const lines = getLines('period.csv');
  for (let i = 0;i<10 && i<lines.length; i++) {
    //const period = await lottery.periods(i);
    //const bets = ethers.utils.formatUnits(period.bets.toString(), 18).replace(/\..*$/, "");
    //const shares = ethers.utils.formatUnits(period.shares.toString(), 18).replace(/\..*$/, "");
    //if(period.shares.eq(0)) {
    //  break;
    //}
    const [period_num,bets_hex,shares_hex] = lines[i].split(',');
    const bets = parseInt(ethers.utils.formatUnits('0x'+bets_hex, 18).replace(/\..*$/, "")/1000000);
    const shares = parseInt(ethers.utils.formatUnits('0x'+shares_hex, 18).replace(/\..*$/, "")/1000000);
    if(bets<shares) {
      //const apy = (1.0+0.04*bets/shares)**((60*60*24*365)/(16384*2))-1;
      const apy = (1.0+0.04*bets/shares)**((chain.blocks_per_minute()*60*24*365)/(16384))-1;
      console.log("Period %s: %s M volume, %s M shares, %s%% APY", period_num, bets, shares, sprintfjs.sprintf("%.2f", apy*100));
    }
    else {
      console.log("Period %s: %s M volume, %s M shares", period_num, bets, shares);
    }
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
