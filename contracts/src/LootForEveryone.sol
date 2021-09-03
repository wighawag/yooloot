// SPDX-License-Identifier: AGPL-1.0
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import "./ERC721Base.sol";
import "./interfaces/ISyntheticLoot.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";

contract LootForEveryone is ERC721Base {
    using EnumerableSet for EnumerableSet.UintSet;
    using ECDSA for bytes32;

    struct TokenData {
        uint256 id;
        string tokenURI;
    }

    struct TokenDataToClaim {
        uint256 id;
        string tokenURI;
        bool claimed;
    }

    ISyntheticLoot private immutable _syntheticLoot;

    constructor(ISyntheticLoot syntheticLoot) {
        _syntheticLoot = syntheticLoot;
    }

    /// @notice A descriptive name for a collection of NFTs in this contract
    function name() external pure returns (string memory) {
        return "Loot For Everyone";
    }

    /// @notice An abbreviated name for NFTs in this contract
    function symbol() external pure returns (string memory) {
        return "LOOT";
    }

    function tokenURI(uint256 id) external view returns (string memory) {
        return _tokenURI(id);
    }

    ///@notice get all info in the minimum way
    function getTokenDataOfOwner(
        address owner,
        uint256 start,
        uint256 num
    ) external view returns (TokenData[] memory tokens) {
        require(start < 2**160 && num < 2**160, "INVALID_RANGE");
        EnumerableSet.UintSet storage allTokens = _holderTokens[owner];
        uint256 balance = allTokens.length();
        (, bool registered) = _ownerOfAndRegistered(uint256(owner));
        if (!registered) {
            // owned token was never registered, add balance
            balance++;
        }
        require(balance >= start + num, "TOO_MANY_TOKEN_REQUESTED");
        tokens = new TokenData[](num);
        uint256 i = 0;
        uint256 offset = 0;
        if (start == 0 && !registered) {
            // if start at zero consider unregistered token
            tokens[0] = TokenData(uint256(owner), _tokenURI(uint256(owner)));
            offset = 1;
            i = 1;
        }
        while (i < num) {
            uint256 id = allTokens.at(start + i - offset);
            tokens[i] = TokenData(id, _tokenURI(id));
            i++;
        }
    }

    function getTokenDataForIds(uint256[] memory ids) external view returns (TokenDataToClaim[] memory tokens) {
        tokens = new TokenDataToClaim[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            (, bool registered) = _ownerOfAndRegistered(id);
            tokens[i] = TokenDataToClaim(id, _tokenURI(id), registered);
        }
    }

    /// @notice utility function to claim a token when you know the private key of an address, go hunt for your loot!
    function pickLoot(address to, bytes memory signature) external {
        require(to != address(0), "NOT_TO_ZEROADDRESS");
        bytes32 hashedData = keccak256(abi.encodePacked("LootForEveryone", to));
        address signer = hashedData.toEthSignedMessageHash().recover(signature);
        (, bool registered) = _ownerOfAndRegistered(uint256(signer));
        require(!registered, "ALREADY_CALIMED");
        _transferFrom(signer, to, uint256(signer), false);
    }

    function weaponComponents(uint256 id) external  view returns (uint256[5] memory) {
        require(uint256(address(id)) == id, "NONEXISTENT_TOKEN");
        return _syntheticLoot.weaponComponents(address(id));
    }

    function chestComponents(uint256 id) external view returns (uint256[5] memory) {
        return _syntheticLoot.chestComponents(address(id));
    }

    function headComponents(uint256 id) external view returns (uint256[5] memory) {
        return _syntheticLoot.headComponents(address(id));
    }

    function waistComponents(uint256 id) external view returns (uint256[5] memory) {
        return _syntheticLoot.waistComponents(address(id));
    }

    function footComponents(uint256 id) external view returns (uint256[5] memory) {
        return _syntheticLoot.footComponents(address(id));
    }

    function handComponents(uint256 id) external view returns (uint256[5] memory) {
        return _syntheticLoot.handComponents(address(id));
    }

    function neckComponents(uint256 id) external view returns (uint256[5] memory) {
        return _syntheticLoot.neckComponents(address(id));
    }

    function ringComponents(uint256 id) external view returns (uint256[5] memory) {
        return _syntheticLoot.ringComponents(address(id));
    }

    function getWeapon(uint256 id) external view returns (string memory) {
        return _syntheticLoot.getWeapon(address(id));
    }

    function getChest(uint256 id) external view returns (string memory) {
        return _syntheticLoot.getChest(address(id));
    }

    function getHead(uint256 id) external view returns (string memory) {
        return _syntheticLoot.getHead(address(id));
    }

    function getWaist(uint256 id) external view returns (string memory) {
        return _syntheticLoot.getWaist(address(id));
    }

    function getFoot(uint256 id) external view returns (string memory) {
        return _syntheticLoot.getFoot(address(id));
    }

    function getHand(uint256 id) external view returns (string memory) {
        return _syntheticLoot.getHand(address(id));
    }

    function getNeck(uint256 id) external view returns (string memory) {
        return _syntheticLoot.getNeck(address(id));
    }

    function getRing(uint256 id) external view returns (string memory) {
        return _syntheticLoot.getRing(address(id));
    }


    // -------------------------------------------------------------------------------------------------
    // INTERNAL
    // -------------------------------------------------------------------------------------------------

    function _tokenURI(uint256 id) internal view returns (string memory) {
        require(uint256(address(id)) == id, "NONEXISTENT_TOKEN");
        return _syntheticLoot.tokenURI(address(id));
    }
}