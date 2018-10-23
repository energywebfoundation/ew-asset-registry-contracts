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
// @authors: Martin Kuechler, martin.kuechler@slock.it

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "ew-utils-general-contracts/Msc/Owned.sol";
import "../../contracts/Interfaces/AssetDbInterface.sol";
import "../../contracts/Asset/AssetGeneralStructContract.sol";

contract AssetGeneralDB is Owned, AssetGeneralStructContract, AssetDbInterface {

    constructor(address _assetLogic) Owned(_assetLogic) public { }

    function getAssetGeneralInternal(uint _assetId) internal view returns (AssetGeneral storage general);
    function getAssetListLength() external view returns (uint);

    function setActive(uint _assetId, bool _active) external onlyOwner {
        getAssetGeneralInternal(_assetId).active = _active;
    }

    function getActive(uint _assetId) external onlyOwner view returns (bool) {
        return getAssetGeneralInternal(_assetId).active;
    }

    function getAssetGeneral(uint _assetId) external onlyOwner view returns (AssetGeneral general){
        return getAssetGeneralInternal(_assetId);
    }

    function getIsBundled(uint _assetId) external onlyOwner view returns (bool) {
        return getAssetGeneralInternal(_assetId).bundled;
    }

    function setIsBundled(uint _assetId, bool _bundled) external onlyOwner {
        getAssetGeneralInternal(_assetId).bundled = _bundled;
    }

    function setLastSmartMeterReadFileHash(uint _assetId, string _lastSmartMeterReadFileHash) external onlyOwner {
        getAssetGeneralInternal(_assetId).lastSmartMeterReadFileHash = _lastSmartMeterReadFileHash;
    }

    function getLastSmartMeterReadFileHash(uint _assetId) external onlyOwner view returns (string) {
        return getAssetGeneralInternal(_assetId).lastSmartMeterReadFileHash;
    }

    function setLastSmartMeterReadWh(uint _assetId, uint _lastSmartMeterReadWh) external onlyOwner {
        getAssetGeneralInternal(_assetId).lastSmartMeterReadWh = _lastSmartMeterReadWh;
    }

    function getLastSmartMeterReadWh(uint _assetId) external onlyOwner view returns (uint) {
        return getAssetGeneralInternal(_assetId).lastSmartMeterReadWh;
    }

    function setAssetOwner(uint _assetId, address _owner) external onlyOwner {
        getAssetGeneralInternal(_assetId).owner = _owner;
    }

    function getAssetOwner(uint _assetId) external onlyOwner view returns (address){
        return getAssetGeneralInternal(_assetId).owner;
    }

    function setSmartMeter(uint _assetId, address _smartMeter) external onlyOwner {
        getAssetGeneralInternal(_assetId).smartMeter = _smartMeter;
    }

    function getSmartMeter(uint _assetId) external onlyOwner view returns (address){
        return getAssetGeneralInternal(_assetId).smartMeter;
    }

    function setMarketLookupContract(uint _assetId, address _marketLookupContract) external onlyOwner {
        getAssetGeneralInternal(_assetId).marketLookupContract = _marketLookupContract;
    }

    function getMarketLookupContract(uint _assetId) external onlyOwner view returns (address){ 
        return getAssetGeneralInternal(_assetId).marketLookupContract;
    }

    function addMatcher(uint _assetId, address _matcher) external onlyOwner {
        getAssetGeneralInternal(_assetId).matcher.push(_matcher);
    }

    function getMatcher(uint _assetId) external onlyOwner view returns (address[]) {
        return getAssetGeneralInternal(_assetId).matcher;
    }

    function setMatcher(uint _assetId, address[] _matcher) public onlyOwner {
        getAssetGeneralInternal(_assetId).matcher = _matcher;
    } 

    function removeMatcher(uint _assetId, address _removal) public onlyOwner returns (bool) {
        
        address[] storage matchers = getAssetGeneralInternal(_assetId).matcher;
        for (uint i = 0; i < matchers.length; i++){
            if(matchers[i] == _removal){
                matchers[i] = matchers[matchers.length-1];
                matchers.length--;
                return true;
            }
        }
    }

    function setSmartMeterRead(
        uint _assetId, 
        uint _lastSmartMeterReadWh, 
        string _lastSmartMeterReadFileHash)
    external
    onlyOwner
    {
        AssetGeneral storage general = getAssetGeneralInternal(_assetId);
        general.lastSmartMeterReadWh = _lastSmartMeterReadWh;
        general.lastSmartMeterReadFileHash = _lastSmartMeterReadFileHash;
    }

    function getLastMeterReadingAndHash(uint _assetId) external onlyOwner view returns (uint _lastSmartMeterReadWh, string _lastSmartMeterReadFileHash) {
        AssetGeneral memory general = getAssetGeneralInternal(_assetId);
        _lastSmartMeterReadWh = general.lastSmartMeterReadWh;
        _lastSmartMeterReadFileHash = general.lastSmartMeterReadFileHash;
    }
}