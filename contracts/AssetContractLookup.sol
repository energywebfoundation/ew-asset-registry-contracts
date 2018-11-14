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

pragma solidity ^0.5.0;

import "ew-utils-general-contracts/contracts/Msc/Owned.sol";
import "ew-utils-general-contracts/contracts/Interfaces/Updatable.sol";
import "ew-user-registry-contracts/contracts/Interfaces/UserContractLookupInterface.sol";
import "../contracts/Interfaces/AssetContractLookupInterface.sol";

/// @title Contract for storing the current logic-contracts-addresses for the certificate of origin
contract AssetContractLookup is Owned, AssetContractLookupInterface {

    Updatable public assetConsumingRegistry;
    Updatable public assetProducingRegistry;
    UserContractLookupInterface public userRegistry;

    uint public maxMatcherPerAsset;

    /// @notice The constructor 
    constructor() Owned(msg.sender) public{
        maxMatcherPerAsset = 10;
    } 

    /// @notice function to initialize the contracts, setting the needed contract-addresses
    /// @param _userRegistry user-registry logic contract address
    /// @param _assetProducingRegistry asset-registry logic contract address
    function init(
        UserContractLookupInterface _userRegistry, 
        Updatable _assetProducingRegistry, 
        Updatable _assetConsumingRegistry, 
        address _assetProducingDB, 
        address _assetConsumingDB
    ) 
        external
        onlyOwner
    {
        require(    
            address(_userRegistry) != address(0) && address(_assetProducingRegistry) != address(0) && address(_assetConsumingRegistry) != address(0)
            && address(userRegistry) == address(0) && address(assetProducingRegistry) == address(0) && address(assetConsumingRegistry) == address(0),
            "alreadny initialized"
        );
        require(_assetProducingDB != address(0), "assetProducingDB cannot be 0");
        require(_assetConsumingDB != address(0), "assetConsumingDB cannot be 0");

        userRegistry = _userRegistry;
        assetProducingRegistry = _assetProducingRegistry;
        assetConsumingRegistry = _assetConsumingRegistry;

        assetProducingRegistry.init(_assetProducingDB, msg.sender);
        assetConsumingRegistry.init(_assetConsumingDB, msg.sender);
    }

    /// @notice function to update one or more logic-contracts
    /// @param _assetProducingRegistry address of the new asset-registry-logic-contract
    function update(
        Updatable _assetProducingRegistry, 
        Updatable _assetConsumingRegistry
    )
        external
        onlyOwner 
    {
        if (address(_assetProducingRegistry) != address(0)) {
            assetProducingRegistry.update(address(_assetProducingRegistry));
            assetProducingRegistry = _assetProducingRegistry;
        }

        if(address(_assetConsumingRegistry) != address(0)) {
            assetConsumingRegistry.update(address(_assetConsumingRegistry));
            assetConsumingRegistry = _assetConsumingRegistry;
        }        
    }

    function assetConsumingRegistry() external view returns (address){
        return address(assetConsumingRegistry);
    }

    function assetProducingRegistry() external view returns (address){
        return address(assetProducingRegistry);
    }
        
    function maxMatcherPerAsset() external view returns (uint){
        return maxMatcherPerAsset;
    }

    function userRegistry() external view returns (address){
        return address(userRegistry);
    }

}