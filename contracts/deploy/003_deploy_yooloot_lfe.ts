import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {constants} from 'ethers';
import {deployments} from 'hardhat';
const {AddressZero} = constants;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployer} = await hre.getNamedAccounts();
  const {deploy, execute, read} = hre.deployments;

  const YooLoot = await hre.deployments.get('YooLoot');
  const LootForEveryone = await hre.deployments.get('LootForEveryone');

  const receipt = await execute(
    'YooLoot',
    {from: deployer, log: true},
    'clone',
    LootForEveryone.address,
    true,
    7 * 24 * 60 * 60
  );

  if (receipt.events) {
    const {
      loot,
      winnerGetLoot,
      periodLength,
      newYooLoot,
      authorizedAsXPSource,
    }: {
      loot: string;
      winnerGetLoot: boolean;
      periodLength: number;
      newYooLoot: string;
      authorizedAsXPSource: boolean;
    } = receipt.events[1].args;

    deployments.save('YooLoot_lfe', {
      address: newYooLoot,
      abi: YooLoot.abi,
    });
  }
};
export default func;
func.tags = ['YooLoot_lfe'];
func.dependencies = ['Loot', 'LootForEveryone', 'YooLoot'];
