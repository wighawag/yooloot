import {
  LootDeckSubmitted,
  LootDeckCanceled,
  LootDeckRevealed,
  WinnerWithdrawal,
  LootWithdrawn,
  Cloned,
  NewGame,
} from '../generated/YooLoot/YooLootContract';
import {YooLootGame, LootSubmitted, Player} from '../generated/schema';
import {store} from '@graphprotocol/graph-ts';

export function handleLootDeckSubmitted(event: LootDeckSubmitted): void {
  let playerID = event.params.player.toHexString();
  let player = Player.load(playerID);
  if (!player) {
    player = new Player(playerID);
    player.save();
  }

  let lootID = event.params.lootId.toString();
  let loot = LootSubmitted.load(lootID);
  if (!loot) {
    loot = new LootSubmitted(lootID);
  }
  loot.deckHash = event.params.deckHash;
  loot.game = event.address.toHexString();
  loot.player = playerID;

  loot.save();
}

export function handleDeckCanceled(event: LootDeckCanceled): void {
  let lootID = event.params.lootId.toString();
  store.remove('LootSubmitted', lootID);
}

export function handleLootDeckRevealed(event: LootDeckRevealed): void {
  let lootID = event.params.lootId.toString();
  let loot = LootSubmitted.load(lootID);
  loot.deck = event.params.deck;
  loot.save();
}

export function handleWinnerWithdrawal(event: WinnerWithdrawal): void {}

export function handleLootWithdrawn(event: LootWithdrawn): void {}

export function handleNewGame(event: NewGame): void {}

export function handleCloned(event: Cloned): void {}
