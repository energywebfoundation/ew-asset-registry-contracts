// Copyright 2018 Energy Web Foundation
// This file is part of the Origin Application brought to you by the Energy Web Foundation,
// a global non-profit organization focused on accelerating blockchain technology across the energy sector, 
// incorporated in Zug, Switzerland.
//
// The Origin Application is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// This is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY and without an implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details, at <http://www.gnu.org/licenses/>.
//
// @authors: slock.it GmbH, Martin Kuechler, martin.kuechler@slock.it

import { assert } from 'chai';
import * as fs from 'fs';
import 'mocha';
import { Web3Type } from '../types/web3';
import { UserContractLookup, migrateUserRegistryContracts, UserLogic } from 'ew-user-registry-contracts';
import { migrateAssetRegistryContracts } from '../utils/migrateContracts';
import { AssetContractLookup } from '../wrappedContracts/AssetContractLookup';
import { AssetProducingRegistryLogic } from '../wrappedContracts/AssetProducingRegistryLogic';
import { AssetConsumingRegistryLogic } from '../wrappedContracts/AssetConsumingRegistryLogic';
import { AssetConsumingDB } from '../wrappedContracts/AssetConsumingDB';
import { AssetProducingDB } from '../wrappedContracts/AssetProducingDB';

describe('AssetContractLookup', () => {

    const configFile = JSON.parse(fs.readFileSync(process.cwd() + '/connection-config.json', 'utf8'));

    const Web3 = require('web3');
    const web3: Web3Type = new Web3(configFile.develop.web3);

    const privateKeyDeployment = configFile.develop.deployKey.startsWith('0x') ?
        configFile.develop.deployKey : '0x' + configFile.develop.deployKey;

    const accountDeployment = web3.eth.accounts.privateKeyToAccount(privateKeyDeployment).address;

    let userContractLookup: UserContractLookup;
    let assetContractLookup: AssetContractLookup;
    let assetProducingLogic: AssetProducingRegistryLogic;
    let assetConsumingLogic: AssetConsumingRegistryLogic;
    let assetProducingDB: AssetProducingDB;
    let assetConsumingDB: AssetConsumingDB;

    it('should deploy the contracts', async () => {

        const userContracts = await migrateUserRegistryContracts(web3);

        const userLogic = new UserLogic((web3 as any),
                                        userContracts[process.cwd() + '/node_modules/ew-user-registry-contracts/dist/contracts/UserLogic.json']);

        await userLogic.setUser(accountDeployment, 'admin', { privateKey: privateKeyDeployment });

        await userLogic.setRoles(accountDeployment, 3, { privateKey: privateKeyDeployment });

        const userContractLookupAddr = userContracts[process.cwd() + '/node_modules/ew-user-registry-contracts/dist/contracts/UserContractLookup.json'];

        const deployedContracts = await migrateAssetRegistryContracts(web3, userContractLookupAddr);

        userContractLookup = new UserContractLookup((web3 as any),
                                                    userContractLookupAddr);
        assetContractLookup = new AssetContractLookup((web3 as any));
        assetProducingLogic = new AssetProducingRegistryLogic((web3 as any));
        assetConsumingLogic = new AssetConsumingRegistryLogic((web3 as any));
        assetProducingDB = new AssetProducingDB((web3 as any));
        assetConsumingDB = new AssetConsumingDB((web3 as any));

        Object.keys(deployedContracts).forEach(async (key) => {

            const deployedBytecode = await web3.eth.getCode(deployedContracts[key]);
            assert.isTrue(deployedBytecode.length > 0);

            const contractInfo = JSON.parse(fs.readFileSync(key, 'utf8'));

            const tempBytecode = '0x' + contractInfo.deployedBytecode;
            assert.equal(deployedBytecode, tempBytecode);

        });
    });

    it('should have the right owner', async () => {

        assert.equal(await userContractLookup.owner(), accountDeployment);
        assert.equal(await assetContractLookup.owner(), accountDeployment);

    });

    it('should have the right registries', async () => {

        assert.equal(await assetContractLookup.assetConsumingRegistry(), assetConsumingLogic.web3Contract._address);
        assert.equal(await assetContractLookup.assetProducingRegistry(), assetProducingLogic.web3Contract._address);
        assert.equal(await assetContractLookup.userRegistry(), userContractLookup.web3Contract._address);

    });

    it('should throw an error when calling init again', async () => {

        let failed = false;

        try {
            await assetContractLookup.init('0x1000000000000000000000000000000000000005',
                                           '0x1000000000000000000000000000000000000005',
                                           '0x1000000000000000000000000000000000000005',
                                           '0x1000000000000000000000000000000000000005',
                                           '0x1000000000000000000000000000000000000005',
                                           { privateKey: privateKeyDeployment },
            );
        }
        catch (ex) {
            failed = true;
            assert.include(ex.message, 'alreadny initialized');
        }

        assert.isTrue(failed);
    });

    it('should throw an error when calling update as non Owner', async () => {

        let failed = false;

        try {
            await assetContractLookup.update('0x1000000000000000000000000000000000000005',
                                             '0x1000000000000000000000000000000000000005',
                                             { privateKey: '0x191c4b074672d9eda0ce576cfac79e44e320ffef5e3aadd55e000de57341d36c' });
        }
        catch (ex) {
            failed = true;
            assert.include(ex.message, 'msg.sender is not owner');
        }

        assert.isTrue(failed);
    });

    it('should be able to update as owner', async () => {

        await assetContractLookup.update('0x1000000000000000000000000000000000000005',
                                         '0x1000000000000000000000000000000000000006',
                                         { privateKey: privateKeyDeployment });

        assert.equal(await assetContractLookup.assetProducingRegistry(), '0x1000000000000000000000000000000000000005');
        assert.equal(await assetProducingDB.owner(), '0x1000000000000000000000000000000000000005');

        assert.equal(await assetContractLookup.assetConsumingRegistry(), '0x1000000000000000000000000000000000000006');
        assert.equal(await assetConsumingDB.owner(), '0x1000000000000000000000000000000000000006');
    });

    it('should throw when trying to change owner as non-owner', async () => {

        let failed = false;

        try {
            await assetContractLookup.changeOwner('0x1000000000000000000000000000000000000005',
                                                  { privateKey: '0x191c4b074672d9eda0ce576cfac79e44e320ffef5e3aadd55e000de57341d36c' });
        }
        catch (ex) {
            failed = true;
            assert.include(ex.message, 'msg.sender is not owner');
        }

        assert.isTrue(failed);

    });

    it('should be able to change owner ', async () => {

        await assetContractLookup.changeOwner('0x1000000000000000000000000000000000000005',
                                              { privateKey: privateKeyDeployment });

        assert.equal(await assetContractLookup.owner(), '0x1000000000000000000000000000000000000005');

    });

});
