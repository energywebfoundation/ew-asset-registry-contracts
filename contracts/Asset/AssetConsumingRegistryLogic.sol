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

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "../../contracts/Asset/AssetConsumingRegistryDB.sol";
import "../../contracts/AssetContractLookup.sol";
import "../../contracts/Asset/AssetLogic.sol";
import "../../contracts/Interfaces/AssetConsumingInterface.sol";

/// @title The logic contract for the asset registration
/// @notice This contract provides the logic that determines how the data is stored
/// @dev Needs a valid AssetConsumingRegistryDB contract to function correctly 
contract AssetConsumingRegistryLogic is AssetLogic, AssetConsumingInterface {

    event LogNewMeterRead(uint indexed _assetId, uint _oldMeterRead, uint _newMeterRead, uint _certificatesUsedForWh, bool _smartMeterDown);

    UserContractLookupInterface public userContractLookup;
    
    /// @notice Constructor
    constructor(UserContractLookupInterface _userContractLookup, AssetContractLookupInterface _assetContractLookup) RoleManagement(_userContractLookup,_assetContractLookup) public {
        userContractLookup = _userContractLookup;
    }

    /// @notice Sets the general information of an asset in the database
    /// @param _smartMeter The address of the smart meter
    /// @param _owner The address of the asset owner
    /// @param _active true if active
    /// @param _matcher matcher-address
    /// @param _propertiesDocumentHash propertiesDocumentHash
    /// @param _url url
    function createAsset (
        address _smartMeter,
        address _owner,
        bool _active,
        address _matcher,
        string _propertiesDocumentHash,
        string _url
    ) 
        external
        isInitialized
        userHasRole(RoleManagement.Role.AssetManager, _owner)
        onlyRole(RoleManagement.Role.AssetAdmin)
    {  
        uint _assetId = AssetConsumingRegistryDB(db).createAsset(_smartMeter,_owner,_active,_matcher, _propertiesDocumentHash, _url);
        emit LogAssetCreated(msg.sender, _assetId);
    }
    
    /// @notice Logs meter read
    /// @param _assetId The id belonging to an entry in the asset registry
    /// @param _newMeterRead The current meter read of the asset
    /// @param _lastSmartMeterReadFileHash Last meter read file hash
    /// @param _smartMeterDown Flag if the smartmeter had an error during reading
    function saveSmartMeterRead(uint _assetId, uint _newMeterRead, string _lastSmartMeterReadFileHash, bool _smartMeterDown) 
        external
        isInitialized
    {
        AssetConsumingRegistryDB.Asset memory asset = AssetConsumingRegistryDB((db)).getAsset(_assetId);
        require(asset.smartMeter == msg.sender,"saveSmartMeterRead: wrong sender");
        require(asset.active,"saveSmartMeterRead: asset not active");
        emit LogNewMeterRead(_assetId,  asset.lastSmartMeterReadWh, _newMeterRead, asset.certificatesUsedForWh, _smartMeterDown);
        db.setLastSmartMeterReadFileHash(_assetId, _lastSmartMeterReadFileHash);
        AssetConsumingRegistryDB((db)).setLastSmartMeterReadWh(_assetId, _newMeterRead);
    }

    /// @notice sets the consumption for a period (in Wh)
    /// @param _assetId assetId
    /// @param _consumed the amount of energy consumed
    function setConsumptionForPeriode(uint _assetId, uint _consumed)
        external
     //   onlyAccount(address(cooContract.marketRegistry()))
    {
        AssetConsumingRegistryDB(db).setCertificatesUsedForWh(_assetId, _consumed);
    }

    /// @notice Gets an asset
    /// @param _assetId The id belonging to an entry in the asset registry
    /// @return Full informations of an asset
    function getAsset(uint _assetId) 
        external
        view
        returns (
            address _smartMeter,
            address _owner,
            uint _lastSmartMeterReadWh,
            uint _certificatesUsedForWh,
            bool _active,
            string _lastSmartMeterReadFileHash,
            string _propertiesDocumentHash,
            string _url,
            address[] _matcher
            )
    {        
        AssetConsumingRegistryDB.Asset memory asset = AssetConsumingRegistryDB((db)).getAsset(_assetId);
        _smartMeter = asset.smartMeter;
        _owner = asset.owner;
        _lastSmartMeterReadWh = asset.lastSmartMeterReadWh;
        _active = asset.active;
        _lastSmartMeterReadFileHash = asset.lastSmartMeterReadFileHash;
        _certificatesUsedForWh = asset.certificatesUsedForWh;
        _propertiesDocumentHash = asset.propertiesDocumentHash;
        _url = asset.url;
        _matcher = asset.matcher;
    }

    
}