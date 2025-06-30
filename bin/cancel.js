#!/usr/bin/node
const dotenv = require("dotenv");
const path = require("path");
const snarkjs = require("snarkjs");
const { ethers } = require("ethers");
const readline = require('readline');
const { hexToBigint, bigintToHex, leBigintToBuffer, reverseBits, leBufferToBigint } = require("./utils/bigint.js");
const { pedersenHash } = require("./utils/pedersen.js");
const { findBet, readSecretPowerIndex } = require("./utils/mimcMerkleTree.js");
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
  const inputs = process.argv.slice(2, process.argv.length);
  if(inputs.length == 0) {
    console.log("Usage: cancel.js <ticket>");
    process.exit(1);
  }
  const [secret,power,index] = readSecretPowerIndex(inputs[0]);
  if(!process.env.FOOM_URL) {
    process.env.FOOM_URL = chain.foom_url();
  }

  const hash = await pedersenHash(leBigintToBuffer(secret, 31));
  const hash_power1 = hash + power + 1n;
  const [betIndex,betRand,nextIndex] = findBet(hash_power1,index);
  if(betIndex>0 && betRand>0n){
    console.log("hash: %s", bigintToHex(hash_power1));
    throw("bet already processed for "+bigintToHex(hash_power1)+" starting at "+index.toString(10));
  }
  if(betIndex==0){
    console.log("hash: %s", bigintToHex(hash_power1));
    throw("bet not found for "+bigintToHex(hash_power1)+" starting at "+index.toString(10));
  }
  
  const input = {
    inHash: hash,
    secret: secret
  };
  console.log("Creating proof...");
  const { proof } = await snarkjs.groth16.fullProve(
    input,
    path.join(__dirname, "../groth16/cancelbet.wasm"),
    path.join(__dirname, "../groth16/cancelbet_final.zkey")
  );

  const pA = proof.pi_a.slice(0, 2);
  const pBin = proof.pi_b.slice(0, 2);
  const pB = [[pBin[0][1], pBin[0][0]], [pBin[1][1], pBin[1][0]]];
  const pC = proof.pi_c.slice(0, 2);

  const provider = new ethers.providers.JsonRpcProvider(chain.rpc_url());
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const lottery = new ethers.Contract(chain.lottery_address(), chain.lottery_abi(), wallet);
  const gasPrice = await provider.getGasPrice();
  console.log("GAS price: %s", ethers.utils.formatUnits(gasPrice, 9));

  const ask = sprintfjs.sprintf("Do You want to cancel the ticket now? (y/n): ");
  const answer = await question(ask);
  if(answer.toLowerCase() !== 'y') {
    process.exit(0);
  }
  
  const tx = await lottery.cancelbet(pA,pB,pC,betIndex,wallet.address, { gasPrice: gasPrice.mul(110).div(100) });
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
