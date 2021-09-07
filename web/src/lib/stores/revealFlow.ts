import {wallet, flow} from './wallet';
import {BaseStoreWithData} from '$lib/utils/stores';
import {keccak256} from '@ethersproject/solidity';
import type { Deck } from './originalloot';

type Data = {
  lootId: string;
  deck?: Deck
};
export type RevealFlow = {
  step:
  | 'IDLE'
  | 'CONNECTING'
  | 'WAITING_FOR_SIGNATURE'
  | 'CREATING_TX'
  | 'WAITING_TX'
  | 'WAITING_FOR_ACKNOWLEDGMENT'
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


  async revealLootDeck(lootId: string, deck: Deck, nonce: number): Promise<void> {
    this.setPartial({step: 'CONNECTING'});
    flow.execute(async (contracts) => {
      this.setPartial({step: 'WAITING_FOR_SIGNATURE'});
      const signature = await wallet.provider
      .getSigner()
      .signMessage(`Generate Yoolot Secret number : ${nonce}`);
      const secret = signature.slice(0, 66);

      this.setPartial({step: 'WAITING_TX'});
      await contracts.YooLoot.revealLootDeck(lootId, deck, secret);
      this.setPartial({step: 'WAITING_FOR_ACKNOWLEDGMENT'});
    });
  }



  private _reset() {
    this.setPartial({step: 'IDLE', data: undefined});
  }
}

export default new PurchaseFlowStore();
