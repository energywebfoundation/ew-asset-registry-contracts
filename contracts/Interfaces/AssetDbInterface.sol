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

import "../../contracts/Asset/AssetGeneralStructContract.sol";

/// @title this interface defines the functions that both consuming and producing assets are sharing
interface AssetDbInterface {

    function getAssetGeneral(uint _assetId) external  view returns (AssetGeneralStructContract.AssetGeneral general);
   
    function setActive(uint _assetId, bool _active) external;
    function getActive(uint _assetId) external view returns (bool);

    function setLastSmartMeterReadFileHash(uint _assetId, string _lastSmartMeterReadFileHash) external;
    function getLastSmartMeterReadFileHash(uint _assetId) external view returns (string);

    function setLastSmartMeterReadWh(uint _assetId, uint _lastSmartMeterReadWh) external;
    function getLastSmartMeterReadWh(uint _assetId) external  view returns (uint);

    function setAssetOwner(uint _assetId, address _owner) external;
    function getAssetOwner(uint _assetId) external view returns (address);

    function setSmartMeter(uint _assetId, address _smartMeter) external;
    function getSmartMeter(uint _assetId) external view returns (address);


    function getIsBundled(uint _assetId) external view returns (bool);
    function setIsBundled(uint _assetId, bool _bundled) external;

    function setMarketLookupContract(uint _assetId, address _marketLookupContract) external;
    function getMarketLookupContract(uint _assetId) external view returns (address);

    function addMatcher(uint _assetId, address _matcher) external;
    function getMatcher(uint _assetId) external view returns (address[]);

    function setMatcher(uint _assetId, address[] _matcher) public;
    function removeMatcher(uint _assetId, address _removal) public returns (bool);

    function setSmartMeterRead(uint _assetId, uint lastSmartMeterReadWh, string _lastSmartMeterReadFileHash) external;

    function getAssetListLength() external view returns (uint);
}