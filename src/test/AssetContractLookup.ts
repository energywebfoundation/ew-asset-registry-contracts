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
import { migrateUserRegistryContracts, UserLogic } from 'ew-user-registry-contracts';
import { migrateAssetRegistryContracts } from '../utils/migrateContracts';
import { AssetContractLookup } from '../wrappedContracts/AssetContractLookup';
import { AssetProducingRegistryLogic } from '../wrappedContracts/AssetProducingRegistryLogic';
import { AssetConsumingRegistryLogic } from '../wrappedContracts/AssetConsumingRegistryLogic';

describe('AssetContractLookup', () => {

    const configFile = JSON.parse(fs.readFileSync(process.cwd() + '/connection-config.json', 'utf8'));

    const Web3 = require('web3');
    const web3: Web3Type = new Web3(configFile.develop.web3);

    const privateKeyDeployment = configFile.develop.deployKey.startsWith('0x') ?
        configFile.develop.deployKey : '0x' + configFile.develop.deployKey;

    const accountDeployment = web3.eth.accounts.privateKeyToAccount(privateKeyDeployment).address;

    //  let userContractLookup: UserContractLookup;
    let assetContractLookup: AssetContractLookup;
    let assetProducingLogic: AssetProducingRegistryLogic;
    let assetConsumingLogic: AssetConsumingRegistryLogic;

    it('should deploy the contracts', async () => {

        const deployedContracts = await migrateAssetRegistryContracts(web3);

        //  userContractLookup = new UserContractLookup((web3 as any), deployedContracts['./solidity_modules/ew-user-registry-contracts/dist/UserContractLookup.json']);
        assetContractLookup = new AssetContractLookup((web3 as any), deployedContracts['./solidity_modules/ew-asset-registry-contracts/dist/AssetContractLookup.json']);
        assetProducingLogic = new AssetProducingRegistryLogic((web3 as any), deployedContracts['./solidity_modules/ew-asset-registry-contracts/dist/AssetProducingRegistryLogic.json']);
        assetConsumingLogic = new AssetConsumingRegistryLogic((web3 as any), deployedContracts['./solidity_modules/ew-asset-registry-contracts/dist/AssetConsumingRegistryLogic.json']);

        Object.keys(deployedContracts).forEach(async (key) => {

            const deployedBytecode = await web3.eth.getCode(deployedContracts[key]);
            assert.isTrue(deployedBytecode.length > 0);

            const contractInfo = JSON.parse(fs.readFileSync(key, 'utf8'));

            const tempBytecode = '0x' + contractInfo.deployedBytecode;
            assert.equal(deployedBytecode, tempBytecode);

        });
    });

});
