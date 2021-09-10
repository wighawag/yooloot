// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.7;

interface ILootXP{
    function xp(uint256 lootId) external returns (uint256);

    function xpSource(address source) external returns (bool);

    function xpSink(address sink) external returns (bool);

    function generator(address generator) external returns (bool);

    function addXP(uint256 lootId, uint256 amount) external returns (bool);

    function removeXP(uint256 lootId, uint256 amount) external returns (bool);

    function setSource(address source, bool add) external;

    function setSink(address sink, bool add) external;

    function setGenerator(address generator, bool add) external;
}
