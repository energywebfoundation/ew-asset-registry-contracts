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

import "../../contracts/Asset/AssetConsumingDB.sol";
import "../../contracts/AssetContractLookup.sol";
import "../../contracts/Asset/AssetLogic.sol";
import "../../contracts/Interfaces/AssetConsumingInterface.sol";

/// @title The logic contract for the asset registration
/// @notice This contract provides the logic that determines how the data is stored
/// @dev Needs a valid AssetConsumingRegistryDB contract to function correctly 
contract AssetConsumingRegistryLogic is AssetLogic, AssetConsumingInterface {

    event LogNewMeterRead(uint indexed _assetId, uint _oldMeterRead, uint _newMeterRead);

    UserContractLookupInterface public userContractLookup;
    /// @notice Constructor
    constructor(UserContractLookupInterface _userContractLookup, AssetContractLookupInterface _assetContractLookup) RoleManagement(_userContractLookup,_assetContractLookup) public {
        userContractLookup = _userContractLookup;
    }

    /// @notice Logs meter read
    /// @param _assetId The id belonging to an entry in the asset registry
    /// @param _newMeterRead The current meter read of the asset
    /// @param _lastSmartMeterReadFileHash Last meter read file hash
    function saveSmartMeterRead(uint _assetId, uint _newMeterRead, string _lastSmartMeterReadFileHash) 
        external
        isInitialized
    {
        setSmartMeterReadInternal(_assetId, _newMeterRead, _lastSmartMeterReadFileHash);
    }

    /// @notice Gets an asset
    /// @param _assetId The id belonging to an entry in the asset registry
    /// @return Full informations of an asset
    function getAssetById(uint _assetId) 
        external
        view
        returns (
            AssetConsumingDB.Asset
        )
    {        
        return AssetConsumingDB(db).getAssetById(_assetId);
    }

    function getAssetBySmartMeter(address _smartMeter) 
        external 
        view 
        returns (  
            AssetConsumingDB.Asset
        )
    {
        return AssetConsumingDB(db).getAssetBySmartMeter(_smartMeter);
    }

    function createAsset(  
        address _smartMeter,
        address _owner,
        bool _active,
        address[] _matcher,
        string _propertiesDocumentHash,
        string _url
    ) 
        external 
        returns (uint _assetId)
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

        AssetConsumingDB.Asset memory _asset = AssetConsumingDB.Asset(
            {assetGeneral: a}
        );

        _assetId = AssetConsumingDB(db).addFullAsset(_asset);
        emit LogAssetCreated(msg.sender,_assetId);
    }

    function checkAssetExist(address _smartMeter) public view returns (bool){
        return checkAssetGeneralExistingStatus(AssetConsumingDB(db).getAssetBySmartMeter(_smartMeter).assetGeneral);
    }

    
}