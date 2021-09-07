import {wallet, flow} from './wallet';
import {BaseStoreWithData} from '$lib/utils/stores';
import {keccak256} from '@ethersproject/solidity';

type Data = {
  lootId: string;
  deck?: [number, number, number, number, number, number, number, number]
};
export type RevealFlow = {
  step:
    | 'IDLE'
    | 'CONNECTING'
    | 'WAITING_FOR_SIGNATURE'
    | 'WAITING_TX'
    | 'SUCCESS';
  data?: Data;
};

class PurchaseFlowStore extends BaseStoreWithData<RevealFlow, Data> {
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


  async revealLootDeck(lootId: string, deck: [number, number, number, number, number, number, number, number], secret: string): Promise<void> {
    this.setPartial({step: 'CONNECTING'});
    flow.execute(async (contracts) => {
      this.setPartial({step: 'WAITING_TX'});
      await contracts.YooLoot.revealLootDeck(lootId, deck, secret);
      this.setPartial({step: 'SUCCESS'});
    });
  }



  private _reset() {
    this.setPartial({step: 'IDLE', data: undefined});
  }
}

export default new PurchaseFlowStore();
