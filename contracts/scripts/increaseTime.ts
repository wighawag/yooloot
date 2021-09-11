import {ethers} from 'hardhat';

const args = process.argv.slice(2);
const numberOfHours = parseInt(args[0]);

if (isNaN(numberOfHours)) {
  throw new Error('invalid number of hours : ' + args[0]);
}

async function main() {
  await ethers.provider.send('evm_increaseTime', [numberOfHours * 60 * 60]);
  await ethers.provider.send('evm_mine', []);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
