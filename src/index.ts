export { AssetConsumingRegistryLogic } from './wrappedContracts/AssetConsumingRegistryLogic';
export { AssetProducingRegistryLogic } from './wrappedContracts/AssetProducingRegistryLogic';
export { AssetContractLookup } from './wrappedContracts/AssetContractLookup';
export { migrateAssetRegistryContracts } from './utils/migrateContracts';

import * as AssetConsumingDBJSON from '../../dist/contracts/AssetConsumingDB.json';
import * as AssetConsumingRegistryLogicJSON from '../../dist/contracts/AssetConsumingRegistryLogic.json';
import * as AssetProducingDBJSON from '../../dist/contracts/AssetProducingDB.json';
import * as AssetProducingRegistryLogicJSON from '../../dist/contracts/AssetProducingRegistryLogic.json';
import * as AssetContractLookupJSON from '../../dist/contracts/AssetContractLookup.json';

export { AssetConsumingDBJSON, AssetConsumingRegistryLogicJSON, AssetProducingDBJSON, AssetProducingRegistryLogicJSON, AssetContractLookupJSON };