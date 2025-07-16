#!/usr/bin/node
//#!/usr/bin/node --env-file=.env

const dotenv = require("dotenv");
const fastcgi = require('node-fastcgi');
const { ethers } = require("ethers");
//const { readLast, readLastLog, writeLastLog, writeWaiting, writeRevealLock, readRevealLock, readWaitingBlocknumber,
//  update, putLeaves, readFees, getWaitingSum, writePrayer, writeRand, writeLastBet, readLastBet, readLastPeriod, appendLastPeriod } = require("./utils/mimcMerkleTree.js");
const tree = require("./utils/mimcMerkleTree.js");
const chain = require("./utils/chain.js");
const querystring = require('querystring');
const request = require('sync-request');

////////////////////////////// MAIN ///////////////////////////////////////////

async function sendTelegramMessage(message) {
  const apiKey = process.env.TELEGRAM_API_KEY;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if(!apiKey || !chatId) {
    return;
  }
  message = process.env.CHAIN+" "+process.env.HOSTNAME+" "+message;
  const postData = querystring.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML',
  });
  const url = `https://api.telegram.org/bot${apiKey}/sendMessage`;
  
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    // use request instead of fetch
    const response = request('POST', url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
      body: postData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.body;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.log('Telegram message request timed out');
    } else {
      console.log('Telegram message request failed:', error.message);
    }
    return null;
  }
}

async function rememberHash(provider,lottery) {
  const _open=1n;
  const blockNumber = await provider.getBlockNumber();
  const D = await lottery.D();
  const commitBlock = D.commitBlock;
  //const commitIndex = D.commitIndex;
  const commitBlockHash = await lottery.commitBlockHash();
  const period = D.dividendPeriod;
  if(commitBlock.gt(0) && commitBlockHash.eq(_open) &&  commitBlock.lt(blockNumber-30)) {
    if(commitBlock.lt(blockNumber-256)) {
      console.log("Commit failed:", commitBlock, blockNumber);
      if(process.env.COMMIT_FAILED == "0") {
        process.env.COMMIT_FAILED = "1";
        await sendTelegramMessage("Commit failed: "+commitBlock.toString()+" "+blockNumber.toString());
      }
      return;
    }
    const gasPrice = await provider.getGasPrice();
    const tx = await lottery.rememberHash({ gasPrice: gasPrice.mul(130).div(100) });
    console.log("Remember hash transaction:", tx);
    try {
      const receipt = await tx.wait(1,60000);
      console.log("Remember hash transaction receipt:", receipt);
      await sendTelegramMessage("Remember hash transaction successful");
    } catch(error) {
      console.log("Remember hash transaction failed:", error);
      await sendTelegramMessage("Remember hash transaction failed");
      process.exit(1);
    }
  }
  const minBets = process.env.MIN_BETS ? parseInt(process.env.MIN_BETS) : 179;
  const betsIndex = D.betsIndex;
  if(betsIndex > minBets + 5 && process.env.BETS_INDEX == "0") {
    process.env.BETS_INDEX = betsIndex.toString();
    await sendTelegramMessage("betsIndex: "+betsIndex.toString());
  }
  if(betsIndex == 0) {
    process.env.BETS_INDEX = "0";
  }
  /*if(commitIndex > 0n && commitBlockHash == _open) {
    const gasPrice = await provider.getGasPrice();
    const tx = await lottery.rememberHash({ gasPrice: gasPrice.mul(130).div(100) });
    console.log("Remember hash transaction:", tx);
    const receipt = await tx.wait();
    console.log("Remember hash transaction receipt:", receipt);
  }*/
  while(period > Number(process.env.LAST_PERIOD)+1) {
    process.env.LAST_PERIOD ++;
    const Period = await lottery.periods(process.env.LAST_PERIOD);
    tree.appendLastPeriod(process.env.LAST_PERIOD,Period.bets,Period.shares);
    // print bets and shares in millions
    const periodTxt = "Saved period: "+process.env.LAST_PERIOD+
      ", bets: "+ethers.utils.formatUnits(Period.bets, 18+6).replace(/\..*/, "")+" M FOOM"+
      ", shares: "+ethers.utils.formatUnits(Period.shares, 18+6).replace(/\..*/, "")+" M FOOM";
    console.log(periodTxt);
    await sendTelegramMessage(periodTxt);
    tree.keepLastLines("prayers.csv",100);
    tree.keepLastLines("period.csv",10);
  }
}

