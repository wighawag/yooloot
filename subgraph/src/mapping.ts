import {
  LootDeckSubmitted,
  LootDeckCanceled,
  LootDeckRevealed,
  WinnerWithdrawal,
  LootWithdrawn,
  NewGame,
} from '../generated/FirstYooLoot/YooLootContract';
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

  // loot.nonce = event.transaction.from

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

export function handleNewGame(event: NewGame): void {
  let game = YooLootGame.load(event.address.toHexString());
  if (!game) {
    game = new YooLootGame(event.address.toHexString());
  }
  game.lootContract = event.params.loot;
  game.winnerGetLoot = event.params.winnerGetLoot;
  game.startTime = event.block.timestamp;
  game.commit3HPeriod = event.params.commit3HPeriod;
  game.reveal3HPeriod = event.params.reveal3HPeriod;
  game.winner3HPeriod = event.params.winner3HPeriod;
  game.save();
}
