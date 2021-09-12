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
  const MLoot = await hre.deployments.get('MLoot');

  function daysIn3HPeriods(numDays: number) {
    return numDays * 8;
  }

  const commit3HPeriod = daysIn3HPeriods(7);
  const reveal3HPeriod = daysIn3HPeriods(3);
  const winner3HPeriod = daysIn3HPeriods(1);

  const receipt = await execute(
    'YooLoot',
    {from: deployer, log: true},
    'clone',
    MLoot.address,
    true,
    commit3HPeriod,
    reveal3HPeriod,
    winner3HPeriod
  );

  if (receipt.events) {
    console.log(receipt.events);
    const {
      newYooLoot,
      authorizedAsXPSource,
    }: {
      newYooLoot: string;
      authorizedAsXPSource: boolean;
    } = receipt.events[0].args;

    deployments.save('YooLoot_mloot', {
      address: newYooLoot,
      abi: YooLoot.abi,
    });
  }
};
export default func;
func.tags = ['YooLoot_mloot'];
func.dependencies = ['Loot', 'MLoot', 'YooLoot'];
