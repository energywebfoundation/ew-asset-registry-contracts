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
// @authors: slock.it GmbH, Martin Kuechler, martin.kuchler@slock.it

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "../../contracts/Asset/AssetProducingDB.sol";

/// @title this interface defines the functions of the AssetContractLookup-Contract 
interface AssetProducingInterface {
    function saveSmartMeterRead(uint _assetId, uint _newMeterRead, string _lastSmartMeterReadFileHash) external;
    function createAsset(address _smartMeter, address _owner, bool _active, address[] _matcher, string _propertiesDocumentHash, string _url, uint _numOwnerChanges) external; 
    function getAssetById(uint _assetId) external view returns (AssetProducingDB.Asset);
    function getAssetBySmartMeter(address _smartMeter) external view returns (AssetProducingDB.Asset);
    function checkAssetExist(address _smartMeter) public view returns (bool);
    
}