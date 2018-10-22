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

import "../../contracts/Asset/AssetProducingDB.sol";
import "../../contracts/AssetContractLookup.sol";
import "ew-origin-contracts/Interfaces/CertificateInterface.sol";
import "ew-origin-contracts/Interfaces/EnergyCertificateBundleInterface.sol";
import "ew-origin-contracts/Interfaces/OriginContractLookupInterface.sol";

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
        uint _newMeterRead
    );

    UserContractLookupInterface public userContractLookup;
    
    /// @notice Constructor
    constructor(UserContractLookupInterface _userContractLookup, AssetContractLookupInterface _assetContractLookup) RoleManagement(_userContractLookup,_assetContractLookup) public {
        userContractLookup = _userContractLookup;
    }

    /// @notice Logs meter read
    /// @param _assetId The id belonging to an entry in the asset registry
    /// @param _newMeterRead The current meter read of the asset
    /// @param _lastSmartMeterReadFileHash Last meter read file hash
    function saveSmartMeterRead(
        uint _assetId, 
        uint _newMeterRead, 
        string _lastSmartMeterReadFileHash
    ) 
        external
        isInitialized
    {
        setSmartMeterReadInternal(_assetId, _newMeterRead, _lastSmartMeterReadFileHash);

        AssetProducingDB.Asset memory asset = AssetProducingDB(db).getAssetById(_assetId);

        uint oldMeterRead = asset.assetGeneral.lastSmartMeterReadWh; 
        if(asset.assetGeneral.marketLookupContract != 0x0){
            if (asset.assetGeneral.bundled) {
                EnergyCertificateBundleInterface(OriginContractLookupInterface(asset.assetGeneral.marketLookupContract).originLogicRegistry()).createBundle(
                    _assetId, 
                    _newMeterRead - oldMeterRead, 
                    asset.maxOwnerChanges,  
                    asset.assetGeneral.matcher
                ); 
                
            } else {
                CertificateInterface(OriginContractLookupInterface(asset.assetGeneral.marketLookupContract).originLogicRegistry()).createCertificate(
                    _assetId, 
                    _newMeterRead - oldMeterRead, 
                    asset.maxOwnerChanges,  
                    asset.assetGeneral.matcher
                ); 
            }
        }
    }

   
    /*
    /// @notice Gets the last filehash 
    /// @param _assetId The id belonging to an entry in the asset registry
    /// @return The last smartmeterread-filehash
    function getLastSmartMeterReadFileHash(uint _assetId) external view returns (string){
        return db.getLastSmartMeterReadFileHash(_assetId);
    }
    */
    function checkMatcherAmount(address[] _matcher) internal view {
        require(_matcher.length <= AssetContractLookup(owner).maxMatcherPerAsset(),"addMatcher: too many matcher already");

    } 

    function checkRoles(address _owner) internal view {
        require (isRole(RoleManagement.Role.AssetManager, _owner),"user does not have the required role"); 
        require (isRole(RoleManagement.Role.AssetAdmin, msg.sender),"user does not have the required role"); 
    }

    function checkBeforeCreation(address[] _matcher, address _owner, address _smartMeter) internal view {
        require(_matcher.length <= AssetContractLookup(owner).maxMatcherPerAsset(),"addMatcher: too many matcher already");
        require (isRole(RoleManagement.Role.AssetManager, _owner),"user does not have the required role"); 
        require (isRole(RoleManagement.Role.AssetAdmin, msg.sender),"user does not have the required role"); 
        require(!checkAssetExist(_smartMeter));
    }

    function createAsset(  
        address _smartMeter,
        address _owner,
        bool _active,
        address[] _matcher,
        string _propertiesDocumentHash,
        string _url,
        uint _numOwnerChanges
    ) 
        external 
    {
        checkBeforeCreation(_matcher, _owner, _smartMeter);

        AssetGeneral memory a = AssetGeneral({
            smartMeter: _smartMeter,
            owner: _owner,
            lastSmartMeterReadWh: 0,
            active: true,
            lastSmartMeterReadFileHash: "",
            matcher: _matcher,
            propertiesDocumentHash: _propertiesDocumentHash,
            url: _url,
            marketLookupContract: 0x0,
            bundled: false
        });

        AssetProducingDB.Asset memory _asset = AssetProducingDB.Asset(
            {assetGeneral: a,
            maxOwnerChanges: _numOwnerChanges
            }
        );

        uint assetId =  AssetProducingDB(db).addFullAsset(_asset);

        emit LogAssetCreated(msg.sender, assetId);
        
    }

    /// @notice Gets an asset
    /// @param _assetId The id belonging to an entry in the asset registry
    /// @return Full informations of an asset
    function getAssetById(uint _assetId) 
        external
        view
        returns (
            AssetProducingDB.Asset
        )
    {        
        return AssetProducingDB(db).getAssetById(_assetId);
    }

    function getAssetBySmartMeter(address _smartMeter) 
        external 
        view 
        returns (  
            AssetProducingDB.Asset
        )
    {
        return AssetProducingDB(db).getAssetBySmartMeter(_smartMeter);
    }

    function checkAssetExist(address _smartMeter) public view returns (bool){
        return checkAssetGeneralExistingStatus(AssetProducingDB(db).getAssetBySmartMeter(_smartMeter).assetGeneral);
    }
}