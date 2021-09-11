import {expect} from './chai-setup';
import {
  ethers,
  deployments,
  getUnnamedAccounts,
  getNamedAccounts,
} from 'hardhat';
import {Loot, YooLoot} from '../typechain';
import {
  getLatestBlockTimestamp,
  increaseTime,
  setupUser,
  setupUsers,
  waitFor,
} from './utils';
import {solidityKeccak256} from 'ethers/lib/utils';
import {Wallet} from '@ethersproject/wallet';

const setup = deployments.createFixture(async () => {
  await deployments.fixture(['YooLoot_mloot']);
  const contracts = {
    YooLoot_mloot: <YooLoot>await ethers.getContract('YooLoot_mloot'),
    MLoot: <Loot>await ethers.getContract('MLoot'),
  };
  const {deployer: deployerAddress} = await getNamedAccounts();
  const users = await setupUsers(await getUnnamedAccounts(), contracts);
  const deployer = await setupUser(deployerAddress, contracts);
  return {
    ...contracts,
    users,
    deployer,
  };
});

describe('YooLoot_mloot', function () {
  it('getParams', async function () {
    const {users, YooLoot_mloot} = await setup();
    await YooLoot_mloot.getParams();
  });
});
