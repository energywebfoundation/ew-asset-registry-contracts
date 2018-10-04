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
import { UserContractLookup, UserLogic, migrateUserRegistryContracts } from 'ew-user-registry-contracts';
import { migrateAssetRegistryContracts } from '../utils/migrateContracts';
import { AssetContractLookup } from '../wrappedContracts/AssetContractLookup';
import { AssetProducingRegistryLogic } from '../wrappedContracts/AssetProducingRegistryLogic';
import { AssetConsumingRegistryLogic } from '../wrappedContracts/AssetConsumingRegistryLogic';
import { AssetProducingRegistryDB } from '../wrappedContracts/AssetProducingRegistryDB';
import { AssetConsumingRegistryDB } from '../wrappedContracts/AssetConsumingRegistryDB';

describe('AssetConsumingLogic', () => {

    const configFile = JSON.parse(fs.readFileSync(process.cwd() + '/connection-config.json', 'utf8'));

    const Web3 = require('web3');
    const web3: Web3Type = new Web3(configFile.develop.web3);

    const privateKeyDeployment = configFile.develop.deployKey.startsWith('0x') ?
        configFile.develop.deployKey : '0x' + configFile.develop.deployKey;

    const accountDeployment = web3.eth.accounts.privateKeyToAccount(privateKeyDeployment).address;

    let userLogic: UserLogic;
    let userContractLookup: UserContractLookup;
    let assetContractLookup: AssetContractLookup;
    let assetProducingLogic: AssetProducingRegistryLogic;
    let assetConsumingLogic: AssetConsumingRegistryLogic;
    let assetProducingDB: AssetProducingRegistryDB;
    let assetConsumingDB: AssetConsumingRegistryDB;

    const assetOwnerPK = '0xfaab95e72c3ac39f7c060125d9eca3558758bb248d1a4cdc9c1b7fd3f91a4485';
    const assetOwnerAddress = web3.eth.accounts.privateKeyToAccount(assetOwnerPK).address;

    const assetSmartmeterPK = '0x2dc5120c26df339dbd9861a0f39a79d87e0638d30fdedc938861beac77bbd3f5';
    const assetSmartmeter = web3.eth.accounts.privateKeyToAccount(assetSmartmeterPK).address;

    const matcherPK = '0xc118b0425221384fe0cbbd093b2a81b1b65d0330810e0792c7059e518cea5383';
    const matcher = web3.eth.accounts.privateKeyToAccount(matcherPK).address;

    it('should deploy the contracts', async () => {

        const userContracts = await migrateUserRegistryContracts(web3);

        const userLogic: UserLogic = new UserLogic((web3 as any), userContracts[process.cwd() + '/node_modules/ew-user-registry-contracts/dist/contracts/UserLogic.json']);

        await userLogic.setUser(accountDeployment, 'admin', { privateKey: privateKeyDeployment });

        await userLogic.setRoles(accountDeployment, 3, { privateKey: privateKeyDeployment });

        const userContractLookupAddr = userContracts[process.cwd() + '/node_modules/ew-user-registry-contracts/dist/contracts/UserContractLookup.json'];

        const deployedContracts = await migrateAssetRegistryContracts(web3, userContractLookupAddr);

        userContractLookup = new UserContractLookup((web3 as any),
                                                    userContractLookupAddr);
        assetContractLookup = new AssetContractLookup((web3 as any));
        assetProducingLogic = new AssetProducingRegistryLogic((web3 as any));
        assetConsumingLogic = new AssetConsumingRegistryLogic((web3 as any));
        assetProducingDB = new AssetProducingRegistryDB((web3 as any));
        assetConsumingDB = new AssetConsumingRegistryDB((web3 as any));

        Object.keys(deployedContracts).forEach(async (key) => {

            const deployedBytecode = await web3.eth.getCode(deployedContracts[key]);
            assert.isTrue(deployedBytecode.length > 0);

            const contractInfo = JSON.parse(fs.readFileSync(key, 'utf8'));

            const tempBytecode = '0x' + contractInfo.deployedBytecode;
            assert.equal(deployedBytecode, tempBytecode);

        });
    });

    it('should have the right owner', async () => {

        assert.equal(await assetConsumingLogic.owner(), assetContractLookup.web3Contract._address);

    });

    it('should have the right userContractLookup', async () => {

        assert.equal(await assetConsumingLogic.userContractLookup(), userContractLookup.web3Contract._address);

    });

    it('should have the right userContractLookup', async () => {

        assert.equal(await assetConsumingLogic.db(), assetConsumingDB.web3Contract._address);

    });

    it('should not have any assets in the contract after deployment', async () => {

        assert.equal(await assetConsumingLogic.getAssetListLength(), 0);

    });

    it('should not deploy an asset when the user does not have the assetManager rights as assetManager', async () => {

        let failed = false;
        try {
            await assetConsumingLogic.createAsset(
                assetSmartmeter,
                assetOwnerAddress,
                true,
                matcher,
                'propertiesDocumentHash',
                'urlString',
                { privateKey: privateKeyDeployment });
        }
        catch (ex) {
            failed = true;
        }
        assert.isTrue(failed);
    });

    it('should not deploy an asset when the user does not have the assetManager rights as user', async () => {

        let failed = false;
        try {
            await assetConsumingLogic.createAsset(
                assetSmartmeter,
                assetOwnerAddress,
                true,
                matcher,
                'propertiesDocumentHash',
                'urlString',
                { privateKey: '0x191c4b074672d9eda0ce576cfac79e44e320ffef5e3aadd55e000de57341d36c' });
        }
        catch (ex) {
            failed = true;
        }
        assert.isTrue(failed);
    });

    it('should onboard tests-users', async () => {
        const userLogicAddress = await userContractLookup.userRegistry();

        userLogic = new UserLogic(web3, userLogicAddress);

        await userLogic.setUser(assetOwnerAddress, 'assetOwner', { privateKey: privateKeyDeployment });
        await userLogic.setRoles(assetOwnerAddress, 8, { privateKey: privateKeyDeployment });
    });

    it('should not deploy an asset as user', async () => {

        let failed = false;
        try {
            await assetConsumingLogic.createAsset(
                assetSmartmeter,
                assetOwnerAddress,
                true,
                matcher,
                'propertiesDocumentHash',
                'urlString',
                { privateKey: '0x191c4b074672d9eda0ce576cfac79e44e320ffef5e3aadd55e000de57341d36c' });
        }
        catch (ex) {
            failed = true;
        }
        assert.isTrue(failed);
    });

    it('should onboard a new asset', async () => {
        const tx = await assetConsumingLogic.createAsset(
            assetSmartmeter,
            assetOwnerAddress,
            true,
            matcher,
            'propertiesDocumentHash',
            'urlString',
            { privateKey: privateKeyDeployment });

        const event = (await assetConsumingLogic.getAllLogAssetCreatedEvents(
            { fromBlock: tx.blockNumber, toBlock: tx.blockNumber }))[0];

        assert.equal(event.event, 'LogAssetCreated');
        assert.deepEqual(event.returnValues, {
            0: accountDeployment,
            1: '0',
            _sender: accountDeployment,
            _assetId: '0',
        });

    });

    it('should have 1 asset in the list', async () => {

        assert.equal(await assetConsumingLogic.getAssetListLength(), 1);

    });

    it('should return the deployed asset correctly', async () => {

        const deployedAsset = await assetConsumingLogic.getAsset(0);

        deployedAsset._owner = deployedAsset._owner.toLowerCase();
        deployedAsset[1] = deployedAsset[1].toLowerCase();

        assert.deepEqual(deployedAsset, {
            0: assetSmartmeter,
            1: assetOwnerAddress.toLowerCase(),
            2: '0',
            3: '0',
            4: true,
            5: '',
            6: 'propertiesDocumentHash',
            7: 'urlString',
            8: [matcher],
            _smartMeter: assetSmartmeter,
            _owner: assetOwnerAddress.toLowerCase(),
            _lastSmartMeterReadWh: '0',
            _certificatesUsedForWh: '0',
            _active: true,
            _lastSmartMeterReadFileHash: '',
            _propertiesDocumentHash: 'propertiesDocumentHash',
            _url: 'urlString',
            _matcher: [matcher],
        });

    });

    it('should fail when trying to log with the wrong smartmeter', async () => {

        let failed = false;

        try {
            await assetConsumingLogic.saveSmartMeterRead(
                0,
                100,
                'newMeterReadFileHash',
                false,
                { privateKey: '0x191c4b074672d9eda0ce576cfac79e44e320ffef5e3aadd55e000de57341d36c' });
        } catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should be able to log new meterread with the right account', async () => {

        const tx = await assetConsumingLogic.saveSmartMeterRead(
            0,
            100,
            'newMeterReadFileHash',
            false,
            { privateKey: assetSmartmeterPK });

        const event = (await assetConsumingLogic.getAllLogNewMeterReadEvents({ fromBlock: tx.blockNumber, toBlock: tx.blockNumber }))[0];

        assert.equal(event.event, 'LogNewMeterRead');
        assert.deepEqual(event.returnValues, {
            0: '0',
            1: '0',
            2: '100',
            3: '0',
            4: false,
            _assetId: '0',
            _oldMeterRead: '0',
            _newMeterRead: '100',
            _certificatesUsedForWh: '0',
            _smartMeterDown: false,
        });

    });

    it.skip('should call setConsumptionForPeriode', async () => {

    });

    it('should return 0x0 when an asset does not have a marketLogicContractLookup-address set', async () => {

        assert.equal(await assetConsumingLogic.getMarketLookupContract(0), '0x0000000000000000000000000000000000000000');

    });

    it('should fail trying to set marketAddress as admin', async () => {

        let failed = false;

        try {
            await assetConsumingLogic.setMarketLookupContract(0, '0x1000000000000000000000000000000000000005',
                                                              { privateKey: '0x191c4b074672d9eda0ce576cfac79e44e320ffef5e3aadd55e000de57341d36c' });
        } catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should fail trying to set marketAddress as random user', async () => {

        let failed = false;

        try {
            await assetConsumingLogic.setMarketLookupContract(0, '0x1000000000000000000000000000000000000005',
                                                              { privateKey: matcherPK });
        } catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should fail trying to set marketAddress as admin', async () => {

        let failed = false;

        try {
            await assetConsumingLogic.setMarketLookupContract(0, '0x1000000000000000000000000000000000000005',
                                                              { privateKey: privateKeyDeployment });
        } catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should set marketAddress', async () => {

        await assetConsumingLogic.setMarketLookupContract(0, '0x1000000000000000000000000000000000000005',
                                                          { privateKey: assetOwnerPK });

        assert.equal(await assetConsumingLogic.getMarketLookupContract(0), '0x1000000000000000000000000000000000000005');

    });

});
