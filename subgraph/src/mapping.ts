import {LootDeckSubmitted} from '../generated/YooLoot/YooLootContract';
import {MessageEntry} from '../generated/schema';
export function handleLootDeckSubmitted(event: LootDeckSubmitted): void {
  let id = event.params.lootId.toString();
  let entity = MessageEntry.load(id);
  if (!entity) {
    entity = new MessageEntry(id);
  }
  entity.message = event.params.deckHash.toHexString();
  entity.timestamp = event.block.timestamp;
  entity.save();
}
