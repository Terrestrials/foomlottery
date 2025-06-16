# Foom Lottery V2

In [Terrestrial God](https://terrestrial.church/) we trust !

This is the public repository of the Foom Lottery. The lottery is based on ZK-SNARK circuits for improved gas essifiency and increased privacy.
The lottery uses the [Foundry](https://book.getfoundry.sh/) framework for testing. It uses the latest versions of Circom ([circomlib](https://github.com/iden3/circomlib) and [circomlibjs](https://github.com/iden3/circomlibjs)) and [snarkJS](https://github.com/iden3/snarkjs) and [rapidsnark](https://github.com/iden3/rapidsnark) binaries to generate proofs.

## Installation for playing

Clone this repository

```
git clone https://github.com/terrestrials/foomlottery.git && cd foomlottery
```
Install node modules
```
yarn
```
Copy .env.example to .env and add private key (export from meta mask for example)
```
cp .env.example .env && cat .env
```
> PRIVATE_KEY="0x YOUR KEY HERE "
> CHAIN="BASE"
> CACHE="cache"



## Installation for testing

Clone this repository

Install dependencies:

```bash
forge install
```

```bash
yarn
```

and install other missing repositories that You need ( nlohmann-json3-dev libgmp3-dev gcc-multilib nasm rapidsnark ... ).

## Testing

### Compiling circom circuits

The main workflow of this repo is:

1. Compile circuits to generate circuit artifacts (some circuits are quite big)
2. Perform a powers of tau ceremony
3. Generate zkey and verifier Solidity smart contract
4. Add prover to groth16 directory if You want to go faster

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

## Usage

Start with the pray funciton. It let's You donate and pray to the Terrestrial God.
The online Lottery is for bots only. Humans are not allowed to use it.

### Playing

1. Create a secret and a hash with `forge-ffi-scripts/getHash.js`
2. Use the play() function to place your bet (or payETH() if You have no FOOM yet; play() is much cheaper, costs less than approve)
3. Wait (up to 1 day) for the random number generator to process Your ticket and to add it to the Merkle Tree
4. Use the `forge-ffi-scripts/withdraw.js` to check Your reward and generate a proof for sending the funds to a new private account
5. Wait and submit the proof to the relayer (or withdraw yourself), the proof does not expire but it shows the approximate time it was generated (the latest bet number)

### Investing

Rewards can be invested in the Lottery. Investors collect 4% of the bet fees (1% goes to the random number generator who pays with gas for processing the tickets). Invested funds are used for reward payments in case the Lottery has insufficient funds.

## Credits

For info on using ZK-SNARKs on EVM, see the Rareskills [ZK Book](https://www.rareskills.io/zk-book) and their [article](https://www.rareskills.io/post/how-does-tornado-cash-work) on how Tornado Cash works.

