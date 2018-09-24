import { Sloffle } from 'sloffle';
import { Web3Type } from '../types/web3';
import * as fs from 'fs';
import { migrateUserRegistryContracts, UserLogic } from 'ew-user-registry-contracts';
import { AssetContractLookup } from '../wrappedContracts/AssetContractLookup';
import * as path from 'path';

export async function migrateAssetRegistryContracts(web3: Web3Type, userContractLookup?: string): Promise<JSON> {
    return new Promise<any>(async (resolve, reject) => {

        const configFile = JSON.parse(fs.readFileSync(process.cwd() + '/connection-config.json', 'utf8'));

        const sloffle = new Sloffle((web3 as any));

        const privateKeyDeployment = configFile.develop.deployKey.startsWith('0x') ?
            configFile.develop.deployKey : '0x' + configFile.develop.deployKey;
        const accountDeployment = web3.eth.accounts.privateKeyToAccount(privateKeyDeployment).address;

        if (!userContractLookup) {
            const userContracts = await migrateUserRegistryContracts(web3);

            const userLogic: UserLogic = new UserLogic((web3 as any), userContracts[process.cwd() + '/node_modules/ew-user-registry-contracts/dist/contracts/UserLogic.json']);

            // console.log(userContracts);

            await userLogic.setUser(accountDeployment, 'admin', { privateKey: privateKeyDeployment });

            await userLogic.setRoles(accountDeployment, 2, { privateKey: privateKeyDeployment });

            userContractLookup = userContracts[process.cwd() + '/node_modules/ew-user-registry-contracts/dist/contracts/UserContractLookup.json'];

            sloffle.deployedContracts[process.cwd() + '/node_modules/ew-user-registry-contracts/dist/contracts/UserContractLookup.json'] = userContractLookup;

        }

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
            path.resolve(__dirname, '../../contracts/AssetConsumingRegistryDB.json'),
            [assetConsumingLogicWeb3._address],
            { privateKey: privateKeyDeployment },
        );

        const assetProducingLogicWeb3 = await sloffle.deploy(
            path.resolve(__dirname, '../../contracts/AssetProducingRegistryLogic.json'),
            [userContractLookup, assetContractLookupWeb3._address],
            { privateKey: privateKeyDeployment },
        );

        const assetProducingDBWeb3 = await sloffle.deploy(
            path.resolve(__dirname, '../../contracts/AssetProducingRegistryDB.json'),
            [assetProducingLogicWeb3._address],
            { privateKey: privateKeyDeployment },
        );

        const assetContractLookup: AssetContractLookup = new AssetContractLookup((web3 as any), assetContractLookupWeb3._address);

        await assetContractLookup.init(userContractLookup, assetProducingLogicWeb3._address, assetConsumingLogicWeb3._address, assetProducingDBWeb3._address, assetConsumingDBWeb3._address, { privateKey: privateKeyDeployment });

        resolve(sloffle.deployedContracts);
    });
}