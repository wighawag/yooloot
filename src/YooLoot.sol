// SPDX-License-Identifier: AGPL-1.0
pragma solidity 0.8.7;

import "./interfaces/ILoot.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract YooLoot {
    event LootDeckSubmitted(address indexed player, uint256 indexed lootId, bytes32 deckHash);
    event LootDeckRevealed(uint256 indexed lootId, uint8[8] deck);

    uint256 public startTime;
    bool public winnerGetLoot;
    ILoot private _loot;

    mapping(uint256 => address) private _deposits;
    mapping(uint256 => bytes32) private _deckHashes;
    mapping(uint8 => mapping(uint8 => uint256)) private _rounds;

    constructor(ILoot loot, bool _winnerGetLoot) {
        init(loot, _winnerGetLoot);
    }

    function init(ILoot loot, bool _winnerGetLoot) public {
        require(startTime == 0, "ALREADY_INITIALISED");
        _loot = loot;
        winnerGetLoot = _winnerGetLoot;
        startTime = block.timestamp;
    }

    function clone(ILoot loot, bool _winnerGetLoot) external returns (address) {
        address yooloot = Clones.clone(address(this));
        YooLoot(yooloot).init(loot, _winnerGetLoot);
        return yooloot;
    }

    function commitLootDeck(uint256 lootId, bytes32 deckHash) external {
        require(block.timestamp - startTime < 1 weeks, "JOINING_PERIOD_OVER");
        require(deckHash != 0x0000000000000000000000000000000000000000000000000000000000000001, "INVALID HASH");
        _deckHashes[lootId] = deckHash;
        _deposits[lootId] = msg.sender;
        _loot.transferFrom(msg.sender, address(this), lootId);
        emit LootDeckSubmitted(msg.sender, lootId, deckHash);
    }

    function revealLootDeck(
        uint256 lootId,
        uint8[8] calldata deck,
        bytes32 secret
    ) external {
        require(block.timestamp - startTime > 1 weeks, "REVEAL_PERIOD_NOT_STARTED");
        require(block.timestamp - startTime < 2 weeks, "REVEAL_PERIOD_OVER");
        bytes32 deckHash = _deckHashes[lootId];
        require(deckHash != 0x0000000000000000000000000000000000000000000000000000000000000001, "ALREADY_REVEALED");
        require(keccak256(abi.encodePacked(secret, lootId, deck)) == deckHash, "INVALID_SECRET'");
        _deckHashes[lootId] = 0x0000000000000000000000000000000000000000000000000000000000000001;
        uint8[8] memory indicesUsed;
        for (uint8 i = 0; i < 8; i++) {
            uint8 index = deck[i];
            indicesUsed[index]++;
            uint8 lootItemGreatness = pluckGreatness(lootId, index);
            uint256 current = _rounds[i][lootItemGreatness];
            if (current == 0) {
                _rounds[i][lootItemGreatness] = lootId;
            } else if (current != 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) {
                _rounds[i][lootItemGreatness] = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
            }
        }
        for (uint8 i = 0; i < 8; i++) {
            require(indicesUsed[i] == 1, "INVALID_DECK");
        }
        emit LootDeckRevealed(lootId, deck);
    }

    // solhint-disable-next-line code-complexity
    function winner() public view returns (address) {
        require(block.timestamp - startTime > 2 weeks, "REVEAL_PERIOD_NOT_OVER");
        uint256[8] memory winners;
        for (uint8 i = 0; i < 8; i++) {
            for (uint8 j = 0; j < 20; j++) {
                uint256 lootId = _rounds[i][j];
                if (lootId > 0 && lootId != 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) {
                    winners[i] = lootId;
                    break;
                }
            }
        }

        uint256 theWinner;
        uint256 score;
        for (uint8 i = 0; i < 8; i++) {
            uint8 value = 0;
            uint8 tmpScore;
            for (uint8 j = 0; j < 8; j++) {
                if (winners[j] == 0) {
                    value += j;
                } else if (winners[j] == winners[i]) {
                    tmpScore = value + j;
                    value = 0;
                }
            }
            if (tmpScore >= score) {
                // give more power to player who win later rounds
                theWinner = winners[i];
            }
        }
        return _deposits[theWinner];
    }

    function claimVictoryLoot(uint256 lootToPick) external {
        require(winnerGetLoot, "NO_LOOT_TO_WIN");
        require(block.timestamp - startTime < 3 weeks, "VICTORY_PERIOD_OVER");
        require(winner() == msg.sender, "NOT_WINNER");
        require(_deposits[lootToPick] != msg.sender, "ALREADY_OWNER");
        _loot.transferFrom(address(this), msg.sender, lootToPick);
        startTime = 1;
    }

    function claimVictoryERC20(IERC20 token) external {
        require(address(token) != address(_loot), "INVALID_ERC20");
        require(winner() == msg.sender, "NOT_WINNER");
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    function withdraw(uint256 loot) external {
        require(winnerGetLoot && block.timestamp - startTime > 3 weeks, "VICTORY_WITHDRAWL_NOT_OVER");
        require(_deposits[loot] == msg.sender, "NOT_OWNER");
        require(
            _deckHashes[loot] == 0x0000000000000000000000000000000000000000000000000000000000000001,
            "DID_NOT_REVEAL"
        );
        _loot.transferFrom(address(this), msg.sender, loot);
    }

    // -----------------------------------------------------------

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
