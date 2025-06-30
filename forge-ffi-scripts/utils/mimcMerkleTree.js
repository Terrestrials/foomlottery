const circomlibjs = require("circomlibjs");
const { MerkleTree } = require("fixed-merkle-tree");
const { leBufferToBigint, hexToBigint, bigintToHex } = require("./bigint.js");
const { openSync, readFileSync, closeSync, existsSync, writeFileSync, mkdirSync } = require("fs");
const { execSync } = require('child_process');
const sprintfjs = require('sprintf-js');
const zlib = require('zlib');
const request = require('sync-request');
const { BigNumber } = require("ethers");
const MERKLE_TREE_HEIGHT = 32;

const zeros = [
  "0x24d599883f039a5cb553f9ec0e5998d58d8816e823bd556164f72aef0ef7d9c0",
  "0x0e5c230fa94b937789a1980f91b9de6233a7d0315f037c7d4917cba089e0042a",
  "0x255da7d5316310ad81de31bfd5b8272b30ce70c742685ac9696446f618399317",
  "0x1dd4b847fd5bdd5d53a661d8268eb5dd6629669922e8a0dcbbeedc8d6a966aaf"
];

function no0x(str) {
  return str.replace(/^0x0*/, '');
}

function touchfile(path) {
  if(!existsSync(path)) {
    writeFileSync(path, '');
  }
}

function readSecretPowerIndex(line) {
  if(line.match(/^0x[0-9a-fA-F]{64}/)) {
    const secret_power = hexToBigint(line.replace(/,.*/, ''));
    const startindex = parseInt(line.replace(/.*,/, ''));
    const secret = secret_power>>8n;
    const power = secret_power & 0x1fn;        
    return [secret,power,startindex];
  }
  if(line.match(/^0x[0-9a-fA-F]{62}/)) {
    const [secret_str,power_str,index_str] = line.split(',');
    return [hexToBigint(secret_str),BigInt(parseInt(power_str||"0",16)),parseInt(index_str||"0",10)];
  }
  return [0n,0n,0];
}
function printSecretPowerIndex(secret,power,index) {
  return sprintfjs.sprintf("0x%s,%s,%s",no0x(bigintToHex(secret)).padStart(62,'0'),no0x(bigintToHex(power)).padStart(2,'0'),index.toString(10));
}

function getLines(path) {
  let fileold;
  let textold;
  // collect data via https if FOOM_URL is set
  try {
    if(process.env.FOOM_URL && process.env.FOOM_URL.startsWith("http")) {
      // check if path in cache
      if(process.env.CACHE && existsSync(process.env.CACHE+"/"+path+".gz")) {
        fileold = openSync(process.env.CACHE+"/"+path+".gz", "r");
        textold = zlib.gunzipSync(readFileSync(fileold)).toString();
        closeSync(fileold);
      } else {
        const url = process.env.FOOM_URL + "/" + path + "?nocache=" + Date.now();
        const response = request('GET', url);
        if (response.statusCode !== 200) {
          return [];
        }
        // ungzip response if octet-stream
        if(response.headers['content-type'] === 'application/octet-stream') {
          textold = zlib.gunzipSync(response.getBody()).toString();
          if(process.env.CACHE) {
            const lines = textold.split("\n").filter((line) => line.trim() !== "");
            if(lines.length==256) {
              // remove filename from path
              const pathdir = path.replace(/\/[^/]+$/, '');
              mkdirSync(process.env.CACHE+"/"+pathdir, { recursive: true });
              writeFileSync(process.env.CACHE+"/"+path+".gz", response.getBody());
            }
            return lines;
          }
        } else {
          textold = response.getBody('utf8');
        }
      }
    } else if(existsSync("www/"+path)) {
      fileold = openSync("www/"+path, "r");
      textold = readFileSync(fileold, "utf8");
      closeSync(fileold);
    } else if(existsSync("www/"+path+".gz")) {
      fileold = openSync("www/"+path+".gz", "r"); // decompress the file
      textold = zlib.gunzipSync(readFileSync(fileold)).toString();
      closeSync(fileold);
    } else {
      return [];
    }
  } catch(e) {
    return [];
  }
  if(!textold || textold.length==0) {
    return [];
  }
  // remove empty lines
  return textold.split("\n").filter((line) => line.trim() !== "");
}