async function commit(provider,lottery) {
  const minBets = process.env.MIN_BETS ? parseInt(process.env.MIN_BETS) : 21;
  const minBlocks = process.env.MIN_BLOCKS ? parseInt(process.env.MIN_BLOCKS) : 30*60; // 60 minutes on Base
  const maxUpdate = process.env.MAX_UPDATE ? parseInt(process.env.MAX_UPDATE) : 179;
  const minBetSum = process.env.MIN_BET_SUM ? parseInt(process.env.MIN_BET_SUM) : 512; // power:9
  const blockNumber = await provider.getBlockNumber();
  // user correct structure of D:
  /*
    struct Data {
        uint64 periodStartBlock; // current dividend period started there
        uint64 commitBlock; // generator provided the random number secret in this block and will reaveal it soon
        uint32 nextIndex; // id of the next ticket, could be uint40 in the future
        uint16 dividendPeriod; // current dividend period
        uint8 betsLimit; // Limit bets when closing the lottery
        uint8 betsStart; // index of start of the queue of bets in buffer
        uint8 betsIndex; // index of the end of the queue of bets in buffer
        uint8 commitIndex; // number of bets in queue to insert into tree using the commited random number
        uint8 status; // reentrancy block
    }
    Data public D;
  */
  // read lottery.D() and parse nextIndex,betsIndex,commitIndex using struct Data
  const D = await lottery.D();
  const nextIndex = D.nextIndex;
  const betsIndex = D.betsIndex;
  const commitIndex = D.commitIndex;
  const waitingSum = betsIndex>0?tree.getWaitingSum(nextIndex,betsIndex):0;
  const [lastIndex,lastBlockNumber,lastRoot,lastLeaf] = tree.readLast();
  if(betsIndex > 0 && lastIndex == nextIndex && commitIndex == 0) {
    const waitingBlocknumber = tree.readWaitingBlocknumber();
    if((waitingBlocknumber > 0 && waitingBlocknumber <= blockNumber - minBlocks) ||
        (betsIndex >= minBets) || (waitingSum >= minBetSum)) {
      // commit if betsIndex is not 0 and enough time has passed
      const revealSecretInput = process.env.PRIVATE_KEY+'_FOOM_'+nextIndex.toString();
      //console.log(revealSecretInput,"reveal secret input");
      const revealSecret = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(revealSecretInput));
      const revealSecretHash = ethers.utils.keccak256(revealSecret);
      console.log(revealSecretHash,"reveal secret hash");
      const gasPrice = await provider.getGasPrice();
      console.log("Commit gasPrice:", ethers.utils.formatUnits(gasPrice, 9));
      const tx = await lottery.commit(revealSecretHash,maxUpdate, { gasPrice: gasPrice.mul(130).div(100) });
      console.log("Commit transaction:", tx);
      try {
        const receipt = await tx.wait(1,60000);
        console.log("Commit transaction receipt:", receipt);
      } catch(error) {
        console.log("Commit transaction failed:", error);
        await sendTelegramMessage("Commit transaction failed");
        process.exit(1);
      }
    }
  }
}

