import { Web3Type } from '../types/web3';
import { AssetContractLookup } from '../wrappedContracts/AssetContractLookup';
import { deploy } from 'ew-deployment';
import { AssetContractLookupJSON, AssetConsumingDBJSON, AssetConsumingRegistryLogicJSON, AssetProducingDBJSON, AssetProducingRegistryLogicJSON } from '..';
import * as path from 'path';

export async function migrateAssetRegistryContracts(web3: Web3Type, userContractLookup: string, deployKey: string): Promise<JSON> {
    return new Promise<any>(async (resolve, reject) => {

        const privateKeyDeployment = deployKey.startsWith('0x') ?
            deployKey : '0x' + deployKey;
        const accountDeployment = web3.eth.accounts.privateKeyToAccount(privateKeyDeployment).address;

        const assetContractLookupAddress = (await deploy(
            web3,
            (AssetContractLookupJSON as any).bytecode,
            { privateKey: privateKeyDeployment },
        )).contractAddress;

        const assetConsumingLogicAddress = (await deploy(
            web3,
            (AssetConsumingRegistryLogicJSON as any).bytecode + web3.eth.abi.encodeParameters(['address', 'address'], [userContractLookup, assetContractLookupAddress]).substr(2),
            { privateKey: privateKeyDeployment },
        )).contractAddress;

        const assetConsumingDBAddress = (await deploy(
            web3,
            (AssetConsumingDBJSON as any).bytecode + web3.eth.abi.encodeParameter('address', assetConsumingLogicAddress).substr(2),
            { privateKey: privateKeyDeployment },
        )).contractAddress;

        const assetProducingLogicAddress = (await deploy(
            web3,
            (AssetProducingRegistryLogicJSON as any).bytecode + web3.eth.abi.encodeParameters(['address', 'address'], [userContractLookup, assetContractLookupAddress]).substr(2),
            { privateKey: privateKeyDeployment },
        )).contractAddress;

        const assetProducingDBAddress = (await deploy(
            web3,
            (AssetProducingDBJSON as any).bytecode + web3.eth.abi.encodeParameter('address', assetProducingLogicAddress).substr(2),
            { privateKey: privateKeyDeployment },
        )).contractAddress;

        const assetContractLookup: AssetContractLookup =
            new AssetContractLookup((web3 as any), assetContractLookupAddress);

        await assetContractLookup.init(
            userContractLookup,
            assetProducingLogicAddress,
            assetConsumingLogicAddress,
            assetProducingDBAddress,
            assetConsumingDBAddress, { privateKey: privateKeyDeployment });

        const resultMapping = {};

        resultMapping[path.resolve(__dirname, '../../contracts/AssetContractLookup.json')] = assetContractLookupAddress;
        resultMapping[path.resolve(__dirname, '../../contracts/AssetConsumingRegistryLogic.json')] = assetConsumingLogicAddress;
        resultMapping[path.resolve(__dirname, '../../contracts/AssetConsumingDB.json')] = assetConsumingDBAddress;
        resultMapping[path.resolve(__dirname, '../../contracts/AssetProducingRegistryLogic.json')] = assetProducingLogicAddress;
        resultMapping[path.resolve(__dirname, '../../contracts/AssetProducingDB.json')] = assetProducingDBAddress;

        resolve(resultMapping);

        /*
        const assetContractLookupWeb3 = await sloffle.deploy(
            path.resolve(__dirname, '../../contracts/AssetContractLookup.json'),
            [],
            { privateKey: privateKeyDeployment },
        );

        const assetConsumingLogicWeb3 = await sloffle.deploy(
            path.resolve(__dirname, '../../contracts/AssetConsumingRegistryLogic.json'),
            [userContractLookup, assetContractLookupWeb3._address],
            { privateKey: privateKeyDeployment },
        );

        const assetConsumingDBWeb3 = await sloffle.deploy(
            path.resolve(__dirname, '../../contracts/AssetConsumingDB.json'),
            [assetConsumingLogicWeb3._address],
            { privateKey: privateKeyDeployment },
        );

        const assetProducingLogicWeb3 = await sloffle.deploy(
            path.resolve(__dirname, '../../contracts/AssetProducingRegistryLogic.json'),
            [userContractLookup, assetContractLookupWeb3._address],
            { privateKey: privateKeyDeployment },
        );

        const assetProducingDBWeb3 = await sloffle.deploy(
            path.resolve(__dirname, '../../contracts/AssetProducingDB.json'),
            [assetProducingLogicWeb3._address],
            { privateKey: privateKeyDeployment },
        );

        const assetContractLookup: AssetContractLookup =
            new AssetContractLookup((web3 as any), assetContractLookupWeb3._address);

        await assetContractLookup.init(
            userContractLookup,
            assetProducingLogicWeb3._address,
            assetConsumingLogicWeb3._address,
            assetProducingDBWeb3._address,
            assetConsumingDBWeb3._address, { privateKey: privateKeyDeployment });

        resolve(sloffle.deployedContracts);
        */
    });
}
