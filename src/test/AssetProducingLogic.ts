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
import { AssetConsumingRegistryLogic } from '../wrappedContracts/AssetConsumingRegistryLogic';
import { AssetProducingRegistryDB } from '../wrappedContracts/AssetProducingRegistryDB';
import { AssetConsumingRegistryDB } from '../wrappedContracts/AssetConsumingRegistryDB';
import { getClientVersion } from 'sloffle';
import { AssetProducingRegistryLogic } from '../wrappedContracts/AssetProducingRegistryLogic';

describe('AssetProducingLogic', () => {

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

    let isGanache: boolean;

    it('should deploy the contracts', async () => {

        isGanache = (await getClientVersion(web3)).includes('EthereumJS');

        const userContracts = await migrateUserRegistryContracts(web3);

        const userLogic: UserLogic = new UserLogic((web3 as any),
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

        assert.equal(await assetProducingLogic.owner(), assetContractLookup.web3Contract._address);

    });

    it('should have the right userContractLookup', async () => {

        assert.equal(await assetProducingLogic.userContractLookup(), userContractLookup.web3Contract._address);

    });

    it('should have the right userContractLookup', async () => {

        assert.equal(await assetProducingLogic.db(), assetProducingDB.web3Contract._address);

    });

    it('should not have any assets in the contract after deployment', async () => {

        assert.equal(await assetProducingLogic.getAssetListLength(), 0);

    });

    it('should not deploy an asset when the user does not have the assetManager rights as assetManager', async () => {

        let failed = false;
        try {
            await assetProducingLogic.createAssetStruct(
                assetSmartmeter,
                assetOwnerAddress,
                2,
                true,
                ([matcher] as any),
                'propertiesDocumentHash',
                'url',
                {
                    privateKey: assetOwnerPK,
                },
            );

        }
        catch (ex) {
            failed = true;

            if (isGanache) {
                assert.include(ex.message, 'revert user does not have the required role');
            }
        }
        assert.isTrue(failed);
    });

    it('should not deploy an asset when the user does not have the assetManager rights as user', async () => {

        let failed = false;
        try {
            await assetProducingLogic.createAssetStruct(
                assetSmartmeter,
                assetOwnerAddress,
                2,
                true,
                ([matcher] as any),
                'propertiesDocumentHash',
                'url',
                { privateKey: '0x191c4b074672d9eda0ce576cfac79e44e320ffef5e3aadd55e000de57341d36c' });
        }
        catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert user does not have the required role');
            }
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
            await assetProducingLogic.createAssetStruct(
                assetSmartmeter,
                assetOwnerAddress,
                2,
                true,
                ([matcher] as any),
                'propertiesDocumentHash',
                'url',
                { privateKey: '0x191c4b074672d9eda0ce576cfac79e44e320ffef5e3aadd55e000de57341d36c' });
        }
        catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert user does not have the required role');
            }
        }
        assert.isTrue(failed);
    });

    it('should onboard a new asset', async () => {
        const tx = await assetProducingLogic.createAssetStruct(
            assetSmartmeter,
            assetOwnerAddress,
            2,
            true,
            ([matcher] as any),
            'propertiesDocumentHash',
            'url',
            { privateKey: privateKeyDeployment });

        const event = (await assetProducingLogic.getAllLogAssetCreatedEvents(
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

        assert.equal(await assetProducingLogic.getAssetListLength(), 1);

    });

    it('should return the deployed asset correctly', async () => {

        const deployedAsset = await assetProducingLogic.getAsset(0);

        deployedAsset._owner = deployedAsset._owner.toLowerCase();
        deployedAsset[1] = deployedAsset[1].toLowerCase();

        deployedAsset._smartMeter = deployedAsset._smartMeter.toLowerCase();
        deployedAsset[2] = deployedAsset[2].toLowerCase();

        assert.deepEqual(deployedAsset, {
            0: '0',
            1: assetSmartmeter.toLowerCase(),
            2: assetOwnerAddress.toLowerCase(),
            3: '0',
            4: true,
            5: '',
            6: [matcher],
            7: '0',
            8: '0',
            9: '2',
            10: 'propertiesDocumentHash',
            11: 'url',
            _certificatesUsedForWh: '0',
            _smartMeter: assetSmartmeter.toLowerCase(),
            _owner: assetOwnerAddress.toLowerCase(),
            _lastSmartMeterReadWh: '0',
            _active: true,
            _lastSmartMeterReadFileHash: '',
            _matcher: [matcher],
            _certificatesCreatedForWh: '0',
            _lastSmartMeterCO2OffsetRead: '0',
            _maxOwnerChanges: '2',
            _propertiesDocumentHash: 'propertiesDocumentHash',
            _url: 'url',
        });

    });

    it('should fail when trying to log with saveSmartMeterRead using the wrong smartmeter', async () => {

        let failed = false;

        try {
            await assetProducingLogic.saveSmartMeterRead(
                0,
                100,
                false,
                'lastSmartMeterReadFileHash',
                100,
                false,
                { privateKey: '0x191c4b074672d9eda0ce576cfac79e44e320ffef5e3aadd55e000de57341d36c' });
        } catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert saveSmartMeterRead: wrong sender');
            }
        }

        assert.isTrue(failed);
    });

    it('should be able log to with saveSmartMeterRead with the right account', async () => {

        const tx = await assetProducingLogic.saveSmartMeterRead(
            0,
            100,
            false,
            'lastSmartMeterReadFileHash',
            100,
            false,
            { privateKey: assetSmartmeterPK });

        const event = (await assetProducingLogic.getAllLogNewMeterReadEvents({ fromBlock: tx.blockNumber, toBlock: tx.blockNumber }))[0];

        assert.equal(event.event, 'LogNewMeterRead');
        assert.deepEqual(event.returnValues, {
            0: '0',
            1: '0',
            2: '100',
            3: false,
            4: '0',
            5: '0',
            6: '100',
            7: false,
            _assetId: '0',
            _oldMeterRead: '0',
            _newMeterRead: '100',
            _smartMeterDown: false,
            _certificatesCreatedForWh: '0',
            _oldCO2OffsetReading: '0',
            _newCO2OffsetReading: '100',
            _serviceDown: false,
        });

    });

    it('should fail when trying to log with saveSmartMeterRead and a too low meterreading', async () => {

        let failed = false;

        try {
            await assetProducingLogic.saveSmartMeterRead(
                0,
                50,
                false,
                'lastSmartMeterReadFileHash',
                200,
                false,
                { privateKey: assetSmartmeterPK });
        } catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert saveSmartMeterRead: meterread too low');
            }
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to log with saveSmartMeterRead and a too low meterreading', async () => {

        let failed = false;

        try {
            await assetProducingLogic.saveSmartMeterRead(
                0,
                200,
                false,
                'lastSmartMeterReadFileHash',
                50,
                false,
                { privateKey: assetSmartmeterPK });
        } catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert saveSmartMeterRead: CO2 read too low');
            }
        }

        assert.isTrue(failed);
    });

    it('should be able to log withs aveSmartMeterRead again using the right values', async () => {

        const tx = await assetProducingLogic.saveSmartMeterRead(
            0,
            200,
            false,
            'lastSmartMeterReadFileHash',
            200,
            false,
            { privateKey: assetSmartmeterPK });

        const event = (await assetProducingLogic.getAllLogNewMeterReadEvents({ fromBlock: tx.blockNumber, toBlock: tx.blockNumber }))[0];

        assert.equal(event.event, 'LogNewMeterRead');
        assert.deepEqual(event.returnValues, {
            0: '0',
            1: '100',
            2: '200',
            3: false,
            4: '100',
            5: '100',
            6: '200',
            7: false,
            _assetId: '0',
            _oldMeterRead: '100',
            _newMeterRead: '200',
            _smartMeterDown: false,
            _certificatesCreatedForWh: '100',
            _oldCO2OffsetReading: '100',
            _newCO2OffsetReading: '200',
            _serviceDown: false,
        });

    });

    it('should fail when trying to log with saveSmartMeterReadBundle using the wrong smartmeter', async () => {

        let failed = false;

        try {
            await assetProducingLogic.saveSmartMeterReadBundle(
                0,
                300,
                false,
                'lastSmartMeterReadFileHash',
                300,
                false,
                { privateKey: '0x191c4b074672d9eda0ce576cfac79e44e320ffef5e3aadd55e000de57341d36c' });
        } catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert saveSmartMeterRead: wrong sender');
            }
        }

        assert.isTrue(failed);
    });

    it('should be able log to with saveSmartMeterReadBundle with the right account', async () => {

        const tx = await assetProducingLogic.saveSmartMeterReadBundle(
            0,
            300,
            false,
            'lastSmartMeterReadFileHash',
            300,
            false,
            { privateKey: assetSmartmeterPK });

        const event = (await assetProducingLogic.getAllLogNewMeterReadEvents({ fromBlock: tx.blockNumber, toBlock: tx.blockNumber }))[0];

        assert.equal(event.event, 'LogNewMeterRead');
        assert.deepEqual(event.returnValues, {
            0: '0',
            1: '200',
            2: '300',
            3: false,
            4: '100',
            5: '200',
            6: '300',
            7: false,
            _assetId: '0',
            _oldMeterRead: '200',
            _newMeterRead: '300',
            _smartMeterDown: false,
            _certificatesCreatedForWh: '100',
            _oldCO2OffsetReading: '200',
            _newCO2OffsetReading: '300',
            _serviceDown: false,
        });

    });

    it('should fail when trying to log with saveSmartMeterReadBundle and a too low meterreading', async () => {

        let failed = false;

        try {
            await assetProducingLogic.saveSmartMeterReadBundle(
                0,
                50,
                false,
                'lastSmartMeterReadFileHash',
                500,
                false,
                { privateKey: assetSmartmeterPK });
        } catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert saveSmartMeterRead: meterread too low');
            }
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to log with saveSmartMeterReadBundle and a too low meterreading', async () => {

        let failed = false;

        try {
            await assetProducingLogic.saveSmartMeterReadBundle(
                0,
                500,
                false,
                'lastSmartMeterReadFileHash',
                50,
                false,
                { privateKey: assetSmartmeterPK });
        } catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert saveSmartMeterRead: CO2 read too low');
            }
        }

        assert.isTrue(failed);
    });

    it('should be able to log withs saveSmartMeterRead again using the right values', async () => {

        const tx = await assetProducingLogic.saveSmartMeterReadBundle(
            0,
            400,
            false,
            'lastSmartMeterReadFileHash',
            400,
            false,
            { privateKey: assetSmartmeterPK });

        const event = (await assetProducingLogic.getAllLogNewMeterReadEvents({ fromBlock: tx.blockNumber, toBlock: tx.blockNumber }))[0];

        assert.equal(event.event, 'LogNewMeterRead');
        assert.deepEqual(event.returnValues, {
            0: '0',
            1: '300',
            2: '400',
            3: false,
            4: '100',
            5: '300',
            6: '400',
            7: false,
            _assetId: '0',
            _oldMeterRead: '300',
            _newMeterRead: '400',
            _smartMeterDown: false,
            _certificatesCreatedForWh: '100',
            _oldCO2OffsetReading: '300',
            _newCO2OffsetReading: '400',
            _serviceDown: false,
        });

    });

    it('should fail when trying to deactive an asset as non-manager', async () => {

        let failed = false;

        try {
            await assetProducingLogic.setActive(0, false, { privateKey: '0x191c4b074672d9eda0ce576cfac79e44e320ffef5e3aadd55e000de57341d36c' });
        } catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert user does not have the required role');
            }
        }

        assert.isTrue(failed);

    });

    it('should be able to deactive an asset', async () => {

        const tx = await assetProducingLogic.setActive(0, false, { privateKey: privateKeyDeployment });
        if (isGanache) {

            const eventActive = (await assetProducingLogic.getAllLogAssetSetActiveEvents({ fromBlock: tx.blockNumber, toBlock: tx.blockNumber }));

            assert.equal(eventActive.length, 0);

            const eventInactive = (await assetProducingLogic.getAllLogAssetSetInactiveEvents({ fromBlock: tx.blockNumber - 1, toBlock: tx.blockNumber + 1 }))[0];

            assert.equal(eventInactive.event, 'LogAssetSetInactive');
            assert.deepEqual(eventInactive.returnValues, {
                0: '0', _assetId: '0',
            });
        }

    });

    it('should fail when trying to log with saveSmartMeterRead with a deactivated asset', async () => {

        let failed = false;

        try {
            await assetProducingLogic.saveSmartMeterRead(
                0,
                300,
                false,
                'lastSmartMeterReadFileHash',
                300,
                false,
                { privateKey: assetSmartmeterPK });
        } catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert saveSmartMeterRead: asset not active');
            }
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to log with saveSmartMeterReadBundle with a deactivated asset', async () => {

        let failed = false;

        try {
            await assetProducingLogic.saveSmartMeterReadBundle(
                0,
                300,
                false,
                'lastSmartMeterReadFileHash',
                300,
                false,
                { privateKey: assetSmartmeterPK });
        } catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert saveSmartMeterRead: asset not active');
            }
        }

        assert.isTrue(failed);
    });

    it('should fail when trying to active an asset as non-manager', async () => {

        let failed = false;

        try {
            await assetProducingLogic.setActive(0, true, { privateKey: '0x191c4b074672d9eda0ce576cfac79e44e320ffef5e3aadd55e000de57341d36c' });
        } catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert user does not have the required role');
            }
        }

        assert.isTrue(failed);

    });

    it('should be able to deactive an asset', async () => {

        const tx = await assetProducingLogic.setActive(0, true, { privateKey: privateKeyDeployment });

        if (isGanache) {

            const eventActive = (await assetProducingLogic.getAllLogAssetSetInactiveEvents({ fromBlock: tx.blockNumber, toBlock: tx.blockNumber }));
            assert.equal(eventActive.length, 0);
            const eventInactive = (await assetProducingLogic.getAllLogAssetSetActiveEvents({ fromBlock: tx.blockNumber, toBlock: tx.blockNumber }))[0];

            assert.equal(eventInactive.event, 'LogAssetSetActive');
            assert.deepEqual(eventInactive.returnValues, {
                0: '0', _assetId: '0',
            });
        }
    });

    it('should fail when trying to change a smartmeter as non-manager', async () => {

        let failed = false;

        try {
            await assetProducingLogic.updateSmartMeter(0, '0x7110d0f07be70fc2a6c84fe66bf128593b2102fb', { privateKey: '0x191c4b074672d9eda0ce576cfac79e44e320ffef5e3aadd55e000de57341d36c' });
        } catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert user does not have the required role');
            }
        }

        assert.isTrue(failed);

    });

    it('should fail when trying to change a smartmeter as non-manager', async () => {

        await assetProducingLogic.updateSmartMeter(0, '0x7110d0f07be70fc2a6c84fe66bf128593b2102fb', { privateKey: privateKeyDeployment });
        const deployedAsset = await assetProducingLogic.getAsset(0);

        deployedAsset._owner = deployedAsset._owner.toLowerCase();
        deployedAsset[1] = deployedAsset[1].toLowerCase();

        deployedAsset._smartMeter = deployedAsset._smartMeter.toLowerCase();
        deployedAsset[2] = deployedAsset[2].toLowerCase();

        assert.deepEqual(deployedAsset, {
            0: '0',
            1: '0x7110d0f07be70fc2a6c84fe66bf128593b2102fb',
            2: assetOwnerAddress.toLowerCase(),
            3: '400',
            4: true,
            5: 'lastSmartMeterReadFileHash',
            6: [matcher],
            7: '100',
            8: '400',
            9: '2',
            10: 'propertiesDocumentHash',
            11: 'url',
            _certificatesUsedForWh: '0',
            _smartMeter: '0x7110d0f07be70fc2a6c84fe66bf128593b2102fb',
            _owner: assetOwnerAddress.toLowerCase(),
            _lastSmartMeterReadWh: '400',
            _active: true,
            _lastSmartMeterReadFileHash: 'lastSmartMeterReadFileHash',
            _matcher: [matcher],
            _certificatesCreatedForWh: '100',
            _lastSmartMeterCO2OffsetRead: '400',
            _maxOwnerChanges: '2',
            _propertiesDocumentHash: 'propertiesDocumentHash',
            _url: 'url',
        });
    });

    it('should fail when trying to call update', async () => {

        let failed = false;

        try {
            await assetProducingLogic.update('0x7110d0f07be70fc2a6c84fe66bf128593b2102fb', { privateKey: privateKeyDeployment });
        } catch (ex) {
            failed = true;
            if (isGanache) {
                assert.include(ex.message, 'revert msg.sender is not owner');
            }
        }

        assert.isTrue(failed);

    });

    it('should return 0x0 when an asset does not have a marketLogicContractLookup-address set', async () => {

        assert.equal(await assetProducingLogic.getMarketLookupContract(0), '0x0000000000000000000000000000000000000000');

    });

    it('should fail trying to set marketAddress as admin', async () => {

        let failed = false;

        try {
            await assetProducingLogic.setMarketLookupContract(0, '0x1000000000000000000000000000000000000005',
                                                              { privateKey: '0x191c4b074672d9eda0ce576cfac79e44e320ffef5e3aadd55e000de57341d36c' });
        } catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should fail trying to set marketAddress as random user', async () => {

        let failed = false;

        try {
            await assetProducingLogic.setMarketLookupContract(0, '0x1000000000000000000000000000000000000005',
                                                              { privateKey: matcherPK });
        } catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should fail trying to set marketAddress as admin', async () => {

        let failed = false;

        try {
            await assetProducingLogic.setMarketLookupContract(0, '0x1000000000000000000000000000000000000005',
                                                              { privateKey: privateKeyDeployment });
        } catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should set marketAddress', async () => {

        await assetProducingLogic.setMarketLookupContract(0, '0x1000000000000000000000000000000000000005',
                                                          { privateKey: assetOwnerPK });

        assert.equal(await assetProducingLogic.getMarketLookupContract(0), '0x1000000000000000000000000000000000000005');

    });

    it('should not add a matcher as admin', async () => {

        let failed = false;

        try {
            await assetProducingLogic.addMatcher(
                0,
                '0x1000000000000000000000000000000000000000',
                { privateKey: privateKeyDeployment });
        } catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should not add a matcher as random user', async () => {

        let failed = false;

        try {
            await assetProducingLogic.addMatcher(
                0,
                '0x1000000000000000000000000000000000000000',
                { privateKey: matcherPK });
        } catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should add a matcher', async () => {

        await assetProducingLogic.addMatcher(
            0,
            '0x1000000000000000000000000000000000000000',
            { privateKey: assetOwnerPK });
        const matcherArray = (await assetProducingLogic.getMatcher(0));

        assert.deepEqual(matcherArray, [matcher, '0x1000000000000000000000000000000000000000']);

    });

    it('should not add the same a matcher', async () => {

        await assetProducingLogic.addMatcher(
            0,
            '0x1000000000000000000000000000000000000000',
            { privateKey: assetOwnerPK });
        const matcherArray = (await assetProducingLogic.getMatcher(0));

        assert.deepEqual(matcherArray, [matcher, '0x1000000000000000000000000000000000000000']);

    });

    it('should not remove a matcher as admin', async () => {

        let failed = false;

        try {
            await assetProducingLogic.removeMatcher(
                0,
                matcher,
                { privateKey: privateKeyDeployment });
        } catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should not remove a matcher as random user', async () => {

        let failed = false;

        try {
            await assetProducingLogic.removeMatcher(
                0,
                matcher,
                { privateKey: matcherPK });
        } catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);
    });

    it('should remove a matcher', async () => {

        await assetProducingLogic.removeMatcher(
            0,
            matcher,
            { privateKey: assetOwnerPK });
        const matcherArray = (await assetProducingLogic.getMatcher(0));

        assert.deepEqual(matcherArray, ['0x1000000000000000000000000000000000000000']);

    });

    it('should not remove a non existing-matcher', async () => {

        await assetProducingLogic.removeMatcher(
            0,
            matcher,
            { privateKey: assetOwnerPK });
        const matcherArray = (await assetProducingLogic.getMatcher(0));

        assert.deepEqual(matcherArray, ['0x1000000000000000000000000000000000000000']);

    });

    it('should add more matcher', async () => {

        for (let i = 0; i < 10; i++) {
            await assetProducingLogic.addMatcher(
                0,
                '0x100000000000000000000000000000000000000' + i,
                { privateKey: assetOwnerPK });
        }

        const matcherArray = (await assetProducingLogic.getMatcher(0));
        assert.deepEqual(matcherArray, ['0x1000000000000000000000000000000000000000',
            '0x1000000000000000000000000000000000000001',
            '0x1000000000000000000000000000000000000002',
            '0x1000000000000000000000000000000000000003',
            '0x1000000000000000000000000000000000000004',
            '0x1000000000000000000000000000000000000005',
            '0x1000000000000000000000000000000000000006',
            '0x1000000000000000000000000000000000000007',
            '0x1000000000000000000000000000000000000008',
            '0x1000000000000000000000000000000000000009']);
    });

    it('should not add a 10th matcher', async () => {

        let failed = false;
        try {
            await assetProducingLogic.addMatcher(
                0,
                '0x1000000000000000000000000000000000000010',
                { privateKey: assetOwnerPK });
        } catch (ex) {
            failed = true;
        }

        assert.isTrue(failed);

    });

    it('should remove all 10 matcher', async () => {

        for (let i = 9; i >= 0; i--) {
            await assetProducingLogic.removeMatcher(
                0,
                '0x100000000000000000000000000000000000000' + i,
                { privateKey: assetOwnerPK });
        }

        const matcherArray = (await assetProducingLogic.getMatcher(0));
        assert.deepEqual(matcherArray, []);

    });

    it('should not onboard assets with too many matcher', async () => {

        let failed = false;
        try {
            await assetProducingLogic.createAssetStruct(
                assetSmartmeter,
                assetOwnerAddress,
                2,
                true,
                ([
                    '0x1000000000000000000000000000000000000000',
                    '0x1000000000000000000000000000000000000001',
                    '0x1000000000000000000000000000000000000002',
                    '0x1000000000000000000000000000000000000003',
                    '0x1000000000000000000000000000000000000004',
                    '0x1000000000000000000000000000000000000005',
                    '0x1000000000000000000000000000000000000006',
                    '0x1000000000000000000000000000000000000007',
                    '0x1000000000000000000000000000000000000008',
                    '0x1000000000000000000000000000000000000009',
                    '0x1000000000000000000000000000000000000010',
                ] as any),
                'propertiesDocumentHash',
                'url',
                { privateKey: privateKeyDeployment });
        }
        catch (ex) {
            failed = true;
        }
        assert.isTrue(failed);
    });

    it('should onboard assets with 10 matcher', async () => {

        await assetProducingLogic.createAssetStruct(
            assetSmartmeter,
            assetOwnerAddress,
            2,
            true,
            ([
                '0x1000000000000000000000000000000000000000',
                '0x1000000000000000000000000000000000000001',
                '0x1000000000000000000000000000000000000002',
                '0x1000000000000000000000000000000000000003',
                '0x1000000000000000000000000000000000000004',
                '0x1000000000000000000000000000000000000005',
                '0x1000000000000000000000000000000000000006',
                '0x1000000000000000000000000000000000000007',
                '0x1000000000000000000000000000000000000008',
                '0x1000000000000000000000000000000000000009',
            ] as any),
            'propertiesDocumentHash',
            'url',
            { privateKey: privateKeyDeployment });

        assert.deepEqual(await assetProducingLogic.getAsset(1), {
            0: '0',
            1: assetSmartmeter,
            2: assetOwnerAddress,
            3: '0',
            4: true,
            5: '',
            6: [
                '0x1000000000000000000000000000000000000000',
                '0x1000000000000000000000000000000000000001',
                '0x1000000000000000000000000000000000000002',
                '0x1000000000000000000000000000000000000003',
                '0x1000000000000000000000000000000000000004',
                '0x1000000000000000000000000000000000000005',
                '0x1000000000000000000000000000000000000006',
                '0x1000000000000000000000000000000000000007',
                '0x1000000000000000000000000000000000000008',
                '0x1000000000000000000000000000000000000009',
            ],
            7: '0',
            8: '0',
            9: '2',
            10: 'propertiesDocumentHash',
            11: 'url',
            _certificatesUsedForWh: '0',
            _smartMeter: assetSmartmeter,
            _owner: assetOwnerAddress,
            _lastSmartMeterReadWh: '0',
            _active: true,
            _lastSmartMeterReadFileHash: '',
            _matcher: [
                '0x1000000000000000000000000000000000000000',
                '0x1000000000000000000000000000000000000001',
                '0x1000000000000000000000000000000000000002',
                '0x1000000000000000000000000000000000000003',
                '0x1000000000000000000000000000000000000004',
                '0x1000000000000000000000000000000000000005',
                '0x1000000000000000000000000000000000000006',
                '0x1000000000000000000000000000000000000007',
                '0x1000000000000000000000000000000000000008',
                '0x1000000000000000000000000000000000000009',
            ],
            _certificatesCreatedForWh: '0',
            _lastSmartMeterCO2OffsetRead: '0',
            _maxOwnerChanges: '2',
            _propertiesDocumentHash: 'propertiesDocumentHash',
            _url: 'url',
        });

        assert.deepEqual(await assetProducingLogic.getMatcher(1), ['0x1000000000000000000000000000000000000000',
            '0x1000000000000000000000000000000000000001',
            '0x1000000000000000000000000000000000000002',
            '0x1000000000000000000000000000000000000003',
            '0x1000000000000000000000000000000000000004',
            '0x1000000000000000000000000000000000000005',
            '0x1000000000000000000000000000000000000006',
            '0x1000000000000000000000000000000000000007',
            '0x1000000000000000000000000000000000000008',
            '0x1000000000000000000000000000000000000009']);
    });
});