async function reveal(provider,lottery,index,commitIndex,commitHash,commitBlockHash,revealSecret) {
  const revealed=revealSecret!=0n;
  const nextIndex = await lottery.nextIndex();
  if(index == nextIndex) {
    if(revealSecret == 0n) {
      const revealSecretInput = process.env.PRIVATE_KEY+'_FOOM_'+nextIndex.toString();
      //console.log(revealSecretInput,"reveal secret input");
      revealSecret = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(revealSecretInput));
    }
    if(commitIndex == 0) {
      commitIndex = await lottery.commitIndex();
      commitHash = await lottery.commitHash();
      commitBlockHash = await lottery.commitBlockHash();
    }
    const revealSecretHash = ethers.utils.keccak256(revealSecret);
    console.log(revealSecretHash,"reveal secret hash");
    console.log(commitHash.toHexString(),"commitHash");
    if(commitHash.eq(revealSecretHash)) {
      if(tree.readRevealLock()== -index) {
        console.log("Reveal lock present");
        await sendTelegramMessage("Reveal lock present");
        return;
      }
      if(tree.readRevealLock()== index) {
        if(!revealed) {
          console.log("Reveal lock present without Secret");
          const gasPrice = await provider.getGasPrice();
          const tx = await lottery.secret(revealSecret, { gasPrice: gasPrice.mul(110).div(100) });
          try {
            const receipt = await tx.wait(1,60000);
            console.log("Secret transaction receipt:", receipt);
            tree.writeRevealLock(-index);
            await sendTelegramMessage("Reveal lock present without Secret");
          } catch(error) {
            console.log("Secret transaction failed:", error);
            await sendTelegramMessage("Secret transaction failed");
          }
        }
        return;
      }
      tree.writeRevealLock(index); 
      const newRand = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["bytes32","bytes32"],[revealSecret,commitBlockHash]));
      const newRandUint128 = ethers.BigNumber.from(newRand).toBigInt() & 0xffffffffffffffffffffffffffffffffn;
      try {
        const output = await tree.update(commitIndex,0,newRandUint128);
        const gasPrice = await provider.getGasPrice();
        const tx = await lottery.reveal(revealSecret,output.pA,output.pB,output.pC,output.newRoot, { gasPrice: gasPrice.mul(130).div(100) });
        try {
          const receipt = await tx.wait(1,60000);
          console.log("Reveal transaction receipt:", receipt);
          if(receipt.status == 1) {
            tree.writeRevealLock(0);
          } else {
            throw new Error("Reveal transaction failed");
          }
        } catch(error) {
          throw new Error("Reveal transaction failed");
        }
      } catch(error) {
        console.log("Reveal transaction failed:", error);
        if(!revealed) {
          // publish secret to the network
          const gasPrice = await provider.getGasPrice();
          const tx = await lottery.secret(revealSecret, { gasPrice: gasPrice.mul(110).div(100) });
          try {
            const receipt = await tx.wait(1,60000);
            console.log("Secret transaction receipt:", receipt);
            tree.writeRevealLock(-index);
          } catch(error) {
            console.log("Secret transaction failed:", error);
            await sendTelegramMessage("Secret transaction failed");
          }
        }
        await sendTelegramMessage("Reveal transaction failed");
        process.exit(1);
      }
    } else {
      console.log("Reveal secret hash does not match commit hash");
      await sendTelegramMessage("Reveal secret hash does not match commit hash");
    }
  }
}

