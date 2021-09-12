import {Cloned, NewGame} from '../generated/templates/YooLoot/YooLootContract';
import {YooLoot} from '../generated/templates';
import {YooLootGame} from '../generated/schema';

export function handleNewGame(event: NewGame): void {
  let game = new YooLootGame(event.address.toHexString());

  // is that neceary or template can replay it?
  game.lootContract = event.params.loot;
  game.winnerGetLoot = event.params.winnerGetLoot;
  game.startTime = event.block.timestamp;
  game.commit3HPeriod = event.params.commit3HPeriod;
  game.reveal3HPeriod = event.params.reveal3HPeriod;
  game.winner3HPeriod = event.params.winner3HPeriod;
  game.save();
  YooLoot.create(event.address);
}

export function handleCloned(event: Cloned): void {
  YooLoot.create(event.params.newYooLoot);
}
