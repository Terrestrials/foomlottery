#!/usr/bin/node
const dotenv = require("dotenv");
const path = require("path");
const snarkjs = require("snarkjs");
const { ethers } = require("ethers");
const readline = require('readline');
const { hexToBigint, bigintToHex, leBigintToBuffer, reverseBits, leBufferToBigint } = require("./utils/bigint.js");
const { pedersenHash } = require("./utils/pedersen.js");
const { getPath, findBet, readFees } = require("./utils/mimcMerkleTree.js");
const circomlibjs = require("circomlibjs");
const sprintfjs = require("sprintf-js");
const chain = require("../forge-ffi-scripts/utils/chain.js");

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promise wrapper for readline question
function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}
////////////////////////////// MAIN ///////////////////////////////////////////

async function main() {
  dotenv.config();
  const betMin = ethers.utils.parseUnits(chain.bet_min(), 18);
  const power1=10;
  const power2=16;
  const power3=22;
  const inputs = process.argv.slice(2, process.argv.length);
  if(inputs.length == 0) {
    console.log("Usage: node collect_receipt.js <invest_in_FOOM> <receipt>");
    process.exit(1);
  }
  if(!process.env.FOOM_URL) {
    process.env.FOOM_URL = chain.foom_url();
  }
  const invest_in_FOOM = ethers.utils.parseUnits(inputs[0]||"0.0", 18);
  console.log("decode ...");
  const d = ethers.utils.defaultAbiCoder.decode(["uint256[2]", "uint256[2][2]", "uint256[2]", "uint[7]"],inputs[1]);
  console.log("decoded");
  const nullifierHash = d[3][1];
  const recipient_address = d[3][2];
  const relayer_address = d[3][3];
  const fee_in_FOOM = d[3][4];
  const refund_in_ETH = d[3][5];
  const rewardbits = d[3][6];

  console.log("recipient_address:", recipient_address.toHexString());
  console.log("relayer_address  :", (relayer_address==0?'0x0000000000000000000000000000000000000000':relayer_address.toHexString()));
  console.log("fee_in_FOOM:", ethers.utils.formatUnits(fee_in_FOOM, 18));
  console.log("refund_in_ETH:", ethers.utils.formatEther(refund_in_ETH));
  console.log("invest_in_FOOM:", ethers.utils.formatUnits(invest_in_FOOM, 18));

  const rew = rewardbits.toNumber();
  const rew1 = rew&1;
  const rew2 = rew&2;
  const rew3 = rew&4;
  const reward = betMin.mul(rew1*2**power1+rew2*2**power2+rew3*2**power3);
  console.log("Reward_in_FOOM: %s %s", ethers.utils.formatUnits(reward, 18), rewardbits.eq(0)?'no need to claim!':'');

  const provider = new ethers.providers.JsonRpcProvider(chain.rpc_url());
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const lottery = new ethers.Contract(chain.lottery_address(), chain.lottery_abi(), wallet);
  const collected = await lottery.nullifier(nullifierHash);
  if(collected.gt(0)) {
    console.log("ticket already collected!");
    process.exit(1);
  }

  const gasPrice = await provider.getGasPrice();
  console.log("GAS price: %s", ethers.utils.formatUnits(gasPrice, 9));

  if(fee_in_FOOM.gt(0)) {
    const ask3 = sprintfjs.sprintf("Do You want to collect the reward through a relayer at address %s now and invest %s FOOM in the lottery? (y/n): ",
      ethers.utils.getAddress(recipient_address.toHexString()), ethers.utils.formatUnits(invest_in_FOOM, 18));
    const answer3 = await question(ask3);
    if(answer3.toLowerCase() == 'y') {
      const [min_fee_in_FOOM_tx,max_refund_in_ETH_tx,relayer_address_official] = readFees();
      if(max_refund_in_ETH_tx == "0") {
        console.log("ERROR: relayer not ready!");
        process.exit(1);
      }
      if(relayer_address!=0 && relayer_address_official != ethers.utils.getAddress(relayer_address.toHexString())) {
        console.log("ERROR: relayer address does not match "+relayer_address_official+" != "+ethers.utils.getAddress(relayer_address.toHexString()));
        process.exit(1);
      }
      const min_fee_in_FOOM = ethers.utils.parseUnits(min_fee_in_FOOM_tx, 18);
      const max_refund_in_ETH = ethers.utils.parseUnits(max_refund_in_ETH_tx, 18);      
      if(fee_in_FOOM.lt(min_fee_in_FOOM)) {
        console.log("ERROR: fee is too low "+ethers.utils.formatUnits(fee_in_FOOM, 18)+" < "+ethers.utils.formatUnits(min_fee_in_FOOM, 18));
        process.exit(1);
      }
      if(refund_in_ETH.gt(max_refund_in_ETH)) {
        console.log("ERROR: refund is too high "+ethers.utils.formatEther(refund_in_ETH)+" > "+ethers.utils.formatEther(max_refund_in_ETH));
        process.exit(1);
      }
      // run curl 'FOOM_URL/cgi?receipt=encoded&invest=invest_in_FOOM'
      const res = await fetch(`${process.env.FOOM_URL}/cgi?receipt=${inputs[1]}&invest=${inputs[0]}`);
      const data = await res.text();
      console.log("RESPONSE: %s", data);
      return;
    }
  }

  const ask = sprintfjs.sprintf("Do You want to collect the reward yourself at address %s now and invest %s FOOM in the lottery%s? (y/n): ",
    ethers.utils.getAddress(recipient_address.toHexString()), ethers.utils.formatUnits(invest_in_FOOM, 18),rewardbits.eq(0)?' anyway':'');
  const answer = await question(ask);
  if(answer.toLowerCase() !== 'y') {
    process.exit(0);
  }

  const relayer = d[3][3].eq(0)?'0x0000000000000000000000000000000000000000':d[3][3].toHexString();
  //const tx = await lottery.collect(pA,pB,pC,pathElements[32],nullifierHash,inputs[1],inputs[2],hexToBigint(inputs[3]),hexToBigint(inputs[4]),rewardbits,hexToBigint(inputs[5]));
  const tx = await lottery.collect(d[0],d[1],d[2],d[3][0],d[3][1],d[3][2].toHexString(),relayer,d[3][4],d[3][5],d[3][6],invest_in_FOOM,
    { gasPrice: gasPrice.mul(110).div(100) });
  const receipt = await tx.wait();
  console.log("tx hash: %s", receipt.transactionHash);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
