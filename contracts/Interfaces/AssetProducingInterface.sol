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

/// @title this interface defines the functions of the AssetContractLookup-Contract 
interface AssetProducingInterface {
   // function createAsset(address _smartMeter, address _owner, uint _maxOwnerChanges, address _matcher, bool _active, string _propertiesDocumentHash, string _url) external;
  //  function saveSmartMeterRead(uint _assetId, uint _newMeterRead, bool _smartMeterDown, string _lastSmartMeterReadFileHash, uint _CO2OffsetMeterRead,  bool _CO2OffsetServiceDown) external;
  //  function saveSmartMeterReadBundle(uint _assetId, uint _newMeterRead, bool _smartMeterDown, string _lastSmartMeterReadFileHash, uint _CO2OffsetMeterRead, bool _CO2OffsetServiceDown) external;
 //   function getAsset(uint _assetId) external view returns (uint _certificatesUsedForWh, address _smartMeter, address _owner, uint _lastSmartMeterReadWh, bool _active, string _lastSmartMeterReadFileHash, address[] _matcher, uint _certificatesCreatedForWh, uint _lastSmartMeterCO2OffsetRead, uint _maxOwnerChanges, string _propertiesDocumentHash, string _url);
  //  function getFullAsset(uint _assetId) external view returns (AssetProducingRegistryDB.Asset);
    function getLastSmartMeterReadFileHash(uint _assetId) external view returns (string); 
}