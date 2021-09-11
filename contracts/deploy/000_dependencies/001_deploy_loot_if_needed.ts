import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {AddressZero} from '@ethersproject/constants';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const {deployer} = await getNamedAccounts();

  if (
    // hre.network.name === 'hardhat' ||
    hre.network.name === 'arbitrum' ||
    hre.network.name === 'arbitrum_testnet'
  ) {
    await deploy('Loot', {
      contract: 'Deevy',
      args: [deployer, AddressZero, AddressZero],
      from: deployer,
      skipIfAlreadyDeployed: true,
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
  } else {
    await deploy('Loot', {
      from: deployer,
      skipIfAlreadyDeployed: true,
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
  }
};
export default func;
func.tags = ['Loot'];
