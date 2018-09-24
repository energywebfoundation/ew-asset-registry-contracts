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

import "../../contracts/Asset/AssetConsumingRegistryDB.sol";

/// @title this interface defines the functions of the AssetContractLookup-Contract 
interface AssetConsumingInterface {
    function createAsset(address _smartMeter, address _owner, bool _active, address _matcher, string _propertiesDocumentHash, string _url) external; 
    function saveSmartMeterRead(uint _assetId, uint _newMeterRead, string _lastSmartMeterReadFileHash, bool _smartMeterDown) external;
    function setConsumptionForPeriode(uint _assetId, uint _consumed) external;
    function getAsset(uint _assetId) external view returns (address _smartMeter, address _owner, uint _lastSmartMeterReadWh, uint _certificatesUsedForWh, bool _active, string _lastSmartMeterReadFileHash, string _propertiesDocumentHash, string _url, address[] _matcher);
}