async function readLogs(provider,lottery,generator,wallet,foomdex,foom,weth) {
  const CHUNK_SIZE = 99;
  let [lastIndex,lastBlockNumber,lastRoot,lastLeaf] = tree.readLast();
  let [logsBlockNumber,logsTransactionIndex] = tree.readLastLog();
  if(logsBlockNumber == 0) {
    logsBlockNumber = chain.log_start();
  }
  console.log(logsBlockNumber,"start");
  // use process.env.WAIT_BLOCKS to dalay reading logs
  const blockNumber = (await provider.getBlockNumber())-(process.env.WAIT_BLOCKS||chain.wait_blocks());
  for(let currentBlock = logsBlockNumber; currentBlock < blockNumber; currentBlock += CHUNK_SIZE+1) {
    const endBlock = Math.min(currentBlock + CHUNK_SIZE, blockNumber);
    console.log(`Querying blocks ${currentBlock} to ${endBlock} max ${blockNumber}`);    
    const logs = await lottery.queryFilter({}, currentBlock, endBlock);
    for(let i=0;i<logs.length;i++) {
      const log = logs[i];
      if(log.removed || log.blockNumber < logsBlockNumber || (log.blockNumber == logsBlockNumber && log.transactionIndex <= logsTransactionIndex)) {
        continue;
      }
      if(log.event == "LogChangeGenerator") {
        console.log("Change generator:", log.args);
        generator = log.args.generator;
      }
      else if(log.event == "LogBetIn") {
        console.log("Bet in:", log.args);
        const [betIndex,betBlockNumber] = tree.readLastBet();
        const newBetIndex = log.args.index;
        const power = (parseInt(log.args.newHash.toHexString().slice(-2),16) & 0x1f)-1;
        process.env.POWER = power; // remember power for logPrayer
        if(newBetIndex.gt(betIndex+1)) {
          tree.writeLastLog(betBlockNumber,-1);
          const betMissingTxt = "Bet missing:"+(betIndex+1)+"<"+newBetIndex.toString();
          console.log(betMissingTxt);
          await sendTelegramMessage(betMissingTxt);
          return generator;
        } else if(newBetIndex.eq(betIndex+1)) {
          tree.writeWaiting(newBetIndex,log.args.newHash,log.blockNumber);
          tree.writeLastBet(newBetIndex,log.blockNumber);
          /*// test missing a bet , tree.writeWaiting with 50% probability
          if(Math.random() < 0.5) {
            tree.writeWaiting(newBetIndex,log.args.newHash,log.blockNumber);
            tree.writeLastBet(newBetIndex,log.blockNumber);
          } else {
            console.log("Test bet lost:", betIndex + 1, newBetIndex.toString());
          }*/
        }
      }
      else if(log.event == "LogCancel") {
        console.log("Cancel:", log.args);
        tree.writeWaiting(log.args.index,ethers.BigNumber.from(0x20n),log.blockNumber);
      }
      else if(log.event == "LogUpdate") {
        console.log("LogUpdate:", log.args);
        const index = Number(log.args.index);
        if(index > lastIndex) {
          // print index and blockNumber in hex format
          console.log("Put leaves:", index.toString(16), log.args.newRand.toHexString(), log.args.newRoot.toHexString(), log.blockNumber.toString(16));
          try {
            await tree.putLeaves(index,BigInt(log.args.newRand),BigInt(log.args.newRoot),log.blockNumber);
          } catch(error) {
            console.error("Put leaves error:",error);
            tree.writeLastLog(lastBlockNumber,-1);
            await sendTelegramMessage("Put leaves error at "+index.toString(10));
            return generator;
          }
          tree.writeRand(lastIndex,index,log.args.newRand);
          [lastIndex,lastBlockNumber,lastRoot,lastLeaf] = tree.readLast();
          console.log("lastIndex:", lastIndex);
          // manage ETH balance
          const gasPrice = await provider.getGasPrice();
          await chain.manage(provider,wallet,lottery,foomdex,foom,weth,gasPrice,false);
        }
      }
      else if(log.event == "LogCommit") {
        console.log("LogCommit:", log.args);
        const index = Number(log.args.index);
        if(index == lastIndex) {
          if(generator == wallet.address) {
            await reveal(provider,lottery,index,Number(log.args.commitIndex),log.args.commitHash,log.blockHash,0n);
          }
        }
        else if (index >= lastIndex) {
          console.log("Commit missing:", index, lastIndex);
          tree.writeLastLog(lastBlockNumber,-1);
          await sendTelegramMessage("Commit missing at "+index.toString(10));
          return generator;
        }
      }
      else if(log.event == "LogSecret") {
        console.log("LogSecret:", log.args);
        if(log.args.lastRoot == lastRoot) {
          await reveal(provider,lottery,lastIndex,0,0n,0n,log.args.revealSecret);
        }
      }
      else if(log.event == "LogPrayer") {
        console.log("Prayer:", log.args);
        // convert prayer = array of bytes32 values to string and trim 00 suffix
        const prayer = log.args.prayer.map(p => ethers.utils.toUtf8String(p).replace(/\0*$/, '')).join("");
        tree.writePrayer(log.args.betId,process.env.POWER||0,log.blockNumber,prayer);
      }
      else {
        console.log("Log:", log);
      }
      tree.writeLastLog(log.blockNumber,log.transactionIndex);
    }
    tree.writeLastLog(endBlock+1,-1);
  }
  // write blockNumber to logs.csv
  return generator;
}

