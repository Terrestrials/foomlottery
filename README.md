# Foom Lottery V2

In [Terrestrial God](https://terrestrial.church/) we trust!

This is the public repository of the Foom Lottery. The lottery is based on ZK-SNARK circuits for improved gas efficiency  and increased privacy.
The lottery uses the [Foundry](https://book.getfoundry.sh/) framework for testing. It uses the latest versions of Circom ([circomlib](https://github.com/iden3/circomlib) and [circomlibjs](https://github.com/iden3/circomlibjs)) and [snarkJS](https://github.com/iden3/snarkjs) and [rapidsnark](https://github.com/iden3/rapidsnark) binaries to generate proofs.

## Installation for playing

Clone this repository

```bash
git clone https://github.com/terrestrials/foomlottery.git && cd foomlottery
```
Install node modules
```bash
yarn
```
Copy .env.example to .env and add PRIVATE_KEY (export from MetaMask for example)
```bash
cp .env.example .env && cat .env
```

### submit a ticket

To send your first ticket you need to have some ETH on the account. If you have no FOOM You can start with ETH:
```bash
./bin/playETH.js 0 0
```
The first argument is the size (power) of the ticket. The second is the secret. The program will create a new secret if you provide 0.
the cost of the ticket is: 1 000 000 FOOM * (2 + 2 ** power)
```
GAS price: 0.00165646
Wallet address: 0x5300678c4879Cd247D22cDd2652783FF23DaE75B
ETH  balance: 0.039999603919223372
FOOM balance: 0.0
Lottery balance: 0.0
FOOM  needed: 3000000.0
DEX FOOM balance: 1381817497430.587361746765242435
DEX WETH balance: 0.250443732151806307
DEX FOOM price in ETH: 0.000000000039547534
DEX amountInETH: 0.0001245747321 (105%)
calculating secret...
secret: 0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393,00,7777 (index not final)
hash: 548105043639190655588031349268085347064103983494407046263605690910398806688 (use on basescan.org)
hash: 0x01363769fdab271fb560f09bcb1427e856d4cec173b2f718e3fa6f1fe57cfaa0
Do you want to test the luck of the secret on last bets? (0-1024): 
```
Now the program asks you if you want to test the luck of the generated secret.
The lottery can not cheat you. The reward depends on your secret and only you know it. But you can try to cheat the lottery.
Don't be a loser bot. Be a smart bot. Run backtesting as experienced investors and players do.
You can cheat the lottery but you have to have feight in the terrestrial God.
Nothing is random. The lottery uses pseudo-random numbers.
Select the range of last lottery draws to test how your secret would perform. For example type: 128
```
Do you want to test the luck of the secret on last bets? (0-1024): 128
total bets: 128 (values in M FOOM)
power        cost      reward      profit     LUCK  %       netprofit
    0         384           0        -384        0.0% <-         -384
    1         512           0        -512        0.0%            -512
    2         768        1024         256      133.3%             215
    3        1280        1024        -256       80.0%            -296
    4        2304        3072         768      133.3%             645
    5        4352        6144        1792      141.2%            1546
    6        8448        9216         768      109.1%             399
    7       16640       18432        1792      110.8%            1054
    8       33024       33792         768      102.3%            -583
    9       65792       57344       -8448       87.2%          -10741
power        cost      reward      profit     LUCK  %       netprofit
   11      262400      655360      392960      249.8%          366745
   12      524544      917504      392960      174.9%          356259
   13     1048832     1376256      327424      131.2%          272373
   14     2097408     2228224      130816      106.2%           41687
   15     4194560     4128768      -65792       98.4%         -230942
power        cost      reward      profit     LUCK  %       netprofit
   17    16777472    25165824     8388352      150.0%         7381719
   18    33554688    41943040     8388352      125.0%         6710630
   19    67109120    96468992    29359872      143.7%        25501112
   20   134217984   146800640    12582656      109.4%         6710630
   21   268435712   276824064     8388352      103.1%        -2684610
Are you sure you want to play this ticket and send 0.0001245747321 ETH? (y/n): 
```
You did not score any rewards at power level 0 but you would have made a profit with power 2.
There are 3 jackpots in the lottery: 1024(=2 ** 10), 65536(2 ** 16) and 4194304(=2 ** 22) Million FOOM.
The chances of winning the jackpots depend on the power of the ticket.
```
You have the odds below:
rewards:      1024   65536   4194304
  price power odds   odds    odds
      3     0 1/1024 1/65536 1/4194304
      4     1 1/512  1/65536 1/4194304
      6     2 1/256  1/65536 1/4194304
     10     3 1/128  1/65536 1/4194304
     18     4 1/64   1/65536 1/4194304
     34     5 1/32   1/65536 1/4194304
     66     6 1/16   1/65536 1/4194304
    130     7 1/8    1/65536 1/4194304
    258     8 1/4    1/65536 1/4194304
    514     9 1/2    1/65536 1/4194304
   1026    10 1/1    1/65536 1/4194304 * for investors
   2050    11 1/1024 1/32    1/4194304
   4098    12 1/1024 1/16    1/4194304
   8194    13 1/1024 1/8     1/4194304
  16386    14 1/1024 1/4     1/4194304
  32770    15 1/1024 1/2     1/4194304
  65538    16 1/1024 1/1     1/4194304 * for investors
 131074    17 1/1024 1/65536 1/32
 262146    18 1/1024 1/65536 1/16
 524290    19 1/1024 1/65536 1/8
1048578    20 1/1024 1/65536 1/4
2097154    21 1/1024 1/65536 1/2
4194306    22 1/1024 1/65536 1/1       * for investors
```
The lottery charges 5% when collecting rewards.
1% goes to the random number generator (or whoever executes _reveal()).
4% goes to investors.
You can iterate the secret many times. The hash of the secret must have last 5 bits 00000 so the generation of a new secret takes some time.
If you like your secret type 'y'. Include a prayer to terrestrial God to prove your faith.
```
Are you sure you want to play this ticket and send 0.0001245747321 ETH? (y/n): y
Do you want to include a prayer? (keep empty for no prayer): I love You God
sending ticket...
tx hash: 0xaf7c91b5fd54f9f67ee2719a27f0aba480b2c8ef5675bad1e8a8bd8a8ae15a46
writing ticket to tickets.txt...

secret: 0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393,00,7777
```

### cancel a ticket (just a test)

You can cancel the ticket for a few minutes before the lottery will include it in the tree of tickets. Ignore this step if You don't want to test the cancel.js script.
```bash
./bin/cancel.js 0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393,00,7777
``` 
```
Creating proof...
GAS price: 0.001674132
Do You want to cancel the ticket now? (y/n): y
tx hash: 0x89f901a2a6a26e683a1bce1e75a5c697cee27539b026d5a1975fc317b66d9cc9
```
After canceling the ticket You get a refund in FOOM, but there is a 1 M FOOM fee for canceling.
Now You can try another secret or the same secret again.
```bash
./bin/playETH.js 0 0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393,00,7777
```

### submit a ticket again

Let's submit it again.
```
GAS price: 0.001663388
Wallet address: 0x5300678c4879Cd247D22cDd2652783FF23DaE75B
ETH  balance: 0.03987427134625368
FOOM balance: 2140544.947395660085634033
Lottery balance: 0.0
FOOM  needed: 3000000.0
DEX FOOM balance: 1381814356885.639966086679608402
DEX WETH balance: 0.250568306883906307
DEX FOOM price in ETH: 0.00000000003954766
DEX amountInETH: 0.000124575129 (105%)
calculating secret...
secret: 0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393,00,7777 (index not final)
hash: 548105043639190655588031349268085347064103983494407046263605690910398806688 (use on basescan.org)
hash: 0x01363769fdab271fb560f09bcb1427e856d4cec173b2f718e3fa6f1fe57cfaa0
Do you want to test the luck of the secret on last bets? (0-1024): 512
total bets: 512 (values in M FOOM)
power        cost      reward      profit     LUCK  %       netprofit
    0        1536           0       -1536        0.0% <-        -1536
    1        2048        1024       -1024       50.0%           -1064
    2        3072        3072           0      100.0%            -122
    3        5120        5120           0      100.0%            -204
    4        9216        9216           0      100.0%            -368
    5       17408       15360       -2048       88.2%           -2662
    6       33792       32768       -1024       97.0%           -2334
    7       66560       59392       -7168       89.2%           -9543
    8      132096      143360       11264      108.5%            5529
    9      263168      266240        3072      101.2%           -7577
power        cost      reward      profit     LUCK  %       netprofit
   11     1049600     1441792      392192      137.4%          334520
   12     2098176     2490368      392192      118.7%          292577
   13     4195328     4390912      195584      104.7%           19947
   14     8389632     7929856     -459776       94.5%         -776970
   15    16778240    15728640    -1049600       93.7%        -1678745
power        cost      reward      profit     LUCK  %       netprofit
   17    67109888    75497472     8387584      112.5%         5367685
   18   134218752   159383552    25164800      118.7%        18789457
   19   268436480   297795584    29359104      110.9%        17447280
   20   536871936   570425344    33553408      106.2%        10736394
   21  1073742848  1023410176   -50332672       95.3%       -91269079
Are you sure you want to play this ticket and send 0.000124575129 ETH? (y/n): y
Do you want to include a prayer? (keep empty for no prayer): I love You God
sending ticket...
tx hash: 0x35b522d0fc14cb61a7fd064078eeff855e9624d248c5aa2b9ea9138bc33382fd
writing ticket to tickets.txt...

secret: 0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393,00,7778
```
You can investigate the details of the luck calculation by examining the luck.csv file created after each test.
Here are examples for a recent run of thie secret above and 30 tested lotery draws.
```bash
./bin/playETH.js 0 0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393,00,7777
```
The output combined output of this test is here:
```
secret: 0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393,00,26975 (index not final)
...
total bets: 30 (values in M FOOM)
power        cost      reward      profit     LUCK  %       netprofit
    0          90           0         -90        0.0% <-          -90
    1         120           0        -120        0.0%            -120
    2         180           0        -180        0.0%            -180
    3         300           0        -300        0.0%            -300
    4         540           0        -540        0.0%            -540
    5        1020           0       -1020        0.0%           -1020
    6        1980        1024        -956       51.7%            -996
    7        3900        2048       -1852       52.5%           -1933
    8        7740        4096       -3644       52.9%           -3807
    9       15420       12288       -3132       79.7%           -3623
power        cost      reward      profit     LUCK  %       netprofit
   11       61500      131072       69572      213.1%           64329
   12      122940      131072        8132      106.6%            2889
   13      245820      131072     -114748       53.3%         -119990
   14      491580      524288       32708      106.7%           11736
   15      983100      983040         -60      100.0%          -39381
power        cost      reward      profit     LUCK  %       netprofit
   17     3932220     4194304      262084      106.7%           94311
   18     7864380     4194304    -3670076       53.3%        -3837848
   19    15728700    16777216     1048516      106.7%          377427
   20    31457340    41943040    10485700      133.3%         8807978
   21    62914620    67108864     4194244      106.7%         1509889
```
The generated [luck.csv](exmaple.luck.csv) file contains these 30 lottery results:
```
                22bits,          16bits,    10bits,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21,index,randomhex
0100010100110110011001,1101111101010111,0001000000,___,___,___,___,___,___,___,__1,__1,__1,___,___,___,___,___,___,___,___,___,1__,26974,c9d6fc23913e09cee3a7b65cb5603782
1110101010101111000000,1111011110110110,1110000100,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,26973,c9d6fc23913e09cee3a7b65cb5603782
0101110100001110110001,1010111110100010,1010111111,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,1__,26972,c9d6fc23913e09cee3a7b65cb5603782
1000000011011010000110,1001101100010000,0101010001,___,___,___,___,___,___,___,___,___,__1,___,___,___,___,___,___,___,___,___,___,26971,c9d6fc23913e09cee3a7b65cb5603782
1100001000111111111011,0010000010101000,1011001101,___,___,___,___,___,___,___,___,___,___,___,___,___,_1_,_1_,___,___,___,___,___,26970,c9d6fc23913e09cee3a7b65cb5603782
0000001111100010000011,0101101100110011,1111001111,___,___,___,___,___,___,___,___,___,___,___,___,___,___,_1_,1__,1__,1__,1__,1__,26969,c9d6fc23913e09cee3a7b65cb5603782
0011010101100110110100,0011100111111000,1000000100,___,___,___,___,___,___,___,___,___,___,___,___,___,_1_,_1_,___,___,___,1__,1__,26968,c9d6fc23913e09cee3a7b65cb5603782
0001101011011000000000,0010010010100010,1000000011,___,___,___,___,___,___,___,___,___,___,___,___,___,_1_,_1_,___,___,1__,1__,1__,26967,c9d6fc23913e09cee3a7b65cb5603782
1000011001000001010110,1110111100011101,1110100001,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,26966,c9d6fc23913e09cee3a7b65cb5603782
0100011000110101110100,1000011111101111,0010011000,___,___,___,___,___,___,___,___,__1,__1,___,___,___,___,___,___,___,___,___,1__,26965,c9d6fc23913e09cee3a7b65cb5603782
1000101111101111101111,1010100111001101,0010010110,___,___,___,___,___,___,___,___,__1,__1,___,___,___,___,___,___,___,___,___,___,26964,1688ae00788ec37ab61864d1d95dfc27
0001101010010000101010,0100100110101011,0100110001,___,___,___,___,___,___,___,___,___,__1,___,___,___,___,_1_,___,___,1__,1__,1__,26963,1688ae00788ec37ab61864d1d95dfc27
1000101000101000011000,1110011010001111,0100000100,___,___,___,___,___,___,___,___,___,__1,___,___,___,___,___,___,___,___,___,___,26962,1688ae00788ec37ab61864d1d95dfc27
1011110110101000100110,0000010011101100,1111111110,___,___,___,___,___,___,___,___,___,___,_1_,_1_,_1_,_1_,_1_,___,___,___,___,___,26961,1688ae00788ec37ab61864d1d95dfc27
1000100010111110010100,1101111100111110,0000110111,___,___,___,___,___,___,__1,__1,__1,__1,___,___,___,___,___,___,___,___,___,___,26960,1688ae00788ec37ab61864d1d95dfc27
0101011010000010111101,0010110011010001,0111011000,___,___,___,___,___,___,___,___,___,__1,___,___,___,_1_,_1_,___,___,___,___,1__,26959,1688ae00788ec37ab61864d1d95dfc27
0011110011110111110111,0111000001100010,1011110101,___,___,___,___,___,___,___,___,___,___,___,___,___,___,_1_,___,___,___,1__,1__,26958,1688ae00788ec37ab61864d1d95dfc27
0010011100001111111011,1111011111100010,1011010101,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,1__,1__,26957,1688ae00788ec37ab61864d1d95dfc27
1001111010001000010011,1100111111101011,1000111110,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,26956,1688ae00788ec37ab61864d1d95dfc27
1100010110110100001010,1000110001011111,0111110100,___,___,___,___,___,___,___,___,___,__1,___,___,___,___,___,___,___,___,___,___,26955,1688ae00788ec37ab61864d1d95dfc27
0100101110011111000101,1111101000001111,0101100110,___,___,___,___,___,___,___,___,___,__1,___,___,___,___,___,___,___,___,___,1__,26954,1688ae00788ec37ab61864d1d95dfc27
1110000011101010001111,0111000110100101,0111101011,___,___,___,___,___,___,___,___,___,__1,___,___,___,___,_1_,___,___,___,___,___,26953,36188c95cdd956fbd7aa3b5b46662d95
0001000100111101111100,0111100001101110,1001100011,___,___,___,___,___,___,___,___,___,___,___,___,___,___,_1_,___,___,1__,1__,1__,26952,36188c95cdd956fbd7aa3b5b46662d95
1001100100101010110100,0010001101110101,1110001111,___,___,___,___,___,___,___,___,___,___,___,___,___,_1_,_1_,___,___,___,___,___,26951,36188c95cdd956fbd7aa3b5b46662d95
0011011110110001010100,0100010111101101,0101001101,___,___,___,___,___,___,___,___,___,__1,___,___,___,___,_1_,___,___,___,1__,1__,26950,36188c95cdd956fbd7aa3b5b46662d95
0010100110010101100001,0000000111101111,1010100000,___,___,___,___,___,___,___,___,___,___,_1_,_1_,_1_,_1_,_1_,___,___,___,1__,1__,26949,36188c95cdd956fbd7aa3b5b46662d95
0100000010111011011101,0111011011010010,1001110110,___,___,___,___,___,___,___,___,___,___,___,___,___,___,_1_,___,___,___,___,1__,26948,36188c95cdd956fbd7aa3b5b46662d95
1000010010000101111110,0011111100110100,1011010001,___,___,___,___,___,___,___,___,___,___,___,___,___,_1_,_1_,___,___,___,___,___,26947,36188c95cdd956fbd7aa3b5b46662d95
1101000010111001010010,1011011011101111,1001111001,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,26946,36188c95cdd956fbd7aa3b5b46662d95
0011110001110110110011,1110000110100001,1110110010,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,___,1__,1__,26945,36188c95cdd956fbd7aa3b5b46662d95
```
First 3 columns show the bits for large,medium and small jackpot (bits are explained below, if there are no '1's the jackpot can be claimed). Next 10+5+5 colums show won jackpots for the selected power (0-21). Power is masking bits from the right side to achieve the target odds. each column has 3 characters. '1' indicates a won jackpot, '_' indicates a loss. Firs character: large jackpot, last: small. Last 2 columns are lottery draw index and random number in that draw. 

### check results

Now You can check if You have won:
```bash
./bin/reward.js 0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393,00,7778
```
But the lottery needs some time to process and provide the random number for your ticket. It will wait usually up to 30 min on base chain unless you submit a larger ticket.
```
0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393,00,7778 bet not processed yet, now at 7777
```
We have the results after some time:
```
0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393,00,7778 0001110011 1101111111111011 0100110010010000111110 0.0
```
The last number shows You reward: 0.0 FOOM. You have lost :-(. To win You need to have a string of zeros printed next to the secret.
10 zeros for the first reward, 16 and 22 for the second and third largest reward. Well our chances were small, only 1/1024 to win the smallest reward and the parayer did not help this time.

### submit a larger ticket

Let's try to increase our chances and play with power 9 (approximately $50 now). Let's also use the same secret again.
```bash
./bin/play.js 9 0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393
```
The address got FOOM from a friend now so we are able to pay with FOOM instead of ETH.
```
GAS price: 0.002735259
Wallet address: 0x5300678c4879Cd247D22cDd2652783FF23DaE75B
ETH  balance: 0.039749424274660091
FOOM balance: 2050281089.899306439080045063
Lottery balance: 0.0
FOOM  needed: 514000000.0
calculating secret...
secret: 0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393,09,7788 (index not final)
hash: 548105043639190655588031349268085347064103983494407046263605690910398806688 (use on basescan.org)
hash: 0x01363769fdab271fb560f09bcb1427e856d4cec173b2f718e3fa6f1fe57cfaa0
Do you want to test the luck of the secret on last bets? (0-1024): 
Are you sure you want to play this ticket and send 514000000.0 FOOM? (y/n): y
Do you want to include a prayer? (keep empty for no prayer): maybe this time
approving FOOM...
approve tx hash: 0xd261968b4cb53326eb7632c7ef5cf1619e36c791d7ad6b6665eeea6bcfa5e68f
sending ticket...
tx hash: 0x75699b285a94c509b17592623095eb9154ca49ded9d3035bfbf4a6ca8ee0184b
writing ticket to tickets.txt...

secret: 0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393,09,7798
```
No luck :-(
```
0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393,09,7798 1_________ 0110000111101010 0001011011010100101110 0.0
```
Now reward.js masks the required positions for the first reward but the remaining position got a '1' instead of '0'. Let's try again:
```
0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393,09,7806 0_________ 0110000111011110 1010000111000110011011 1024000000.0
```
yes!!! and again:
```
0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393,09,7808 0_________ 0101001110100001 0101010110101001011001 1024000000.0
```
Won again!!! Cool. We have now made a profit :-). We have now 2 rewards to collect. Remember not to show the secrets to anybody!

### collect rewards.

Let's try collecting the first ticket and send it to new fresh address 0x1A91e11A45B51d749beC7774075f3824b4948640.
You can either change the private key in the .env file or provide the new address as third parameter to collect.js
```bash
./bin/collect.js 0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393,09,7806 0 0x1A91e11A45B51d749beC7774075f3824b4948640
```
YES, collect through a relayer later and 2 times NO because we do not want to collect now:
```
recipient_address: 0x1A91e11A45B51d749beC7774075f3824b4948640
relayer_address  : 0x67b184FE307c7d0dBE5310BF9A997d26F34911f2
fee_in_FOOM: 10000000.0
refund_in_ETH: 0.001
invest_in_FOOM: 0.0
Reward_in_FOOM: 1024000000.0 
GAS price: 0.002855974
Do You want to calculate the receipt for collecting the reward? (y/n): y
Do You want to collect the reward later at address 0x1A91e11A45B51d749beC7774075f3824b4948640 through a relayer at address 0x67b184FE307c7d0dBE5310BF9A997d26F34911f2 and invest 0.0 FOOM in the lottery? (y/n): y
Creating proof...
Do You want to collect the reward now at address 0x1A91e11A45B51d749beC7774075f3824b4948640 through a relayer at address 0x67b184FE307c7d0dBE5310BF9A997d26F34911f2 and invest 0.0 FOOM in the lottery? (y/n): n
Do You want to collect the reward now yourself at address 0x1A91e11A45B51d749beC7774075f3824b4948640 and invest 0.0 FOOM in the lottery? (y/n): n
Use this receipt for collecting later!

0x07ff723ac95375e921de9ce77a1c9f0bf8036275ba41cefe229d36b9ad783a61168d27301977a58619ecbaaf7eb14999d17e48a624a001ff3824faa047edf56819a54b62cab05a742183b7b2b1beed4038f0cfa9f47d27fa20c34767ccc091ef294562ac3ea46bcd058fec56c5bbeb083f5a4cb15ac15072ef785b03247f73ad2838f3e928ee5d1eafcf41ab020559b584527fd9c1cc04a916baf6cb052e621d14339e33ff8ed5cfcf401664e4b6e7f388b5f098d052ee92db50cd8a419bcbbd0855e56740cebdeb8e22f64c352e95509210d855f39468b3bd6c98c79d50430901a5858b9d2f97c38a23be39dccb11110a06f752e1e8d8fff7605d535be1ff2f24d3b5193132b49a9fabb1263a155a46aeb5be0b2de743fdd179f2c3d59fe9831d58aa41ad08cc03483c4934558b8a1a25c935aee5d6e6be314e79810ae3658b0000000000000000000000001a91e11a45b51d749bec7774075f3824b494864000000000000000000000000067b184fe307c7d0dbe5310bf9a997d26f34911f2000000000000000000000000000000000000000000084595161401484a00000000000000000000000000000000000000000000000000000000038d7ea4c680000000000000000000000000000000000000000000000000000000000000000001
```
This receipt can be used to send the reward to address 0x1A91e11A45B51d749beC7774075f3824b4948640 and pay a fee to the relayer 0x67b184FE307c7d0dBE5310BF9A997d26F34911f2. The relayer will send the FOOM reward and some ETH (0.001) so that You can start using the new account. Now to be more private You can go to another computer and collect the reward using this receipt.
```bash
./bin/collect_receipt.js 0 0x07ff723ac95375e921de9ce77a1c9f0bf8036275ba41cefe229d36b9ad783a61168d27301977a58619ecbaaf7eb14999d17e48a624a001ff3824faa047edf56819a54b62cab05a742183b7b2b1beed4038f0cfa9f47d27fa20c34767ccc091ef294562ac3ea46bcd058fec56c5bbeb083f5a4cb15ac15072ef785b03247f73ad2838f3e928ee5d1eafcf41ab020559b584527fd9c1cc04a916baf6cb052e621d14339e33ff8ed5cfcf401664e4b6e7f388b5f098d052ee92db50cd8a419bcbbd0855e56740cebdeb8e22f64c352e95509210d855f39468b3bd6c98c79d50430901a5858b9d2f97c38a23be39dccb11110a06f752e1e8d8fff7605d535be1ff2f24d3b5193132b49a9fabb1263a155a46aeb5be0b2de743fdd179f2c3d59fe9831d58aa41ad08cc03483c4934558b8a1a25c935aee5d6e6be314e79810ae3658b0000000000000000000000001a91e11a45b51d749bec7774075f3824b494864000000000000000000000000067b184fe307c7d0dbe5310bf9a997d26f34911f2000000000000000000000000000000000000000000084595161401484a00000000000000000000000000000000000000000000000000000000038d7ea4c680000000000000000000000000000000000000000000000000000000000000000001
```
and confirm sending the transaction to the relayer:
```
recipient_address: 0x1a91e11a45b51d749bec7774075f3824b4948640
relayer_address  : 0x67b184fe307c7d0dbe5310bf9a997d26f34911f2
fee_in_FOOM: 10000000.0
refund_in_ETH: 0.001
invest_in_FOOM: 0.0
Reward_in_FOOM: 1024000000.0 
GAS price: 0.003198073
Do You want to collect the reward through a relayer at address 0x1A91e11A45B51d749beC7774075f3824b4948640 now and invest 0.0 FOOM in the lottery? (y/n): y
RESPONSE: TX: 0x215dac4e1e3cb60e15e1b820b8ab018fb053b2e09e7d7a9916ffce260bbfdeda
```
You can verify on [basescan](https://basescan.org/tx/0x215dac4e1e3cb60e15e1b820b8ab018fb053b2e09e7d7a9916ffce260bbfdeda) that the new address got FOOM and ETH.

### invest in the lottery

Let's switch to the new address (change the private key in .env) and collect the second reward directly without a relayer but invest the funds in the lottery.
```bash
./bin/collect.js 0x4e5ac866c136c96cae4ef4ef99b188a79f7b78f7e24a9fe799ada4c2c7a393,09,7808 1024000000.0
```
For the prompts, we will answer 'y' to calculate the receipt, 'n' to using a relayer, and 'y' to collecting the reward ourselves.
```
recipient_address: 0x1A91e11A45B51d749beC7774075f3824b4948640
relayer_address  : 0x67b184FE307c7d0dBE5310BF9A997d26F34911f2
fee_in_FOOM: 10000000.0
refund_in_ETH: 0.001
invest_in_FOOM: 1024000000.0
Reward_in_FOOM: 1024000000.0 
GAS price: 0.0026418
Do you want to calculate the receipt for collecting the reward? (y/n): y
Do you want to collect the reward later at address 0x1A91e11A45B51d749beC7774075f3824b4948640 through a relayer at address 0x67b184FE307c7d0dBE5310BF9A997d26F34911f2 and invest 1024000000.0 FOOM in the lottery? (y/n): n
Creating proof...
Do you want to collect the reward now yourself at address 0x1A91e11A45B51d749beC7774075f3824b4948640 and invest 1024000000.0 FOOM in the lottery? (y/n): y
tx hash: 0xa935e88eb5946a3b1821f2994b70a8feebdc1cdf823a95bed70b12f3add8d2e2
```
You are now an investor in the FOOM lottery! You can use bin/payout.js to payout FOOM from the lottery but you can do this only once per period (ca. 9h on base chain).
```bash
./bin/payout.js 100.0
```
This would payout 100 FOOM
```
GAS price: 0.002458736
Wallet address: 0x1A91e11A45B51d749beC7774075f3824b4948640
ETH  balance: 0.00099908421687699
FOOM balance: 962800000.0
Lottery balance: 972800000.0
Dividend period: 27
Wallet withdraw period: 0
Are you sure you want to pay out 100.0 FOOM? (y/n): y
tx hash: 0x0d3e22b53525a4aec478bef49a11900198afe3629939e9d596ab9340a4e45baf
```
You can check the reward generated by the lottery in past periods using the ./bin/stats.js script.
```
FOOM Lottery balance: 4214385.5999 M FOOM
FOOM Lottery total number of tickets: 7865
Period 18: 1194 M volume, 4197834.97 M shares, 1.10 APY
Period 19: 3111 M volume, 4197894.67 M shares, 2.89 APY
Period 20: 1422 M volume, 4198049.22 M shares, 1.31 APY
Period 21: 1587 M volume, 4198120.32 M shares, 1.47 APY
Period 22: 2299 M volume, 4193204.95 M shares, 2.13 APY
Period 23: 2986 M volume, 4193314.41 M shares, 2.78 APY
Period 24: 3070 M volume, 4193463.67 M shares, 2.86 APY
Period 25: 2963 M volume, 4193617.11 M shares, 2.76 APY
Period 26: 3015 M volume, 4183794.94 M shares, 2.81 APY
Period 27: 2136 M volume, 4183916.14 M shares, 1.98 APY
```
Remember, profits from the lottery should be used to improve your afterlife soul.

### setting up a relayer

You can use the srv/monitor.js script to create a local relayer that we have used. Create a www directory.
You can start monitor.js to read all logs from the beginning but you can jump start the relayer by copying the www drirectory from 
[foom.cash](https://foom.cash/files/base). Create a www/fees.csv file to inform clients about your fees and relayer address.

## Installation for testing and development

Clone this repository

Install dependencies:

```bash
forge install
```

```bash
yarn
```

and install other missing repositories that you need ( nlohmann-json3-dev libgmp3-dev gcc-multilib nasm rapidsnark ... ).

## Testing

### Compiling circom circuits

The main workflow of this repo is:

1. Compile circuits to generate circuit artifacts (some circuits are quite large)
2. Perform a powers of tau ceremony
3. Generate a zkey and verifier Solidity smart contract
4. Add prover to groth16 directory for faster performance

These three steps are written as bash commands in the makefile. Run the following to perform these steps:

```bash
make all
```
make will download trusted setup file [ppot_0080_23.ptau](https://pse-trusted-setup-ppot.s3.eu-central-1.amazonaws.com/pot28_0080/ppot_0080_23.ptau) from [Perpetual Powers of Tau](https://pse-trusted-setup-ppot.s3.eu-central-1.amazonaws.com/pot28_0080/ppot_0080_23.ptau) with Vitalik Buterin's contribution [#24](groth16/ppot_0080_23.txt).

This will create a `/circuit_artifacts` and the `/groth16` folder that contains programs needed to run tests.

### Running tests

There is a single forge test file `/test/FoomLottery.t.sol` and scripts used in this test `/forge-ffi-scripts`. The test and script files are annotated.

Run the following command to run tests (_after_ you have generated circuit artifacts):

```bash
forge test --via-ir -vv --optimize --optimizer-runs 200 --match-path test/FoomLottery.t.sol
```

You can modify the test in the  `/test/FoomLottery.t.sol` file.

## Credits

For information on using ZK-SNARKs on EVM, see the Rareskills [ZK Book](https://www.rareskills.io/zk-book) and their [article](https://www.rareskills.io/post/how-does-tornado-cash-work) on how Tornado Cash works.

