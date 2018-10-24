// Copyright 2018 Energy Web Foundation
//
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

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "../../contracts/Asset/AssetGeneralDB.sol";

/// @title The Database contract for the Asset Registration
/// @notice This contract only provides getter and setter methods
contract AssetProducingDB is AssetGeneralDB {

    struct Asset {
        AssetGeneral assetGeneral;
        uint maxOwnerChanges;
    }

    mapping(address => Asset) internal assetMapping;
    address[] internal smartMeterAddresses;

    constructor(address _assetLogic) AssetGeneralDB(_assetLogic) public {}

    function getAssetGeneralInternal(uint _assetId) 
        internal 
        view 
        returns (AssetGeneral storage general) 
    {
        return assetMapping[smartMeterAddresses[_assetId]].assetGeneral;
    }

    function addFullAsset(Asset _a) 
        public
        onlyOwner
        returns (uint _assetId)
    {
        _assetId = smartMeterAddresses.length;
        address smartMeter = _a.assetGeneral.smartMeter;
        assetMapping[smartMeter] = _a;
        smartMeterAddresses.push(smartMeter);
    }

    
    function getAssetListLength() external view returns (uint){
        return smartMeterAddresses.length;
    }

    function getAssetById(uint _assetId) external view returns (Asset) {
        return assetMapping[smartMeterAddresses[_assetId]];
    }

    function getAssetBySmartMeter(address _smartMeter) external onlyOwner view returns (Asset) {
        return assetMapping[_smartMeter];
    }
    
}