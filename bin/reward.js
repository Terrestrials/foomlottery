#!/usr/bin/node
const dotenv = require("dotenv");
const { ethers } = require("ethers");
const fs = require("fs");
const { hexToBigint, leBigintToBuffer, leBufferToBigint, bigintToHex } = require("./utils/bigint.js");
const { pedersenHash } = require("./utils/pedersen.js");
const { findBet, readSecretPowerIndex } = require("./utils/mimcMerkleTree.js");
const circomlibjs = require("circomlibjs");
const chain = require("../forge-ffi-scripts/utils/chain.js");

////////////////////////////// MAIN ///////////////////////////////////////////

function maskbits(bits,mask) {
  let bitstr = "";
  for(let i=0;i<bits.length;i++) {
    bitstr += mask.slice(i,i+1) == "1" ? bits.slice(i,i+1) : "_";
  }
  return bitstr; // reversed, but that's ok
}

async function main() {
  dotenv.config();
  const betMin = ethers.utils.parseUnits("1000000", 18);
  const inputs = process.argv.slice(2, process.argv.length);
  if(inputs.length == 0) {
    console.log("Usage: node reward.js <ticket or filename>");
    process.exit(1);
  }
  let tickets = [];
  if(inputs[0].startsWith("0x")) {
    tickets.push(inputs[0]);
  } else {
    const file = fs.readFileSync(inputs[0], "utf8");
    tickets = file.split("\n").filter(line => line.trim() !== "").map(line => line.trim());
  }
  if(!process.env.FOOM_URL) {
    process.env.FOOM_URL = chain.foom_url();
  }
  for(const ticket of tickets) {
    const [secret,power,index] = readSecretPowerIndex(ticket);

    const mimcsponge = await circomlibjs.buildMimcSponge();
    const hash = await pedersenHash(leBigintToBuffer(secret, 31));
    const hash_power1 = hash + power + 1n;
    //console.log("hash: %s", bigintToHex(hash_power1));
    const [betIndex,betRand,nextIndex] = findBet(hash_power1,index);
    if(betIndex>0 && betRand==0n){
      console.log(ticket+" bet not processed yet, now at "+betIndex.toString(10));
      continue;
    }
    if(betIndex==0){
      //console.log("hash: %s", bigintToHex(hash_power1));
      console.log(ticket+" bet not found");
      continue;
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
    const reward = betMin.mul(rew1*2n**power1+rew2*2n**power2+rew3*2n**power3);
    // convert to binary string with fixed length 10, 16, 22
    const mask1 = ( mask &                                       0b1111111111n      ).toString(2).padStart(10, '0');
    const mask2 = ((mask &                       0b11111111111111110000000000n)>>10n).toString(2).padStart(16, '0');
    const mask3 = ((mask & 0b111111111111111111111100000000000000000000000000n)>>26n).toString(2).padStart(22, '0');
    const bits1 = ( dice &                                       0b1111111111n      ).toString(2).padStart(10, '0');
    const bits2 = ((dice &                       0b11111111111111110000000000n)>>10n).toString(2).padStart(16, '0');
    const bits3 = ((dice & 0b111111111111111111111100000000000000000000000000n)>>26n).toString(2).padStart(22, '0');
    console.log(ticket+" "+maskbits(bits1,mask1)+" "+maskbits(bits2,mask2)+" "+maskbits(bits3,mask3)+" "+ethers.utils.formatEther(reward));
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
