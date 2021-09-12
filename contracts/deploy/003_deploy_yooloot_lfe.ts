import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {constants} from 'ethers';
import {deployments} from 'hardhat';
const {AddressZero} = constants;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployer} = await hre.getNamedAccounts();
  const {deploy, execute, read} = hre.deployments;

  if (hre.network.name.startsWith('arbitrum')) {
    return;
  }

  const YooLoot = await hre.deployments.get('YooLoot');
  const LootForEveryone = await hre.deployments.get('LootForEveryone');

  function daysIn3HPeriods(numDays: number) {
    return numDays * 8;
  }

  let commit3HPeriod = daysIn3HPeriods(7);
  let reveal3HPeriod = daysIn3HPeriods(3);
  let winner3HPeriod = daysIn3HPeriods(1);

  if (hre.network.name === 'goerli') {
    commit3HPeriod = 1;
    reveal3HPeriod = 1;
    winner3HPeriod = 1;
  }

  const receipt = await execute(
    'YooLoot',
    {from: deployer, log: true},
    'clone',
    LootForEveryone.address,
    true,
    commit3HPeriod,
    reveal3HPeriod,
    winner3HPeriod
  );

  if (receipt.events) {
    const {
      newYooLoot,
      authorizedAsXPSource,
    }: {
      newYooLoot: string;
      authorizedAsXPSource: boolean;
    } = receipt.events[2].args;

    deployments.save('YooLoot_lfe', {
      address: newYooLoot,
      abi: YooLoot.abi,
    });
  }
};
export default func;
func.tags = ['YooLoot_lfe'];
func.dependencies = ['Loot', 'LootForEveryone', 'YooLoot'];