function keepLastLines(path,numLines){
  const lines = getLines(path);
  if(lines.length<=numLines) {
    return;
  }
  writeFileSync("www/"+path.replace(/\.csv$/,".old.csv"), lines.slice(0,lines.length-numLines).join("\n")+"\n", { flag: 'a' });
  writeFileSync("www/"+path, lines.slice(lines.length-numLines).join("\n")+"\n", { flag: 'w' });
}

function writeLast(nextIndex,blockNumber,lastRoot,lastLeaf){
  writeFileSync("www/last.csv", sprintfjs.sprintf("%x,%x,%s,%s\n",nextIndex,blockNumber,no0x(bigintToHex(lastRoot)),no0x(bigintToHex(lastLeaf))));
}

function readLast(){
  const lines = getLines("last.csv");
  if(lines.length==0) {
    throw new Error("Failed to read tree from "+(process.env.FOOM_URL||"www")+"/last.csv");
  }
  const [nextIndex,blockNumber,lastRoot,lastLeaf] = lines[0].split(',');
  return [parseInt(nextIndex,16), parseInt(blockNumber,16), hexToBigint(lastRoot), hexToBigint(lastLeaf)];
}

function writeRand(lastIndex,newIndex,newRand){
  const lastpath = sprintfjs.sprintf("%04x",lastIndex>>16);
  const path1 = lastpath.slice(0,2);
  const path2 = lastpath.slice(2,4);
  const newpath = sprintfjs.sprintf("%04x",newIndex>>16);
  writeFileSync("www/"+path1+"/"+path2+"/rand.csv",
    sprintfjs.sprintf("%s,%s,%s\n",no0x(lastIndex.toString(16)),no0x(newIndex.toString(16)),no0x(newRand.toHexString())), { flag: 'a' });
  if(newpath != lastpath) {
    execSync("gzip -9 www/"+path1+"/"+path2+"/rand.csv");
    const npath1 = newpath.slice(0,2);
    const npath2 = newpath.slice(2,4);
    writeFileSync("www/"+npath1+"/"+npath2+"/rand.csv",
    sprintfjs.sprintf("%s,%s,%s\n",no0x(lastIndex.toString(16)),no0x(newIndex.toString(16)),no0x(newRand.toHexString())), { flag: 'a' });
  }
}

function readRand(lastIndex,numRand){
  const lastpath = sprintfjs.sprintf("%04x",(lastIndex-numRand)>>16);
  const path1 = lastpath.slice(0,2);
  const path2 = lastpath.slice(2,4);
  const lines = getLines(path1+"/"+path2+"/rand.csv");
  let rands = [];
  for(let i=lines.length-1;i>=0;i--) {
    //console.log("lines[i]: %s", lines[i]);
    const [lastIndex,newIndex,newRand] = lines[i].split(',');
    const lastIndexNum = parseInt(lastIndex,16);
    const newIndexNum = parseInt(newIndex,16);
    for(let j=newIndexNum-1;j>=lastIndexNum;j--) {
      rands.push(sprintfjs.sprintf("%x,%s",j,newRand));
      if(rands.length>=numRand) {
        return rands;
      }
    }
  }
  return rands;
}

