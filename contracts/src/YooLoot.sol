// SPDX-License-Identifier: AGPL-1.0
pragma solidity 0.8.7;

import "./interfaces/ILoot.sol";
import "./interfaces/ILootXP.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract YooLoot {
    event LootDeckSubmitted(address indexed player, uint256 indexed lootId, bytes32 deckHash);
    event LootDeckCanceled(address indexed player, uint256 indexed lootId);

    event LootDeckRevealed(uint256 indexed lootId, uint8[8] deck);

    event WinnerWithdrawal(address indexed winner, address indexed playerPastOwner, uint256 indexed lootId);
    event LootWithdrawn(address indexed playerPastOwner, uint256 indexed lootId, uint256 xpGaimed);


    event Cloned(address indexed loot, bool winnerGetLoot, uint8 commit3HPeriod, uint8 reveal3HPeriod, uint8 winner3HPeriod, address newYooLoot, bool authorizedAsXPSource);

    struct Parameters {
        ILoot loot;
        uint40 startTime;
        uint8 commit3HPeriod;
        uint8 reveal3HPeriod;
        uint8 winner3HPeriod;
        bool winnerGetLoot;
    }

    struct TokenData {
        uint256 id;
        string tokenURI;
        uint8[8] deckPower;
    }

    Parameters private _paramaters;

    mapping(uint256 => address) private _deposits;
    mapping(uint256 => bytes32) private _deckHashes;
    mapping(uint8 => mapping(uint8 => uint256)) private _rounds;

    address private immutable _originalLoot;
    address private immutable _mloot;
    address private immutable _lootForEveryone;

    ILootXP private immutable _lootXP;

    constructor(
        ILootXP lootXP,
        address[3] memory authorizedLoots,
        ILoot loot,
        bool winnerGetLoot,
        uint8 commit3HPeriod,
        uint8 reveal3HPeriod,
        uint8 winner3HPeriod
    ) {
        _lootXP = lootXP;
        _originalLoot = authorizedLoots[0];
        _mloot = authorizedLoots[1];
        _lootForEveryone = authorizedLoots[2];
        _init(loot, winnerGetLoot, commit3HPeriod, reveal3HPeriod, winner3HPeriod);
    }

    function _init(
        ILoot loot,
        bool winnerGetLoot,
        uint8 commit3HPeriod,
        uint8 reveal3HPeriod,
        uint8 winner3HPeriod
    ) internal {
        require(_paramaters.startTime == 0, "ALREADY_INITIALISED");
        require(commit3HPeriod >= 2, "COMMIT_PERIOD_TOO_SHORT"); // 6 hours
        require(commit3HPeriod >= 8 ? reveal3HPeriod >= 8: reveal3HPeriod >= commit3HPeriod, "REVEAL_PERIOD_TOO_SHORT");
        require(reveal3HPeriod <= 24, "REVEAL_PERIOD_TOO_LONG"); // 3 days
        require(commit3HPeriod >= 8 ? winner3HPeriod >= 8: winner3HPeriod >= commit3HPeriod, "WINNER_PERIOD_TOO_SHORT");
        require(winner3HPeriod <= 24, "WINNER_PERIOD_TOO_LONG"); // 3 days
        _paramaters.loot = loot;
        _paramaters.winnerGetLoot = winnerGetLoot;
        _paramaters.startTime = uint40(block.timestamp);
        _paramaters.commit3HPeriod = commit3HPeriod;
        _paramaters.reveal3HPeriod = reveal3HPeriod;
        _paramaters.winner3HPeriod = winner3HPeriod;
    }

    function freeFormInit(
        ILoot loot,
        bool winnerGetLoot,
        uint8 commit3HPeriod,
        uint8 reveal3HPeriod,
        uint8 winner3HPeriod
    ) public {
        _init(loot, winnerGetLoot, commit3HPeriod, reveal3HPeriod, winner3HPeriod);
    }

    function init(
        ILoot loot,
        bool winnerGetLoot,
        uint8 commit3HPeriod,
        uint8 reveal3HPeriod,
        uint8 winner3HPeriod
    ) public {
        require(address(loot) != address(0), "INVALID_ZERO_LOOT");
        require(address(loot) == _originalLoot || address(loot) == _mloot || address(loot) == _lootForEveryone, "INVALID LOOT");
        _init(loot, winnerGetLoot, commit3HPeriod, reveal3HPeriod, winner3HPeriod);
    }

    function clone(
        ILoot loot,
        bool winnerGetLoot,
        uint8 commit3HPeriod,
        uint8 reveal3HPeriod,
        uint8 winner3HPeriod
    ) external returns (address) {
        return _clone(loot, winnerGetLoot, commit3HPeriod, reveal3HPeriod, winner3HPeriod, true);
    }

    function freeFormClone(
        ILoot loot,
        bool winnerGetLoot,
        uint8 commit3HPeriod,
        uint8 reveal3HPeriod,
        uint8 winner3HPeriod
    ) external returns (address) {
        return _clone(loot, winnerGetLoot, commit3HPeriod, reveal3HPeriod, winner3HPeriod, false);
    }

    function _clone(
        ILoot loot,
        bool winnerGetLoot,
        uint8 commit3HPeriod,
        uint8 reveal3HPeriod,
        uint8 winner3HPeriod,
        bool generateXP
    ) internal returns(address) {
        address implementation;
        // solhint-disable-next-line security/no-inline-assembly
        assembly {
            implementation := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)
        }
        if (implementation == address(0)) {
            implementation = address(this);
        }
        address yooloot = Clones.clone(implementation);
        if (generateXP) {
            YooLoot(yooloot).init(loot, winnerGetLoot, commit3HPeriod, reveal3HPeriod, winner3HPeriod);
            _lootXP.setSource(yooloot, true);
        } else {
            YooLoot(yooloot).freeFormInit(loot, winnerGetLoot, commit3HPeriod, reveal3HPeriod, winner3HPeriod);
        }
        emit Cloned(address(loot), winnerGetLoot, commit3HPeriod, reveal3HPeriod, winner3HPeriod, yooloot, generateXP);
        return yooloot;
    }

    function commitLootDeck(uint256 lootId, bytes32 deckHash) external {
        require((block.timestamp - _paramaters.startTime) < (3 hours * uint256(_paramaters.commit3HPeriod)), "COMMIT_PERIOD_OVER");
        require(deckHash != 0x0000000000000000000000000000000000000000000000000000000000000001, "INVALID HASH");
        _deckHashes[lootId] = deckHash;
        _deposits[lootId] = msg.sender;
        _paramaters.loot.transferFrom(msg.sender, address(this), lootId);
        emit LootDeckSubmitted(msg.sender, lootId, deckHash);
    }

    function changeDeck(uint256 oldLootId, uint256 lootId, bytes32 deckHash) external {
        require((block.timestamp - _paramaters.startTime) < (3 hours * uint256(_paramaters.commit3HPeriod)), "COMMIT_PERIOD_OVER");
        require(deckHash != 0x0000000000000000000000000000000000000000000000000000000000000001, "INVALID HASH");
        require(msg.sender == _deposits[oldLootId], "NOT_YOUR_LOOT");
        _deckHashes[lootId] = deckHash;
        if (oldLootId != lootId) {
            _deckHashes[oldLootId] = 0x0000000000000000000000000000000000000000000000000000000000000000;
            _deposits[oldLootId] = address(0);
            _deposits[lootId] = msg.sender;
            _paramaters.loot.safeTransferFrom(address(this), msg.sender, oldLootId);
            _paramaters.loot.transferFrom(msg.sender, address(this), lootId);
        }

        emit LootDeckCanceled(msg.sender, oldLootId);
        emit LootDeckSubmitted(msg.sender, lootId, deckHash);
    }

    function cancelDeck(uint256 oldLootId) external {
        require((block.timestamp - _paramaters.startTime) < (3 hours * uint256(_paramaters.commit3HPeriod)), "COMMIT_PERIOD_OVER");
        require(msg.sender == _deposits[oldLootId], "NOT_YOUR_LOOT");
        _deckHashes[oldLootId] = 0x0000000000000000000000000000000000000000000000000000000000000000;
        _deposits[oldLootId] = address(0);
        _paramaters.loot.safeTransferFrom(address(this), msg.sender, oldLootId);
        emit LootDeckCanceled(msg.sender, oldLootId);
    }

    function revealLootDeck(
        uint256 lootId,
        uint8[8] calldata deckWithStartIndex1,
        bytes32 secret
    ) external {
        uint256 commitPeriod = (3 hours * uint256(_paramaters.commit3HPeriod));
        uint256 timePassed = block.timestamp - _paramaters.startTime;

        require(timePassed > commitPeriod, "REVEAL_PERIOD_NOT_STARTED");

        require(timePassed < commitPeriod + 3 hours * uint256(_paramaters.reveal3HPeriod), "REVEAL_PERIOD_OVER");

        bytes32 deckHash = _deckHashes[lootId];
        require(deckHash != 0x0000000000000000000000000000000000000000000000000000000000000001, "ALREADY_REVEALED");
        require(keccak256(abi.encodePacked(secret, lootId, deckWithStartIndex1)) == deckHash, "INVALID_SECRET'");
        _deckHashes[lootId] = 0x0000000000000000000000000000000000000000000000000000000000000001;
        uint8[8] memory indicesUsed;
        for (uint8 i = 0; i < 8; i++) {
            uint8 index = deckWithStartIndex1[i] - 1;
            indicesUsed[index]++;
            uint8 power = pluckPower(lootId, index, address(_paramaters.loot) == _lootForEveryone);
            uint256 current = _rounds[i][power];
            if (current == 0) {
                _rounds[i][power] = lootId;
            } else if (current != 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) {
                _rounds[i][power] = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
            }
        }
        for (uint8 i = 0; i < 8; i++) {
            require(indicesUsed[i] == 1, "INVALID_DECK");
        }
        emit LootDeckRevealed(lootId, deckWithStartIndex1);
    }

    // solhint-disable-next-line code-complexity
    function winner()
        public
        view
        returns (
            address winnerAddress,
            uint256 winnerLootId,
            uint256 winnerScore
        )
    {
        require((block.timestamp - _paramaters.startTime) > (3 hours * (uint256(_paramaters.commit3HPeriod) + uint256(_paramaters.reveal3HPeriod))), "REVEAL_PERIOD_NOT_OVER");

        uint256[8] memory winnerLootPerRound;
        for (uint8 round = 0; round < 8; round++) {
            for (uint8 power = 126; power > 0; power--) {
                uint256 lootId = _rounds[round][power - 1];
                if (lootId > 0 && lootId != 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) {
                    winnerLootPerRound[round] = lootId;
                    winnerAddress = 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF;
                    break;
                }
            }
        }

        if (winnerAddress != 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF) { // nobody won a round;
            return (address(0), 0, 0);
        }

        for (uint8 i = 0; i < 8; i++) {
            uint8 extra = 0;
            uint8 tmpScore;
            for (uint8 j = 0; j < 8; j++) {
                if (winnerLootPerRound[j] == 0) {
                    extra += (j + 1);
                } else if (winnerLootPerRound[j] == winnerLootPerRound[i]) {
                    tmpScore += extra + (j + 1);
                    extra = 0;
                }
            }
            if (tmpScore >= winnerScore) {
                // give more power to player who win later rounds
                winnerLootId = winnerLootPerRound[i];
                winnerScore = tmpScore;
            }
        }
        winnerAddress = _deposits[winnerLootId];
    }

    function getDeckHash(uint256 lootId) external view returns(bytes32) {
        return _deckHashes[lootId];
    }

    function getParams() external view returns (Parameters memory) {
        return _paramaters;
    }

    // solhint-disable-next-line code-complexity
    function individualScore(uint256 lootId) public view returns (uint256 score) {
        require(
            lootId > 0 && lootId != 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF,
            "INVALID_LOOT"
        );

        require((block.timestamp - _paramaters.startTime) > (3 hours * (uint256(_paramaters.commit3HPeriod) + uint256(_paramaters.reveal3HPeriod))), "REVEAL_PERIOD_NOT_OVER");

        uint256 extra = 0;
        for (uint8 round = 0; round < 8; round++) {
            bool anyone = false;
            for (uint8 power = 126; power > 0; power--) {
                uint256 lootIdHere = _rounds[round][power - 1];
                if (lootIdHere == lootId) {
                    score += (round + 1) + extra;
                    anyone = true;
                    break;
                } else if (
                    lootIdHere > 0 && lootIdHere != 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
                ) {
                    anyone = true;
                    break;
                }
            }
            if (!anyone) {
                extra += (round + 1);
            } else {
                extra = 0;
            }
        }
    }

    ///@notice get all info in the minimum calls
    function getTokenDataOfOwner(
        address owner,
        uint256 start,
        uint256 num
    ) external view returns (TokenData[] memory tokens) {
        uint256 balance = _paramaters.loot.balanceOf(owner);
        require(balance >= start + num, "TOO_MANY_TOKEN_REQUESTED");
        tokens = new TokenData[](num);
        uint8[8] memory baseDeck = [1,2,3,4,5,6,7,8];
        uint256 i = 0;
        while (i < num) {
            uint256 id = _paramaters.loot.tokenOfOwnerByIndex(owner, start + i);
            tokens[i] = TokenData(id, _paramaters.loot.tokenURI(id), getDeckPower(id, baseDeck, address(_paramaters.loot) == _lootForEveryone));
            i++;
        }
    }

    function getTokenData(
        uint256 id
    ) external view returns (TokenData memory) {
        uint8[8] memory baseDeck = [1,2,3,4,5,6,7,8];
        return TokenData(id, _paramaters.loot.tokenURI(id), getDeckPower(id, baseDeck, address(_paramaters.loot) == _lootForEveryone));
    }

    function claimVictoryLoot(uint256 lootToPick) external {
        require(_paramaters.winnerGetLoot, "NO_LOOT_TO_WIN");

        require((block.timestamp - _paramaters.startTime) < (3 hours * (uint256(_paramaters.commit3HPeriod) + uint256(_paramaters.reveal3HPeriod) + uint256(_paramaters.winner3HPeriod))), "VICTORY_PERIOD_OVER");

        (address winnerAddress, , ) = winner();
        require(winnerAddress == msg.sender, "NOT_WINNER");
        require(_deposits[lootToPick] != msg.sender, "ALREADY_OWNER");
        _paramaters.loot.safeTransferFrom(address(this), msg.sender, lootToPick);
        _paramaters.startTime = 1;
    }

    function claimVictoryERC20(IERC20 token) external {
        require(address(token) != address(_paramaters.loot), "INVALID_ERC20");
        (address winnerAddress, , ) = winner();
        require(winnerAddress == msg.sender, "NOT_WINNER");
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    function withdrawAndGetXP(uint256 lootId) external {
        (address winnerAddress, uint256 winnerLootId, uint256 winnerScore) = winner();

        if (!((block.timestamp - _paramaters.startTime) > (3 hours * (uint256(_paramaters.commit3HPeriod) + uint256(_paramaters.reveal3HPeriod) + uint256(_paramaters.winner3HPeriod))))) {
            require(winnerAddress == address(0), "VICTORY_PERIOD_NOT_OVER");
        }

        require(_deposits[lootId] == msg.sender, "NOT_OWNER");
        require(
            _deckHashes[lootId] == 0x0000000000000000000000000000000000000000000000000000000000000001,
            "DID_NOT_REVEAL"
        );
        _paramaters.loot.safeTransferFrom(address(this), msg.sender, lootId);
        if (lootId == winnerLootId) {
            _lootXP.addXP(lootId, 10000 * winnerScore);
        } else {
            uint256 score = individualScore(lootId);
            _lootXP.addXP(lootId, 100 + 1000 * score);
        }
    }

    function getDeckPower(uint256 lootId, uint8[8] memory deckWithStartIndex1, bool lootForEveryone) public pure returns (uint8[8] memory deckPower) {
        for (uint8 i = 0; i < 8; i++) {
            deckPower[i] = pluckPower(lootId, deckWithStartIndex1[i] - 1, lootForEveryone);
        }
    }

    // -----------------------------------------------------------

    function pluckPower(uint256 lootId, uint256 gearType, bool lootForEveryone) internal pure returns (uint8 power) {
        (uint256 index, uint256 greatness) = pluck(lootId, gearType, lootForEveryone);
        if (greatness <= 14) {
            greatness = 3;
        } else if (greatness == 19) {
            greatness = 1;
        } else if (greatness == 20) {
            greatness = 0;
        } else {
            greatness = 2;
        }
        if (gearType == 0) {
            return uint8(125 - index);
        } else if (gearType < 6) {
            return uint8(125 - (18 + (gearType - 1) * 15 + index));
        } else if (gearType == 6) {
            return uint8(125 - (18 + 5 * 15 + index * 4 + greatness));
        } else {
            return uint8(125 - (18 + 5 * 15 + 3 * 4 + index * 4 + greatness));
        }
    }

    // solhint-disable-next-line code-complexity
    function pluck(uint256 tokenId, uint256 gearType, bool lootForEveryone) internal pure returns (uint256 index, uint256 greatness) {
        string memory keyPrefix = "WEAPON";
        uint256 length = 18;
        if (gearType == 1) {
            keyPrefix = "CHEST";
            length = 15;
        } else if (gearType == 2) {
            keyPrefix = "HEAD";
            length = 15;
        } else if (gearType == 3) {
            keyPrefix = "WAIST";
            length = 15;
        } else if (gearType == 4) {
            keyPrefix = "FOOT";
            length = 15;
        } else if (gearType == 5) {
            keyPrefix = "HAND";
            length = 15;
        } else if (gearType == 6) {
            keyPrefix = "NECK";
            length = 3;
        } else if (gearType == 7) {
            keyPrefix = "RING";
            length = 5;
        }

        // TODO test if necessary
        uint256 rand;
        if (!lootForEveryone || tokenId < 8001) {
            rand = random(string(abi.encodePacked(keyPrefix, toString(tokenId))));
        } else {
            rand = random(string(abi.encodePacked(keyPrefix, abi.encodePacked(address(uint160(tokenId))))));
        }

        index = rand % length;
        greatness = rand % 21;
    }

    // TODO test
    // solhint-disable-next-line code-complexity
    function pluckGreatness(uint256 tokenId, uint256 gearType) internal pure returns (uint8) {
        string memory keyPrefix = "WEAPON";
        if (gearType == 1) {
            keyPrefix = "CHEST";
        } else if (gearType == 2) {
            keyPrefix = "HEAD";
        } else if (gearType == 3) {
            keyPrefix = "WAIST";
        } else if (gearType == 4) {
            keyPrefix = "FOOT";
        } else if (gearType == 5) {
            keyPrefix = "HAND";
        } else if (gearType == 6) {
            keyPrefix = "NECK";
        } else if (gearType == 7) {
            keyPrefix = "RING";
        }
        uint256 rand;
        if (tokenId < 8001) {
            rand = random(string(abi.encodePacked(keyPrefix, toString(tokenId))));
        } else {
            rand = random(string(abi.encodePacked(keyPrefix, abi.encodePacked(address(uint160(tokenId))))));
        }

        uint8 greatness = uint8(rand % 21);
        return greatness;
    }

    function toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT license
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function random(string memory input) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(input)));
    }
}
