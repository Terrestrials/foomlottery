#!/usr/bin/node
const dotenv = require("dotenv");
const path = require("path");
const snarkjs = require("snarkjs");
const { ethers } = require("ethers");
const readline = require('readline');
const { hexToBigint, bigintToHex, leBigintToBuffer, reverseBits, leBufferToBigint } = require("./utils/bigint.js");
const { pedersenHash } = require("./utils/pedersen.js");
const { getPath, findBet, readFees, readSecretPowerIndex } = require("./utils/mimcMerkleTree.js");
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
  const inputs = process.argv.slice(2, process.argv.length);
  if(inputs.length == 0) {
    console.log("Usage: collect.js <ticket> <invest_in_FOOM:optional> <recipient_address:optional>");
    process.exit(1);
  }
  if(!process.env.FOOM_URL) {
    process.env.FOOM_URL = chain.foom_url();
  }
  const provider = new ethers.providers.JsonRpcProvider(chain.rpc_url());
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const lottery = new ethers.Contract(chain.lottery_address(), chain.lottery_abi(), wallet);

  const [secret,power,index] = readSecretPowerIndex(inputs[0]);
  const invest_in_FOOM = ethers.utils.parseUnits(inputs[1]||"0.0", 18);
  const recipient_address = hexToBigint(inputs[2]||wallet.address);
  const [min_fee_in_FOOM_tx,max_refund_in_ETH_tx,relayer_address_official] = readFees();
  let   fee_in_FOOM = ethers.utils.parseUnits(min_fee_in_FOOM_tx||"0.0", 18);
  let   refund_in_ETH = ethers.utils.parseUnits(max_refund_in_ETH_tx||"0.0", 18);
  let   relayer_address = hexToBigint(relayer_address_official||"0x0000000000000000000000000000000000000000");

  console.log("recipient_address:", ethers.utils.getAddress(recipient_address.toString(16)));
  console.log("relayer_address  :", ethers.utils.getAddress(relayer_address==0n?'0x0000000000000000000000000000000000000000':relayer_address.toString(16)));
  console.log("fee_in_FOOM:", ethers.utils.formatUnits(fee_in_FOOM, 18));
  console.log("refund_in_ETH:", ethers.utils.formatEther(refund_in_ETH));
  console.log("invest_in_FOOM:", ethers.utils.formatUnits(invest_in_FOOM, 18));
  //process.exit(0);

  const mimcsponge = await circomlibjs.buildMimcSponge();
  //const secret = secret_power>>8n;
  //const power = secret_power & 0x1fn;
  const hash = await pedersenHash(leBigintToBuffer(secret, 31));
  const hash_power1 = hash + power + 1n;
  const [betIndex,betRand,nextIndex] = findBet(hash_power1,index);
  if(betIndex>0 && betRand==0n){
    console.log("bet not processed yet for "+bigintToHex(hash_power1)+" starting at "+index.toString());
    process.exit(1);
  }
  if(betIndex==0){
    console.log("bet not found for "+bigintToHex(hash_power1)+" starting at "+index.toString());
    process.exit(1);
  }
  const bigindex = BigInt(betIndex);
  const dice = await leBufferToBigint(mimcsponge.F.fromMontgomery(mimcsponge.multiHash([secret,betRand,bigindex])));

  // 1.5. calculate reward
  const power1=10n;
  const power2=16n;
  const power3=22n;
  const mask = (power<=power1)?(((2n**(power1+power2+power3+1n)-1n)<<(power              ))                         )&(2n**(power1+power2+power3+1n)-1n) :
              ((power<=power2)?(((2n**(       power2+power3+1n)-1n)<<(power+power1       ))|(2n**(power1       )-1n))&(2n**(power1+power2+power3+1n)-1n) :
			                         (((2n**(              power3+1n)-1n)<<(power+power1+power2))|(2n**(power1+power2)-1n))&(2n**(power1+power2+power3+1n)-1n));
  const maskdice= mask & dice;
  const rew1 = (maskdice &                                       0b1111111111n)?0n:1n ;
  const rew2 = (maskdice &                       0b11111111111111110000000000n)?0n:1n ;
  const rew3 = (maskdice & 0b111111111111111111111100000000000000000000000000n)?0n:1n ;
  const rewardbits = 4n*rew3+2n*rew2+rew1;
  const reward = betMin.mul(rew1*2n**power1+rew2*2n**power2+rew3*2n**power3);
  console.log("Reward_in_FOOM: %s %s", ethers.utils.formatEther(reward), rewardbits==0n?'no need to claim!':'');

  const terces = reverseBits(dice,31*8);
  const nullifierHash = await pedersenHash(leBigintToBuffer(terces, 31));
  const collected = await lottery.nullifier(nullifierHash);
  if(collected.gt(0)) {
    console.log("ticket already collected!");
    process.exit(1);
  }  

  const gasPrice = await provider.getGasPrice();
  console.log("GAS price: %s", ethers.utils.formatUnits(gasPrice, 9));
  
  const ask = sprintfjs.sprintf("Do You want to calculate the receipt for collecting the reward%s? (y/n): ",rewardbits==0n?' anyway':'');
  const answer = await question(ask);
  if(answer.toLowerCase() !== 'y') {
    process.exit(0);
  }

  if(fee_in_FOOM.gt(0) && reward.gt(0) && relayer_address!=0n) {
    const ask3 = sprintfjs.sprintf("Do You want to collect the reward later at address %s through a relayer at address %s and invest %s FOOM in the lottery? (y/n): ",
      ethers.utils.getAddress(recipient_address.toString(16)), ethers.utils.getAddress(relayer_address.toString(16)), ethers.utils.formatUnits(invest_in_FOOM, 18));
    const answer3 = await question(ask3);
    if(answer3.toLowerCase() !== 'y') {
      fee_in_FOOM = ethers.utils.parseUnits("0.0", 18);
      refund_in_ETH = ethers.utils.parseUnits("0.0", 18);
      relayer_address = 0n;
    } 
  } else {
    fee_in_FOOM = ethers.utils.parseUnits("0.0", 18);
    refund_in_ETH = ethers.utils.parseUnits("0.0", 18);
    relayer_address = 0n;
  }

  const pathElements = await getPath(betIndex,nextIndex);
  // 4. Format witness input to exactly match circuit expectations
  const input = {
    // Public inputs
    root: pathElements[32],
    nullifierHash: nullifierHash,
    rewardbits: rewardbits,
    recipient: recipient_address,
    relayer: relayer_address,
    fee: hexToBigint(fee_in_FOOM.toHexString()),
    refund: hexToBigint(refund_in_ETH.toHexString()),
    // Private inputs
    secret: secret,
    power: power,
    rand: betRand,
    pathIndex: BigInt(betIndex),
    pathElements: pathElements.slice(0,32),
  };

  // 5. Create groth16 proof for witness
  console.log("Creating proof...");
  const { proof } = await snarkjs.groth16.fullProve(
    input,
    path.join(__dirname, "../groth16/withdraw.wasm"),
    path.join(__dirname, "../groth16/withdraw_final.zkey")
  );

  const pA = proof.pi_a.slice(0, 2);
  const pBin = proof.pi_b.slice(0, 2);
  const pB = [[pBin[0][1], pBin[0][0]], [pBin[1][1], pBin[1][0]]];
  const pC = proof.pi_c.slice(0, 2);

  // 6. Return abi encoded witness
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["uint256[2]", "uint256[2][2]", "uint256[2]", "uint[7]"],
    [ pA,pB,pC,
      [bigintToHex(pathElements[32]),
      bigintToHex(nullifierHash),
      bigintToHex(recipient_address),
      bigintToHex(relayer_address),
      bigintToHex(input.fee),
      bigintToHex(input.refund),
      bigintToHex(rewardbits)]
    ]
  );
  const d = ethers.utils.defaultAbiCoder.decode(["uint256[2]", "uint256[2][2]", "uint256[2]", "uint[7]"],encoded);

  if(fee_in_FOOM.gt(0)) {
    const ask3 = sprintfjs.sprintf("Do You want to collect the reward now at address %s through a relayer at address %s and invest %s FOOM in the lottery? (y/n): ",
      ethers.utils.getAddress(recipient_address.toString(16)), ethers.utils.getAddress(relayer_address.toString(16)), ethers.utils.formatUnits(invest_in_FOOM, 18));
    const answer3 = await question(ask3);
    if(answer3.toLowerCase() == 'y') {
      console.log("CONNECT: %s", `${process.env.FOOM_URL}/cgi?`);
      const invest_txt = ethers.utils.formatUnits(invest_in_FOOM, 18);
      const res = await fetch(`${process.env.FOOM_URL}/cgi?receipt=${encoded}&invest=${invest_txt}`);
      const data = await res.text();
      console.log("RESPONSE: %s", data);
      return;
    }
  }

  const ask2 = sprintfjs.sprintf("Do You want to collect the reward now yourself at address %s and invest %s FOOM in the lottery? (y/n): ",
    ethers.utils.getAddress(recipient_address.toString(16)), ethers.utils.formatUnits(invest_in_FOOM, 18));
  const answer2 = await question(ask2);
  if(answer2.toLowerCase() !== 'y') {
    console.log("Use this receipt for collecting later!\n");
    console.log(encoded);
    return;
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
