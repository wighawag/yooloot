import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const Loot = await deployments.get('Loot');
  const SyntheticLoot = await deployments.get('SyntheticLoot');

  const {deployer} = await getNamedAccounts();

  await deploy('LootForEveryone', {
    from: deployer,
    args: [Loot.address, SyntheticLoot.address],
    skipIfAlreadyDeployed: true,
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};
export default func;
func.tags = ['LootForEveryone'];