async function main() {
  dotenv.config();
  // remove FOOM_URL from process.env
  delete process.env.FOOM_URL;
  process.env.BETS_INDEX = "0";
  process.env.COMMIT_FAILED = "0";
  const inputs = process.argv.slice(2, process.argv.length);
  const task = inputs.length > 0 ? inputs[0] : "";
  const provider = new ethers.providers.JsonRpcProvider(chain.rpc_url());
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const lottery = new ethers.Contract(chain.lottery_address(), chain.lottery_abi(), wallet);
  let generator = await lottery.generator();
  process.env.LAST_PERIOD = await tree.readLastPeriod();
  //console.log("Wallet address:", wallet.address);
  //const balance = await provider.getBalance(wallet.address);
  //console.log("Wallet balance:", ethers.utils.formatEther(balance));
  const foomdex = new ethers.Contract(chain.dex_address(), chain.dex_abi(), wallet);
  const foom = new ethers.Contract(chain.foom_address(), chain.foom_abi(), wallet);
  const weth = new ethers.Contract(chain.weth_address(), chain.weth_abi(), wallet);

  // create a fastcgi server and start on port 9000
  const server = fastcgi.createServer(async (req, res) => {
    console.log("Request received");
    // read GET parameter
    try {
      // Parse query string directly from FastCGI request
      const queryString = req.url.split('?')[1] || '';
      const params = new URLSearchParams(queryString);
      const invest = params.get('invest');
      let invest_in_FOOM = 0;
      if(invest) {
        invest_in_FOOM = ethers.utils.parseUnits(invest, 18);
      }
      const receipt = params.get('receipt');
      if(receipt) {
        if(receipt.length != 962) {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end("ERROR: receipt is not 962 characters");
          return;
        }
        const d = ethers.utils.defaultAbiCoder.decode(["uint256[2]", "uint256[2][2]", "uint256[2]", "uint[7]"],receipt);
        const nullifierHash = d[3][1];
        const recipient = d[3][2].toHexString();
        const relayer = d[3][3].eq(0)?'0x0000000000000000000000000000000000000000':d[3][3].toHexString();
        const fee_in_FOOM = d[3][4];
        const refund_in_ETH = d[3][5];
        const rewardbits = d[3][6];
        const [min_fee_in_FOOM_tx,max_refund_in_ETH_tx] = tree.readFees();
        if(max_refund_in_ETH_tx == "0") {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end("ERROR: relayer not ready!");
          return;
        }
        const min_fee_in_FOOM = ethers.utils.parseUnits(min_fee_in_FOOM_tx, 18);
        const max_refund_in_ETH = ethers.utils.parseUnits(max_refund_in_ETH_tx, 18);
        if(fee_in_FOOM.lt(min_fee_in_FOOM)) {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end("ERROR: fee is too low "+ethers.utils.formatUnits(fee_in_FOOM, 18)+" < "+ethers.utils.formatUnits(min_fee_in_FOOM, 18));
          return;
        }
        if(refund_in_ETH.gt(max_refund_in_ETH)) {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end("ERROR: refund is too high "+ethers.utils.formatEther(refund_in_ETH)+" > "+ethers.utils.formatEther(max_refund_in_ETH));
          return;
        }
        if(relayer.toLowerCase() !== wallet.address.toLowerCase() && relayer !== "0x0000000000000000000000000000000000000000") {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end("ERROR: relayer address does not match "+relayer+" != "+wallet.address);
          return;
        }
        if(rewardbits.eq(0)) {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end("ERROR: no reward to claim!");
          return;
        }
        const collected = await lottery.nullifier(nullifierHash);
        if(collected.gt(0)) {
          console.log("ticket already collected!");
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end("ERROR: ticket already collected!");
          return;
        }
        const gasPrice = await provider.getGasPrice();
        console.log("GAS price: %s", ethers.utils.formatUnits(gasPrice, 9));
        if(gasPrice.gte(ethers.utils.parseUnits(chain.gas_price_limit() || "0.01", 9))) {
          console.log("GAS price is too high. Must be less than "+chain.gas_price_limit()+" gwei.");
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end("ERROR: GAS price is too high!");
          return;
        }
        const tx = await lottery.collect(d[0],d[1],d[2],d[3][0],d[3][1],recipient,relayer,d[3][4],d[3][5],d[3][6],invest_in_FOOM,
          { value: refund_in_ETH, gasPrice: gasPrice.mul(110).div(100) /*, gasLimit: 5000000*/ });
        console.log("tx hash: %s", tx);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("TX: "+tx.hash);
        await chain.manage(provider,wallet,lottery,foomdex,foom,weth,gasPrice,false);
      } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("ERROR: no receipt!");
        return;
      }
    } catch(error) {
      console.error(error);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end("ERROR: " + error.message);
    }
  });

  server.listen(chain.cgi_port(), '127.0.0.1', () => {
    console.log("Server started on port "+chain.cgi_port());
  });
  await sendTelegramMessage("Server started");

  // run forever
  while(true) {
    await rememberHash(provider,lottery);
    generator = await readLogs(provider,lottery,generator,wallet,foomdex,foom,weth);
    if(task == "commit" && generator == wallet.address) { // TODO, update generator if needed
      await commit(provider,lottery);
      generator = await readLogs(provider,lottery,generator,wallet,foomdex,foom,weth);
    }
    // wait 17 seconds
    console.log("Waiting 5 seconds");
    await new Promise(resolve => setTimeout(resolve, 5000));
    // TODO, manage ETH balance
    /*const balance = await provider.getBalance(wallet.address);
    console.log("ETH balance:", ethers.utils.formatEther(balance));
    if(balance.gt(ethers.utils.parseUnits("0.001", 18))) {
      const tx = await wallet.sendTransaction({ to: wallet.address, value: balance });
      console.log("ETH balance:", ethers.utils.formatEther(balance));
    }*/
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