async function secretLuck(secret,nextIndex,numRand){
  const mimcsponge = await circomlibjs.buildMimcSponge();
  const rands = readRand(nextIndex,numRand);
  let wins = [];
  for(let i=0;i<23;i++) {
    wins.push(0);
  }
  wins.push(rands.length);
  for(let i=0;i<rands.length;i++) {
    const [betIndex,betRand] = rands[i].split(',');
    const bigBetIndex = hexToBigint(betIndex);
    const bigBetRand = hexToBigint(betRand);
    const dice = 0b111111111111111111111111111111111111111111111111n & leBufferToBigint(mimcsponge.F.fromMontgomery(mimcsponge.multiHash([secret,bigBetRand,bigBetIndex])));
    const rew1 = (dice &                                       0b1111111111n)?0:2**10 ;
    const rew2 = (dice &                       0b11111111111111110000000000n)?0:2**16 ;
    const rew3 = (dice & 0b111111111111111111111100000000000000000000000000n)?0:2**22 ;
    //if(rew1+rew2+rew3>0) {
    //  console.log("dice: %s, rew1: %d, rew2: %d, rew3: %d, betIndex: %s, betRand: %s", dice.toString(2).padStart(10+16+22,'0'), rew1, rew2, rew3, betIndex, betRand);
    //}
    wins[0] += rew1 + rew2 + rew3;
    for(let power=1;power<=10;power++) {
      const bigPower = BigInt(power);
      const newrew1 = (dice & (0b1111111111n<<bigPower) & 0b1111111111n)?0:2**10;
      wins[power] += newrew1 + rew2 + rew3;
    }
    for(let power=11;power<=16;power++) {
      const bigPower = BigInt(power);
      const newrew2 = (dice & (0b11111111111111110000000000n<<bigPower) & 0b11111111111111110000000000n)?0:2**16;
      wins[power] += rew1 + newrew2 + rew3;
    }
    for(let power=17;power<=22;power++) {
      const bigPower = BigInt(power);
      const newrew3 = (dice & (0b111111111111111111111100000000000000000000000000n<<bigPower) & 0b111111111111111111111100000000000000000000000000n)?0:2**22;
      wins[power] += rew1 + rew2 + newrew3;
    }
  }
  return wins;
}


function readFees(){
  const lines = getLines("fees.csv");
  if(lines.length==0) {
    return ["0","0",""];
  }
  const [fee_in_FOOM,refund_in_ETH,relayer_address] = lines[0].split(',');
  return [fee_in_FOOM,refund_in_ETH,relayer_address];
}

function writeLastBet(betIndex,blockNumber){
  writeFileSync("www/lastbet.csv", sprintfjs.sprintf("%s,%d\n",no0x(betIndex.toHexString()),blockNumber), { flag: 'w' });
}

function readLastBet(){
  const lines = getLines("lastbet.csv");
  if(lines.length==0) {
    const lines2 = getLines("waiting.csv");
    if(lines2.length==0) {
      return [0,0];
    }
    const [betIndex,newHash,blockNumber] = lines2[lines2.length-1].split(',');
    return [parseInt(betIndex,16), parseInt(blockNumber,10)];
  }
  const [betIndex,blockNumber] = lines[0].split(',');
  return [parseInt(betIndex,16), parseInt(blockNumber,10)];
}

function readLastPeriod(){
  const lines = getLines("period.csv");
  if(lines.length==0) {
    return 0;
  }
  const [period] = lines[lines.length-1].split(',');
  return parseInt(period,10);
}

function appendLastPeriod(period,bets,shares){
  writeFileSync("www/period.csv", sprintfjs.sprintf("%d,%s,%s\n",period,no0x(bets.toHexString()),no0x(shares.toHexString())), { flag: 'a' });
}

function writeLastLog(blockNumber,transactionIndex){
  writeFileSync("www/logs.csv", sprintfjs.sprintf("%d,%d\n",blockNumber,transactionIndex), { flag: 'w' });
}

function readLastLog(){
  const lines = getLines("logs.csv");
  const [blockNumber,transactionIndex] = lines[0].split(',');
  return [parseInt(blockNumber,10), parseInt(transactionIndex,10)];
}

function writeRevealLock(nextIndex){
  writeFileSync("www/reveallock.csv", sprintfjs.sprintf("%d\n",nextIndex), { flag: 'w' });
}

function readRevealLock(){
  const lines = getLines("reveallock.csv");
  if(lines.length==0) {
    return 0;
  }
  return parseInt(lines[0],10);
}

