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
// @authors: slock.it GmbH, Jonas Bentke, jonas.bentke@slock.it

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "../../contracts/Asset/AssetProducingRegistryDB.sol";
import "../../contracts/AssetContractLookup.sol";
import "ew-origin-contracts/Interfaces/CertificateInterface.sol";
import "ew-origin-contracts/Interfaces/EnergyCertificateBundleInterface.sol";
import "ew-origin-contracts/Interfaces/OriginContractLookupInterface.sol";

//import "../Trading/CertificateLogic.sol";
//import "../Trading/EnergyCertificateBundleLogic.sol";
import "../../contracts/Asset/AssetLogic.sol";
import "ew-utils-general-contracts/Msc/Owned.sol";
import "../../contracts/Interfaces/AssetProducingInterface.sol";


/// @title The logic contract for the asset registration
/// @notice This contract provides the logic that determines how the data is stored
/// @dev Needs a valid AssetProducingRegistryDB contract to function correctly
contract AssetProducingRegistryLogic is AssetLogic, AssetProducingInterface {

    event LogNewMeterRead(
        uint indexed _assetId, 
        uint _oldMeterRead, 
        uint _newMeterRead, 
        bool _smartMeterDown, 
        uint _certificatesCreatedForWh, 
        uint _oldCO2OffsetReading, 
        uint _newCO2OffsetReading, 
        bool _serviceDown
    );

    UserContractLookupInterface public userContractLookup;
    
    /// @notice Constructor
    constructor(UserContractLookupInterface _userContractLookup, AssetContractLookupInterface _assetContractLookup) RoleManagement(_userContractLookup,_assetContractLookup) public {
        userContractLookup = _userContractLookup;
    }

    /// @notice Sets the general information of an asset in the database
    /// @param _smartMeter The address of the smart meter
    /// @param _owner The address of the asset owner
    /// @param _maxOwnerChanges amount of allowed owner changes for a certificate created by this asset
    /// @param _matcher matcher address 
    /// @param _active true if active
    /// @param _propertiesDocumentHash document-hash with all the properties of the asset
    /// @param _url url-address of the asset
    function createAsset(
        address _smartMeter,
        address _owner,
        uint _maxOwnerChanges,
        address _matcher,
        bool _active,
        string _propertiesDocumentHash,
        string _url
    ) 
        external
        isInitialized
        userHasRole(RoleManagement.Role.AssetManager, _owner)
        onlyRole(RoleManagement.Role.AssetAdmin)
    {  
        uint _assetId = AssetProducingRegistryDB((db)).createAsset(
            _smartMeter, 
            _owner, 
            _maxOwnerChanges, 
            _active, 
            _matcher, 
            _propertiesDocumentHash, 
            _url
        ); 
        emit LogAssetCreated(msg.sender, _assetId);
    }
    
    /// @notice Logs meter read
    /// @param _assetId The id belonging to an entry in the asset registry
    /// @param _newMeterRead The current meter read of the asset
    /// @param _smartMeterDown flag if there was an error with the smart meter
    /// @param _lastSmartMeterReadFileHash Last meter read file hash
    /// @param _CO2OffsetMeterRead new CO2-offset-reading
    /// @param _CO2OffsetServiceDown flag if there was an error with the co2-offset-server
    function saveSmartMeterReadInternal(
        uint _assetId, 
        uint _newMeterRead, 
        bool _smartMeterDown, 
        string _lastSmartMeterReadFileHash, 
        uint _CO2OffsetMeterRead, 
        bool _CO2OffsetServiceDown,
        bool _bundle
        
    ) 
        internal
        isInitialized
    {
        AssetProducingRegistryDB.Asset memory asset = AssetProducingRegistryDB((db)).getAsset(_assetId);
        require(asset.smartMeter == msg.sender,"saveSmartMeterRead: wrong sender");
        require(asset.active,"saveSmartMeterRead: asset not active");

        uint oldMeterRead = asset.lastSmartMeterReadWh;
        uint oldCO2 = asset.lastSmartMeterCO2OffsetRead;

        require(_newMeterRead>oldMeterRead,"saveSmartMeterRead: meterread too low");
        require(_CO2OffsetMeterRead>oldCO2,"saveSmartMeterRead: CO2 read too low");
        /// @dev need to check if new meter read is higher then the old one
        AssetProducingRegistryDB(db).setLastSmartMeterReadFileHash(_assetId, _lastSmartMeterReadFileHash);
        AssetProducingRegistryDB(db).setLastSmartMeterReadWh(_assetId, _newMeterRead);
        AssetProducingRegistryDB(db).setLastCO2OffsetReading(_assetId,_CO2OffsetMeterRead);
        AssetProducingRegistryDB(db).setCertificatesCreatedForWh(_assetId, _newMeterRead-oldMeterRead);

        /// TODO: re-enable certificates
        if(asset.marketLookupContract != 0x0){
            if (_bundle) {
                EnergyCertificateBundleInterface(OriginContractLookupInterface(asset.marketLookupContract).originLogicRegistry()).createBundle(
                    _assetId, 
                    _newMeterRead - oldMeterRead, 
                    _CO2OffsetMeterRead - oldCO2,  
                    asset.matcher
                ); 
                
            } else {
                CertificateInterface(OriginContractLookupInterface(asset.marketLookupContract).originLogicRegistry()).createCertificate(
                    _assetId, 
                    _newMeterRead - oldMeterRead, 
                    _CO2OffsetMeterRead - oldCO2,  
                    asset.matcher
                ); 
            }
        }
        
        emit LogNewMeterRead(
            _assetId, 
            oldMeterRead, 
            _newMeterRead, 
            _smartMeterDown, 
            asset.certificatesCreatedForWh, 
            asset.lastSmartMeterCO2OffsetRead, 
            _CO2OffsetMeterRead, 
            _CO2OffsetServiceDown
        );
    }

    /// @notice Logs meter read
    /// @param _assetId The id belonging to an entry in the asset registry
    /// @param _newMeterRead The current meter read of the asset
    /// @param _smartMeterDown flag if there was an error with the smart meter
    /// @param _lastSmartMeterReadFileHash Last meter read file hash
    /// @param _CO2OffsetMeterRead new CO2-offset-reading
    /// @param _CO2OffsetServiceDown flag if there was an error with the co2-offset-server
    function saveSmartMeterRead(
        uint _assetId, 
        uint _newMeterRead, 
        bool _smartMeterDown, 
        string _lastSmartMeterReadFileHash, 
        uint _CO2OffsetMeterRead, 
        bool _CO2OffsetServiceDown
    ) 
        external
        isInitialized
    {
        saveSmartMeterReadInternal(_assetId, _newMeterRead, _smartMeterDown, _lastSmartMeterReadFileHash, _CO2OffsetMeterRead, _CO2OffsetServiceDown, false);
    }

        /// @notice Logs meter read
    /// @param _assetId The id belonging to an entry in the asset registry
    /// @param _newMeterRead The current meter read of the asset
    /// @param _smartMeterDown flag if there was an error with the smart meter
    /// @param _lastSmartMeterReadFileHash Last meter read file hash
    /// @param _CO2OffsetMeterRead new CO2-offset-reading
    /// @param _CO2OffsetServiceDown flag if there was an error with the co2-offset-server
    function saveSmartMeterReadBundle(
        uint _assetId, 
        uint _newMeterRead, 
        bool _smartMeterDown, 
        string _lastSmartMeterReadFileHash, 
        uint _CO2OffsetMeterRead, 
        bool _CO2OffsetServiceDown  
    ) 
        external
        isInitialized
    {
        saveSmartMeterReadInternal(_assetId, _newMeterRead, _smartMeterDown, _lastSmartMeterReadFileHash, _CO2OffsetMeterRead, _CO2OffsetServiceDown, true);
    }
   
   
    /// @notice Gets the information of an asset
    /// @param _assetId The id belonging to an entry in the asset registry
    /// @return The information of an asset as seperate fields
    function getAsset(uint _assetId) external view returns (        
        uint _certificatesUsedForWh,
        address _smartMeter,
        address _owner,
        uint _lastSmartMeterReadWh,
        bool _active,
        string _lastSmartMeterReadFileHash,
        address[] _matcher,
        uint _certificatesCreatedForWh,
        uint _lastSmartMeterCO2OffsetRead,
        uint _maxOwnerChanges,
        string _propertiesDocumentHash,
        string _url        )
    {
        AssetProducingRegistryDB.Asset memory asset = AssetProducingRegistryDB(db).getAsset(_assetId);
        _certificatesUsedForWh = asset.certificatesUsedForWh;
        _smartMeter = asset.smartMeter;
        _owner = asset.owner;
        _lastSmartMeterReadWh = asset.lastSmartMeterReadWh;
        _active = asset.active;
        _lastSmartMeterReadFileHash = asset.lastSmartMeterReadFileHash;
        _matcher = asset.matcher;
        _certificatesCreatedForWh = asset.certificatesCreatedForWh;
        _lastSmartMeterCO2OffsetRead = asset.lastSmartMeterCO2OffsetRead;
        _maxOwnerChanges = asset.maxOwnerChanges;
        _propertiesDocumentHash = asset.propertiesDocumentHash;
        _url = asset.url;
    }

    /// @notice Gets the full asset as struct
    /// @param _assetId The id belonging to an entry in the asset registry
    /// @return The struct of the asset
    function getFullAsset(uint _assetId) external view returns (AssetProducingRegistryDB.Asset){
        return AssetProducingRegistryDB((db)).getAsset(_assetId);
    }

    /// @notice Gets the last filehash 
    /// @param _assetId The id belonging to an entry in the asset registry
    /// @return The last smartmeterread-filehash
    function getLastSmartMeterReadFileHash(uint _assetId) external view returns (string){
        return AssetProducingRegistryDB((db)).getAsset(_assetId).lastSmartMeterReadFileHash;
    }

}