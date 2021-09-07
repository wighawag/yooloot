import {wallet, flow} from './wallet';
import {BaseStoreWithData} from '$lib/utils/stores';
import {keccak256} from '@ethersproject/solidity';
import type { NFT } from './originalloot';

type Data = {
  loot: NFT;
  deck?: [number, number, number, number, number, number, number, number]
};
export type CommitFlow = {
  step:
    | 'IDLE'
    | 'CONNECTING'
    | 'CHOOSE_DECK'
    | 'CONFIRM'
    | 'CREATING_TX'
    | 'WAITING_TX'
    | 'SUCCESS';
  data?: Data;
};

class PurchaseFlowStore extends BaseStoreWithData<CommitFlow, Data> {
  public constructor() {
    super({
      step: 'IDLE',
    });
  }

  async cancel(): Promise<void> {
    this._reset();
  }

  async acknownledgeSuccess(): Promise<void> {
    // TODO automatic ?
    this._reset();
  }

  async chooseLoot(loot: NFT): Promise<void> {
    this.setPartial({step: 'CONNECTING'});
    flow.execute(async (contracts) => {
      this.setPartial({
        data: {loot},
        step: 'CHOOSE_DECK',
      });
    });
  }

  async chooseDeck(deck: [number, number, number, number, number, number, number, number]): Promise<void> {
    this.setPartial({step: 'CONNECTING'});
    this.setPartial({
      data: {...this.$store.data, deck},
      step: 'CONFIRM',
    });
  }

  async confirm(): Promise<void> {
    const currentFlow = this.setPartial({step: 'WAITING_TX'});
    if (!currentFlow.data) {
      throw new Error(`no flow data`);
    }
    flow.execute(async (contracts) => {
      if (!currentFlow.data) {
        throw new Error(`no flow data`);
      }

      const tokenID = currentFlow.data.loot.id;

      const isApproved = await contracts.Loot.isApprovedForAll(wallet.address, contracts.YooLoot.address);
      if (!isApproved) {
        await contracts.Loot.setApprovalForAll(contracts.YooLoot.address, true);
      }

      // TODO
      const secret = "0x1111111111111111111111111111111111111111111111111111111111111111";
      const deckHash = keccak256(
        ['bytes32', 'uint256', 'uint8[8]'],
        [secret, tokenID, currentFlow.data.deck]
      );

      await contracts.YooLoot.commitLootDeck(tokenID, deckHash);

      this.setPartial({step: 'SUCCESS'});
    });
  }

  private _reset() {
    this.setPartial({step: 'IDLE', data: undefined});
  }
}

export default new PurchaseFlowStore();
