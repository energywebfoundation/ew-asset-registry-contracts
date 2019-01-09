export { AssetConsumingRegistryLogic } from './wrappedContracts/AssetConsumingRegistryLogic';
export { AssetProducingRegistryLogic } from './wrappedContracts/AssetProducingRegistryLogic';
export { AssetContractLookup } from './wrappedContracts/AssetContractLookup';
export { migrateAssetRegistryContracts } from './utils/migrateContracts';

import AssetConsumingDBJSON from '../contract-build/AssetConsumingDB.json';
import AssetConsumingRegistryLogicJSON from '../contract-build/AssetConsumingRegistryLogic.json';
import AssetProducingDBJSON from '../contract-build/AssetProducingDB.json';
import AssetProducingRegistryLogicJSON from '../contract-build/AssetProducingRegistryLogic.json';
import AssetContractLookupJSON from '../contract-build/AssetContractLookup.json';

export { AssetConsumingDBJSON, AssetConsumingRegistryLogicJSON, AssetProducingDBJSON, AssetProducingRegistryLogicJSON, AssetContractLookupJSON };