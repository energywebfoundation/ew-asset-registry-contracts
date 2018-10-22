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

import "ew-user-registry-contracts/Users/RoleManagement.sol";
import "ew-utils-general-contracts/Interfaces/Updatable.sol";
import "../../contracts/Interfaces/AssetDbInterface.sol";
import "../../contracts/Interfaces/AssetGeneralInterface.sol";
import "../../contracts/AssetContractLookup.sol";
import "../../contracts/Asset/AssetGeneralStructContract.sol";

/// @title Contract for storing the current logic-contracts-addresses for the certificate of origin
contract AssetLogic is RoleManagement, Updatable, AssetGeneralInterface, AssetGeneralStructContract {

    event LogAssetCreated(address _sender, uint indexed _assetId);
    event LogAssetFullyInitialized(uint indexed _assetId);
    event LogAssetSetActive(uint indexed _assetId);
    event LogAssetSetInactive(uint indexed _assetId);
    event LogNewMeterRead(
        uint indexed _assetId, 
        uint _oldMeterRead, 
        uint _newMeterRead
    );


    AssetDbInterface public db;

    modifier isInitialized {
        require(address(db) != 0x0);
        _;
    }

    /**
        external functions
    */
    /// @notice function toinizialize the database, can only be called once
    /// @param _dbAddress address of the database contract
    function init(address _dbAddress, address _admin) 
        external
        onlyOwner
    {
        require(address(db) == 0x0);
        db = AssetDbInterface(_dbAddress);
    }

    /// @notice Sets active to false
    /// @param _assetId The id belonging to an entry in the asset registry
    /// @param _active flag if the asset is asset or not
    function setActive(uint _assetId, bool _active)
        external
        isInitialized
        onlyRole(RoleManagement.Role.AssetAdmin)
    {
       
        db.setActive(_assetId, _active);
        if (_active) {
            emit LogAssetSetActive(_assetId);
        } else {
            emit LogAssetSetInactive(_assetId);
        } 
    }

    function setMarketLookupContract(uint _assetId, address _marketContractLookup)
        external   
    {
        require(msg.sender == db.getAssetOwner(_assetId),"sender is not the assetOwner");
        db.setMarketLookupContract(_assetId, _marketContractLookup);
    }

    /// @notice Updates the logic contract
    /// @param _newLogic Address of the new logic contract
    function update(address _newLogic) 
        external
        onlyOwner
    {
        Owned(db).changeOwner(_newLogic);
    }

    /// @notice Function to get the amount of all assets
    /// @dev needed to iterate though all the asset
    /// @return the amount of all assets
    function getAssetListLength()
        external
        view 
        returns (uint)
    {
       return db.getAssetListLength();
    }


    function getMarketLookupContract(uint _assetId)
        external   
        view
        returns (address)
    {
        return db.getMarketLookupContract(_assetId);
    }

    function getMatcher(uint _assetId)
        external
        view
        returns(address[])
    {
        return db.getMatcher(_assetId);
    }

    function addMatcher(uint _assetId, address _new) external {
        
        require(msg.sender == db.getAssetOwner(_assetId),"addMatcher: not the owner");    
        address[] memory matcher = db.getMatcher(_assetId);
        require(matcher.length+1 <= AssetContractLookup(owner).maxMatcherPerAsset(),"addMatcher: too many matcher already");
            
        db.addMatcher(_assetId,_new);    
    }
 
    function removeMatcher(uint _assetId, address _remove) external  {
        require(msg.sender == db.getAssetOwner(_assetId),"removeMatcher: not the owner");
        require(db.removeMatcher(_assetId,_remove),"removeMatcher: address not found");
    
    }

    function checkAssetGeneralExistingStatus(AssetGeneralStructContract.AssetGeneral _assetGeneral) internal pure returns (bool) {
        return !(
            _assetGeneral.smartMeter == 0x0 
            && _assetGeneral.owner == 0x0
            && _assetGeneral.lastSmartMeterReadWh == 0
            && !_assetGeneral.active
            && bytes(_assetGeneral.lastSmartMeterReadFileHash).length == 0
            && _assetGeneral.matcher.length == 0
            && bytes(_assetGeneral.propertiesDocumentHash).length == 0
            && bytes(_assetGeneral.url).length == 0
            && _assetGeneral.marketLookupContract == 0x0
        );
    }

    function setSmartMeterReadInternal(
        uint _assetId, 
        uint _newMeterRead, 
        string _smartMeterReadFileHash
    ) internal {

        AssetGeneralStructContract.AssetGeneral memory asset = db.getAssetGeneral(_assetId);
        require(asset.smartMeter == msg.sender,"saveSmartMeterRead: wrong sender");
        require(asset.active,"saveSmartMeterRead: asset not active");

        uint oldMeterRead = asset.lastSmartMeterReadWh; 

        require(_newMeterRead > oldMeterRead,"saveSmartMeterRead: meterread too low");
        /// @dev need to check if new meter read is higher then the old one

        db.setSmartMeterRead(_assetId, _newMeterRead, _smartMeterReadFileHash);
     
        emit LogNewMeterRead(
            _assetId, 
            oldMeterRead, 
            _newMeterRead
        );
    } 

    function getAssetGeneral(uint _assetId) external view returns (
        address smartMeter,
        address owner,
        uint lastSmartMeterReadWh,
        bool active,
        string lastSmartMeterReadFileHash,
        address[] matcher,
        string propertiesDocumentHash,
        string url,
        address marketLookupContract,
        bool bundled
    )
    {
        AssetGeneral memory a = db.getAssetGeneral(_assetId);

        smartMeter = a.smartMeter;
        owner = a.owner;
        lastSmartMeterReadWh = a.lastSmartMeterReadWh;
        active = a.active;
        lastSmartMeterReadFileHash = a.lastSmartMeterReadFileHash;
        matcher = a.matcher;
        propertiesDocumentHash = a.propertiesDocumentHash;
        url = a.url;
        marketLookupContract = a.marketLookupContract;
        bundled = a.bundled;
    }

    function getAssetOwner(uint _assetId) external view returns (address){
        return db.getAssetGeneral(_assetId).owner;
    }
}