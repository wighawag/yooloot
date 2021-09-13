import {
  LootDeckSubmitted,
  LootDeckCanceled,
  LootDeckRevealed,
  WinnerWithdrawal,
  LootWithdrawn,
  NewGame,
  YooLootContract
} from '../generated/FirstYooLoot/YooLootContract';
import {YooLootGame, LootSubmitted, Player} from '../generated/schema';
import {store, BigInt} from '@graphprotocol/graph-ts';

export function handleLootDeckSubmitted(event: LootDeckSubmitted): void {
  let game = YooLootGame.load(event.address.toHexString());
  game.numLoots = game.numLoots.plus(BigInt.fromI32(1));
  game.save();

  let playerID = event.params.player.toHexString();
  let player = Player.load(playerID);
  if (!player) {
    player = new Player(playerID);
    player.game = event.address.toHexString();
    player.save();
  }

  let lootID = event.params.lootId.toString();
  let loot = LootSubmitted.load(lootID);
  if (!loot) {
    loot = new LootSubmitted(lootID);
    loot.withdrawn = false;
    loot.takenByWinner = false;
  }
  loot.deckHash = event.params.deckHash;

  // let yoolootContract = YooLootContract.bind(event.address);
  // loot.defaultDeckPower = yoolootContract.getDeckPower(event.params.lootId, [1,2,3,4,5,6,7,8], false); // TODO LootForEveryone

  loot.game = event.address.toHexString();
  loot.player = playerID;

  loot.transactionHash = event.transaction.hash;
  // loot.nonce = event.transaction.from

  loot.save();
}

export function handleDeckCanceled(event: LootDeckCanceled): void {
  let game = YooLootGame.load(event.address.toHexString());
  game.numLoots = game.numLoots.minus(BigInt.fromI32(1));
  game.save();

  let lootID = event.params.lootId.toString();
  store.remove('LootSubmitted', lootID);

}

export function handleLootDeckRevealed(event: LootDeckRevealed): void {

  let yoolootContract = YooLootContract.bind(event.address);

  let lootID = event.params.lootId.toString();
  let loot = LootSubmitted.load(lootID);
  loot.deck = event.params.deck;
  // loot.deckPower = yoolootContract.getDeckPower(event.params.lootId, event.params.deck, false); // TODO LootForEveryone
  loot.save();


  for (let i = 0; i < 8; i++) {
    // let roundID = event.address.toHexString() + ':' + i.toString();
    // let round = Round.load(roundID);
    // if (!round) {
    //   round = new Round(roundID);
    // }
    // round.

  }
}

export function handleWinnerWithdrawal(event: WinnerWithdrawal): void {
  let lootID = event.params.lootId.toString();
  let loot = LootSubmitted.load(lootID);
  loot.withdrawn = true;
  loot.takenByWinner = true;
  loot.save();
}

export function handleLootWithdrawn(event: LootWithdrawn): void {
  let lootID = event.params.lootId.toString();
  let loot = LootSubmitted.load(lootID);
  loot.withdrawn = true;
  loot.save();
}

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
  game.numLoots = BigInt.fromI32(0);
  game.save();
}