function writePrayer(betId,power,blockNumber,prayer){
  // escape prayer for csv content
  const escapedPrayer = prayer
    .replace(/"/g, '""') // escape quotes by doubling them
    .replace(/\n/g, '\\n') // escape newlines
    .replace(/\r/g, '\\r'); // escape carriage returns
  // always wrap in quotes since we need to handle commas and newlines
  writeFileSync("www/prayers.csv", sprintfjs.sprintf("%d,%d,%d,\"%s\"\n",betId,power,blockNumber,escapedPrayer), { flag: 'a' });
}

function writeWaiting(index,hash,blocknumber){
  writeFileSync("www/waiting.csv", sprintfjs.sprintf("%s,%s,%d\n",no0x(index.toHexString()),no0x(hash.toHexString()),blocknumber), { flag: 'a' });
}

function readWaitingBlocknumber(){
  const lines = getLines("waiting.csv");
  const values = lines[0].split(',');
  if(values.length==0) {
    return 0;
  }
  return parseInt(values[2],10);
}

function getIndexRand(hashstr,betIndex) {
  const path = sprintfjs.sprintf("%06x",betIndex>>8);
  const path1 = path.slice(0,2);
  const path2 = path.slice(2,4); 
  const path3 = path.slice(4,6);
  const lines = getLines(""+path1+"/"+path2+"/"+path3+".csv");
  for(let i=0;i<lines.length;i++) {
    const [index,skip,hash,myrand] = lines[i].split(',');
    const newIndex=(betIndex&0xffffff00) + parseInt(index,16);
    if(hash===hashstr && newIndex>=betIndex) {
      return [newIndex,hexToBigint(myrand)];
    }
  }
  return [0,0n];
}

function getIndexWaiting(hashstr) {
  const lines = getLines("waiting.csv");
  for(let i=0;i<lines.length;i++) {
    const [index,hash] = lines[i].split(',');
    if(hash===hashstr) {
      return [parseInt(index,16),0n];
    }
  }
  return [0,0n];
}

function findBet(inHash,startindex) {
  const [nextIndex,blockNumber,lastRoot,lastLeaf] = readLast();
  const hashstr = bigintToHex(inHash).replace(/^0x0*/, '');
  const maxIndex = startindex + 0x200;
  for(;(startindex&0xFFFFFF00)<nextIndex && startindex<=maxIndex;startindex+=0x100) {
    const [betIndex,betRand] = getIndexRand(hashstr,startindex);
    if(betIndex>0) {
      return [betIndex,betRand,nextIndex];
    }
  }
  return [...getIndexWaiting(hashstr),nextIndex];
}

function getWaitingList(nextIndex,hashesLength){
  const lines = getLines("waiting.csv");
  const hashes = new Array(hashesLength);
  lines.forEach((line) => {
    if (!line) return;  // Skip empty lines
    const [index,hash] = line.split(','); // assume hash in 2nd column in waiting.csv
    const indexnum = parseInt(index,16);
    if(indexnum >= nextIndex && indexnum < nextIndex + hashesLength) {
      hashes[indexnum-nextIndex] = hexToBigint(hash);
    }
  });
  return hashes;
}

function getWaitingSum(nextIndex,hashesLength){
  const hashes = getWaitingList(nextIndex,hashesLength);
  const sum = hashes.reduce((acc, hash) => acc + 2**(parseInt((hash&0x1fn).toString(16),16)-1), 0);
  return sum;
}

function getLeaves(path){
  const lines = getLines(path);
  const leaves = lines.map((line) => {
    const [index,hash] = line.split(',');
    return hexToBigint(hash);
  });
  return [leaves];
}

async function getLastPath(lastIndex){
  const path = sprintfjs.sprintf("%08x",lastIndex);
  const path1 = path.slice(0,2); const path1i=parseInt(path1,16);
  const path2 = path.slice(2,4); const path2i=parseInt(path2,16);
  const path3 = path.slice(4,6); const path3i=parseInt(path3,16);
  const path4 = path.slice(6,8); const path4i=parseInt(path4,16);

  const [leaves1] = getLeaves("index.csv");
  const [leaves2] = getLeaves(""+path1+"/index.csv");
  const [leaves3] = getLeaves(""+path1+"/"+path2+"/index.csv");
  const [leaves4] = getLeaves(""+path1+"/"+path2+"/"+path3+".csv");

  const tree4 = await mimicMerkleTree(hexToBigint(zeros[0]),leaves4,8);
  const mpath4 = tree4.path(path4i);
  const root4 = tree4.root;
  if(leaves3.length==path3i){
    leaves3.push(root4);}
  const tree3 = await mimicMerkleTree(hexToBigint(zeros[1]),leaves3,8);
  const root3 = tree3.root;
  const mpath3 = tree3.path(path3i);
  if(leaves2.length==path2i){
    leaves2.push(root3);}
  const tree2 = await mimicMerkleTree(hexToBigint(zeros[2]),leaves2,8);
  const root2 = tree2.root;
  const mpath2 = tree2.path(path2i);
  if(leaves1.length==path1i){
    leaves1.push(root2);}
  const tree1 = await mimicMerkleTree(hexToBigint(zeros[3]),leaves1,8);
  const newroot = tree1.root;
  const mpath1 = tree1.path(path1i);
  const pathElements = [...mpath4.pathElements, ...mpath3.pathElements, ...mpath2.pathElements, ...mpath1.pathElements];
  return [...pathElements,newroot];
}

async function getPath(index,nextIndex){
  const path = sprintfjs.sprintf("%08x",index);
  const path1 = path.slice(0,2); const path1i=parseInt(path1,16);
  const path2 = path.slice(2,4); const path2i=parseInt(path2,16);
  const path3 = path.slice(4,6); const path3i=parseInt(path3,16);
  const path4 = path.slice(6,8); const path4i=parseInt(path4,16);
  const npath = sprintfjs.sprintf("%08x",nextIndex);
  const npath1 = npath.slice(0,2); const npath1i=parseInt(npath1,16);
  const npath2 = npath.slice(2,4); const npath2i=parseInt(npath2,16);
  const npath3 = npath.slice(4,6); const npath3i=parseInt(npath3,16);

  const [leaves1] = getLeaves("index.csv");
  const [leaves2] = getLeaves(""+path1+"/index.csv");
  const [leaves3] = getLeaves(""+path1+"/"+path2+"/index.csv");
  const [leaves4] = getLeaves(""+path1+"/"+path2+"/"+path3+".csv");

  let tree4 = await mimicMerkleTree(hexToBigint(zeros[0]),leaves4,8);
  const mpath4 = tree4.path(path4i);
  if((index&0xFFFFFF00)!=(nextIndex&0xFFFFFF00)){
    const [nleaves4] = getLeaves(""+npath1+"/"+npath2+"/"+npath3+".csv");
    tree4 = await mimicMerkleTree(hexToBigint(zeros[0]),nleaves4,8);}
  const root4 = tree4.root;
  leaves3.push(root4);
  let tree3 = await mimicMerkleTree(hexToBigint(zeros[1]),leaves3,8);
  const mpath3 = tree3.path(path3i);
  if((index&0xFFFF0000)!=(nextIndex&0xFFFF0000)){
    const [nleaves3] = getLeaves(""+npath1+"/"+npath2+"/index.csv");
    tree3 = await mimicMerkleTree(hexToBigint(zeros[1]),nleaves3,8);}
  const root3 = tree3.root;
  leaves2.push(root3);
  let tree2 = await mimicMerkleTree(hexToBigint(zeros[2]),leaves2,8);
  const mpath2 = tree2.path(path2i);
  const root2 = tree2.root;
  if((index&0xFF000000)!=(nextIndex&0xFF000000)){
    const [nleaves2] = getLeaves(""+npath1+"/index.csv");
    tree2 = await mimicMerkleTree(hexToBigint(zeros[2]),nleaves2,8);}
  leaves1.push(root2);
  const tree1 = await mimicMerkleTree(hexToBigint(zeros[3]),leaves1,8);
  const newroot = tree1.root;
  const mpath1 = tree1.path(path1i);
  const pathElements = [...mpath4.pathElements, ...mpath3.pathElements, ...mpath2.pathElements, ...mpath1.pathElements];
  return [...pathElements,newroot];
}

async function getNewRoot(nextIndex,newLeaves){
  const path = sprintfjs.sprintf("%08x",nextIndex-1);
  const path1 = path.slice(0,2);
  const path2 = path.slice(2,4); 
  const path3 = path.slice(4,6);

  const [leaves1] = getLeaves("index.csv");
  const [leaves2] = getLeaves(""+path1+"/index.csv");
  const [leaves3] = getLeaves(""+path1+"/"+path2+"/index.csv");
  const [leaves4] = getLeaves(""+path1+"/"+path2+"/"+path3+".csv");

  const roots = new Array(2);

  const leaves2length=leaves2.length;
  const leaves3length=leaves3.length;
  const leaves4length=leaves4.length;
  leaves4.push(...newLeaves);
  if(leaves4.length>256){
    const tree4a = await mimicMerkleTree(hexToBigint(zeros[0]),leaves4.slice(0,256),8);
    roots[0] = tree4a.root;
    const tree4b = await mimicMerkleTree(hexToBigint(zeros[0]),leaves4.slice(256,leaves4.length),8);
    roots[1] = tree4b.root;
  } else {
    const tree4a = await mimicMerkleTree(hexToBigint(zeros[0]),leaves4,8);
    roots[0] = tree4a.root;
    roots[1] = hexToBigint(zeros[1]);
  }
  if(leaves4length==256){
    leaves3.push(roots[1]);}
  else{
    leaves3.push(...roots);}
  if(leaves3.length>256){
    const tree3a = await mimicMerkleTree(hexToBigint(zeros[1]),leaves3.slice(0,256),8);
    roots[0] = tree3a.root;  
    const tree3b = await mimicMerkleTree(hexToBigint(zeros[1]),leaves3.slice(256,leaves3.length),8);
    roots[1] = tree3b.root;  
  } else {
    const tree3a = await mimicMerkleTree(hexToBigint(zeros[1]),leaves3,8);
    roots[0] = tree3a.root;
    roots[1] = hexToBigint(zeros[2]);
  }
  if(leaves3length==256){
    leaves2.push(roots[1]);}
  else{
    leaves2.push(...roots);}
  if(leaves2.length>256){
    const tree2a = await mimicMerkleTree(hexToBigint(zeros[2]),leaves2.slice(0,256),8);
    roots[0] = tree2a.root;  
    const tree2b = await mimicMerkleTree(hexToBigint(zeros[2]),leaves2.slice(256,leaves2.length),8);
    roots[1] = tree2b.root;  
  } else {
    const tree2a = await mimicMerkleTree(hexToBigint(zeros[2]),leaves2,8);
    roots[0] = tree2a.root;
    roots[1] = hexToBigint(zeros[3]);
  }
  if(leaves2length==256){
    leaves1.push(roots[1]);}
  else{
    leaves1.push(...roots);}
  const tree1 = await mimicMerkleTree(hexToBigint(zeros[3]),leaves1,8);
  const newRoot = tree1.root;
  return newRoot;
}

async function mimicMerkleTree(zero,leaves = [],hight=MERKLE_TREE_HEIGHT) {
  const mimcsponge = await circomlibjs.buildMimcSponge();
  const mimcspongeMultiHash = (left, right) =>
    leBufferToBigint(
      mimcsponge.F.fromMontgomery(mimcsponge.multiHash([left, right]))
    );
  return new MerkleTree(hight, leaves, {
    hashFunction: mimcspongeMultiHash,
    zeroElement: zero,
  });
}

async function computeRoot(path,zero) {
  const hashes = new Array(256);
  // leave if file does not exists or is gzipped
  let needfix=0;
  const leafs = getLines(path);
  for(let i=0;i<leafs.length;i++) {
    const [numStr, leafStr] = leafs[i].split(',');
    const num = parseInt(numStr, 16);
    const leaf = hexToBigint(leafStr);    
    hashes[num] = leaf;
    if(num!=i){
      needfix++;
    }
  }
  if(needfix>0){
    writeFileSync("fix.csv", sprintfjs.sprintf("%s\n",path), { flag: 'a' }); // TODO, write block number too
  } else {
    execSync("gzip -9 www/"+path);
  }
  const tree = await mimicMerkleTree(zeros[zero],hashes,8);
  return tree.root;
}

function cleanwaiting(nextIndex) {
  const lines = getLines("waiting.csv");
  let textnew='';
  for(let i=0;i<lines.length;i++) {
    const [index] = lines[i].split(',');
    const indexnum = parseInt(index,16);
    if(indexnum>=nextIndex) {
      textnew+=lines[i]+"\n";
    }
  }
  writeFileSync("www/waiting.csv", textnew);
}

async function appendtofile(pathlast,text,hash) {
  // leave if file is gzipped
  const path = sprintfjs.sprintf("%06x",pathlast);
  const path1 = path.slice(0,2);
  const path2 = path.slice(2,4); 
  const path3 = path.slice(4,6);
  mkdirSync("www/"+path1+"/"+path2, { recursive: true });
  if(path3=="00") {
    touchfile("www/"+path1+"/"+path2+"/index.csv");
    if(path2=="00"){
      touchfile("www/"+path1+"/index.csv");
    }
  }
  writeFileSync("www/"+path1+"/"+path2+"/"+path3+".csv", text, { flag: 'a' });
  if(hash) {
    const root = await computeRoot(""+path1+"/"+path2+"/"+path3+".csv",0);
    writeFileSync("www/"+path1+"/"+path2+"/index.csv", sprintfjs.sprintf("%s,%s\n",path3,no0x(bigintToHex(root))), { flag: 'a' });
    if(path3=="ff"){
      const root = await computeRoot(""+path1+"/"+path2+"/index.csv",1);
      writeFileSync("www/"+path1+"/index.csv", sprintfjs.sprintf("%s,%s\n",path2,no0x(bigintToHex(root))), { flag: 'a' });
      if(path2=="ff"){
        const root = await computeRoot(""+path1+"/index.csv",2);
        writeFileSync("www/index.csv", sprintfjs.sprintf("%s,%s\n",path1,no0x(bigintToHex(root))), { flag: 'a' });
      }
    }
  }
}

async function putLeaves(newIndex,newRand,newRoot,blockNumber) {
  const mimcsponge = await circomlibjs.buildMimcSponge();

  const [nextIndex,lastBlockNumber,lastRoot,lastLeaf] = readLast();  // add lastLeaf
  if(newIndex<=nextIndex){
    return;}
  const commitIndex=newIndex-nextIndex;
  const newHashes = getWaitingList(nextIndex,commitIndex);
  const newLeaves = newHashes.slice(0, commitIndex).map((h,j) => leBufferToBigint(mimcsponge.F.fromMontgomery(mimcsponge.multiHash([h,newRand,BigInt(nextIndex)+BigInt(j)]))));
  const testRoot = await getNewRoot(nextIndex,newLeaves);
  if(testRoot!=newRoot){
    throw("root mismatch");}

  let pathlast=nextIndex>>8;
  let text='';
  for (let i=0;i<commitIndex;i++) {
    const pathnew = (nextIndex+i)>>8;
    if(pathnew!=pathlast) {
      await appendtofile(pathlast,text,true);
      text='';
      pathlast=pathnew;
    }
    text+=sprintfjs.sprintf("%x,%s,%s,%s\n",(nextIndex+i)&0xFF,no0x(bigintToHex(newLeaves[i])),no0x(bigintToHex(newHashes[i])),no0x(bigintToHex(newRand))); // index, leaf, hash, rand
  }
  await appendtofile(pathlast,text,((nextIndex+commitIndex)&0xff)==0?true:false);
  writeLast(nextIndex+commitIndex,blockNumber,newRoot,newLeaves[commitIndex-1]);
  cleanwaiting(nextIndex+commitIndex);
}

function updateSize(commitSize){
  if(commitSize==1){
    return(1);}
  if(commitSize<=3){ 
    return(3);}
  if(commitSize<=5){
    return(5);}
  if(commitSize<=11){
    return(11);}
  if(commitSize<=21){
    return(21);}
  if(commitSize<=44){
    return(44);}
  if(commitSize<=89){
    return(89);}
  if(commitSize<=179){
    return(179);}
  throw("bad commitSize");
}

async function update(commitIndex,hashesLength,newRand){
  if(hashesLength==0) {
    hashesLength=updateSize(commitIndex);
  }
  const mimcsponge = await circomlibjs.buildMimcSponge();
  const [nextIndex,blockNumber,lastRoot,lastLeaf] = readLast();  // add lastLeaf
  const newHashes = getWaitingList(nextIndex,commitIndex);
  const newLeaves = newHashes.slice(0, commitIndex).map((h,j) => leBufferToBigint(mimcsponge.F.fromMontgomery(mimcsponge.multiHash([h,newRand,BigInt(nextIndex)+BigInt(j)]))));
  const newRoot = await getNewRoot(nextIndex,newLeaves);
  const hashes = new Array(hashesLength).fill(null).map((x,j) => (j<commitIndex?newHashes[j]:0n));

  const pathElements = await getLastPath(nextIndex-1);

  const input = {
    // Public inputs
    oldRoot: lastRoot,
    newRoot: newRoot,
    index: nextIndex-1,
    newRand: newRand,
    newhashes: hashes,
    // Private inputs
    oldLeaf: lastLeaf,
    pathElements: pathElements.slice(0,32),
  };

  // Write input to input.json
  BigInt.prototype.toJSON = function () { return this.toString(); };
  writeFileSync('groth16/update'+hashesLength+'_input.json', JSON.stringify(input, null, 2));
  //console.log(JSON.stringify(input));

  let proof;
  if(existsSync('groth16/prover')){
    // 5. Create groth16 proof for witness with rapidsnark
    let stdout = execSync("cd groth16 && "+
      "./update"+hashesLength+" update"+hashesLength+"_input.json update"+hashesLength+"_output.wtns && "+
      "./prover update"+hashesLength+"_final.zkey update"+hashesLength+"_output.wtns update"+hashesLength+"_proof.json "+
      "update"+hashesLength+"_public.json && "+
      "sed -i 's/}.*/}/g' update"+hashesLength+"_proof.json && "+
      "sed -i 's/].*/]/g' update"+hashesLength+"_public.json" );
    // read proof.json and parse to json object
    proof = JSON.parse(readFileSync('groth16/update'+hashesLength+'_proof.json', 'utf8'));
  } else {
  // 5. Create groth16 proof for witness with snarkjs
    proof = await snarkjs.groth16.fullProve(input,"groth16/update"+hashesLength+".wasm","groth16/update"+hashesLength+"_final.zkey");
  }

  const pA = proof.pi_a.slice(0, 2);
  const pB = proof.pi_b.slice(0, 2);
  const pC = proof.pi_c.slice(0, 2);

  const output = {
    pA: pA,
    pB: [[pB[0][1], pB[0][0]],[pB[1][1], pB[1][0]]], // Swap x coordinates for proof verification with the Solidity precompile for EC Pairings, and not required for verification with e.g. snarkJS.
    pC: pC,
    lastRoot: lastRoot,
    newRoot: newRoot,
    index: nextIndex-1,
    newRand: newRand,
    hashes: hashes,
  }
  return output;
}

module.exports = {
  mimicMerkleTree,
  readLast,
  getLeaves,
  getPath,
  getLastPath,
  getIndexWaiting,
  getIndexRand,
  findBet,
  getNewRoot,
  getWaitingList,
  getLines,
  readLastLog,
  writeLastLog,
  writeWaiting,
  readRevealLock,
  writeRevealLock,
  no0x,
  putLeaves,
  readWaitingBlocknumber,
  update,
  readFees,
  getWaitingSum,
  writePrayer,
  writeRand,
  secretLuck,
  writeLastBet,
  readLastBet,
  readLastPeriod,
  appendLastPeriod,
  keepLastLines,
  readSecretPowerIndex,
  printSecretPowerIndex,
};
