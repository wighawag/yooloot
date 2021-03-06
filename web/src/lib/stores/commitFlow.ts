import {wallet, flow, chain} from './wallet';
import {nftsof} from '$lib/stores/originalloot'
import {BaseStoreWithData} from '$lib/utils/stores';
import {keccak256} from '@ethersproject/solidity';
import type { Deck, NFT } from './originalloot';
import { commits } from './commits';
import { LootContract, YooLootContract } from '$lib/config';

type Data = {
  loot: NFT;
  deck?: Deck;
  nonce?: number;
  replace?: string;
};
export type CommitFlow = {
  step:
    | 'IDLE'
    | 'CONNECTING'
    | 'CHOOSE_DECK'
    | 'NEED_CONFIRMATION'
    | 'FETCHING_DATA'
    | 'APPROVAL_TX'
    | 'WAITING_FOR_SIGNATURE'
    | 'CREATING_TX'
    | 'WAITING_TX'
    | 'WAITING_FOR_ACKNOWLEDGMENT'
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

  async chooseLootIdToUpdate(id: string): Promise<void> {
    this.setPartial({step: 'CONNECTING'});
    const loot = await nftsof(wallet.address).getTokenInfo(id);
    flow.execute(async (contracts) => {
      this.setPartial({
        data: {loot, replace: id},
        step: 'CHOOSE_DECK',
      });
    });
  }

  async chooseLootToReplace(id: string, loot: NFT): Promise<void> {
    this.setPartial({step: 'CONNECTING'});
    flow.execute(async (contracts) => {
      this.setPartial({
        data: {loot, replace: id},
        step: 'CHOOSE_DECK',
      });
    });
  }

  async chooseLoot(loot: NFT): Promise<void> {
    this.setPartial({step: 'CONNECTING'});
    flow.execute(async (contracts) => {
      this.setPartial({
        data: {loot, replace: undefined},
        step: 'CHOOSE_DECK',
      });
    });
  }

  async chooseDeck(deck: Deck): Promise<void> {
    this.setPartial({step: 'CONNECTING'});
    this.setPartial({
      data: {...this.$store.data, deck},
      step: 'NEED_CONFIRMATION',
    });
  }

  async confirm(): Promise<void> {
    const currentFlow = this.setPartial({step: 'CONNECTING'});


    if (!currentFlow.data) {
      throw new Error(`no flow data`);
    }
    flow.execute(async (contracts) => {
      const currentFlow = this.setPartial({step: 'FETCHING_DATA'});
      if (!currentFlow.data) {
        throw new Error(`no flow data`);
      }
      const tokenID = currentFlow.data.loot.id;

      const noNeedForTransfer = currentFlow.data.replace === tokenID;
      // TODO check if replace is actually there

      const isApproved = await contracts.Loot.isApprovedForAll(wallet.address, contracts[YooLootContract].address);
      let currentNonce = await wallet.provider.getTransactionCount(wallet.address);

      if (!noNeedForTransfer && !isApproved) {
        this.setPartial({step: 'APPROVAL_TX'});
        const tx = await contracts[LootContract].setApprovalForAll(contracts[YooLootContract].address, true, {nonce: currentNonce});
        await tx.wait();
        currentNonce ++;
      }

      this.setPartial({step: 'WAITING_FOR_SIGNATURE'});
      const signature = await wallet.provider
      .getSigner()
      .signMessage(`Generate Yoolot Secret number : ${currentNonce}`);
      const secret = signature.slice(0, 66);

      const deckHash = keccak256(
        ['bytes32', 'uint256', 'uint8[8]'],
        [secret, tokenID, currentFlow.data.deck]
      );

      this.setPartial({step: 'WAITING_TX'});
      if (currentFlow.data.replace) {
        await contracts[YooLootContract].changeDeck(currentFlow.data.replace, tokenID, deckHash, {nonce: currentNonce});
      } else {
        await contracts[YooLootContract].commitLootDeck(tokenID, deckHash, {nonce: currentNonce});
      }


      this.setData({nonce: currentNonce});

      commits(wallet.address, wallet.chain.chainId, contracts[YooLootContract].address).update((data) => {
        data.commits.push({deck: currentFlow.data.deck, nonce: currentNonce, lootId: tokenID})
        return data;
      });

      this.setPartial({step: 'WAITING_FOR_ACKNOWLEDGMENT'});
    });
  }

  async acknowledgeSuccess(): Promise<void> {
    this.setPartial({step: 'SUCCESS'});
  }

  private _reset() {
    this.setPartial({step: 'IDLE', data: undefined});
  }
}

export default new PurchaseFlowStore();
