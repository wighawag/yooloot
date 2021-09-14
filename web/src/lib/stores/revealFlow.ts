import {wallet, flow} from './wallet';
import {BaseStoreWithData} from '$lib/utils/stores';
import {keccak256} from '@ethersproject/solidity';
import type { Deck } from './originalloot';
import { YooLootContract } from '$lib/config';

type Data = {
  lootId: string;
  deck: Deck
  nonce: number;
};
export type RevealFlow = {
  step:
  | 'IDLE'
  | 'CONNECTING'
  | 'GETTING_DATA'
  | 'NO_DECK_FOR_LOOT'
  | 'ALREADY_RESOLVED'
  | 'WAITING_FOR_SIGNATURE'
  | 'BRUTE_FORCING'
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


  async revealLootDeck(lootId: string, deck: Deck, nonce?: number, transactionHash?: string, bruteForce?: boolean): Promise<void> {
    this.setPartial({step: 'CONNECTING'});
    this.setData({lootId, deck, nonce})
    flow.execute(async (contracts) => {
      this.setPartial({step: 'GETTING_DATA'});

      if (!nonce) {
        const tx = await wallet.provider.getTransaction(transactionHash);
        nonce = tx.nonce;
        console.log({tx});
      }

      const deckHash = await contracts[YooLootContract].deckHashes(lootId);
      if (deckHash === '0x0000000000000000000000000000000000000000000000000000000000000001') {
        this.setPartial({step: 'ALREADY_RESOLVED'});
        return;
      } else if (deckHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        this.setPartial({step: 'NO_DECK_FOR_LOOT'});
        return;
      }
      this.setPartial({step: 'WAITING_FOR_SIGNATURE'});
      const signature = await wallet.provider
      .getSigner()
      .signMessage(`Generate Yoolot Secret number : ${nonce}`);
      const secret = signature.slice(0, 66);

      if (bruteForce) {
        this.setPartial({step: 'BRUTE_FORCING'});
        let found = false;
        for (let i8 = 8; i8 > 0; i8--) {
          for (let i7 = 8; i7 > 0; i7--) {
            if (i7 == i8) {continue};
            for (let i6 = 8; i6 > 0; i6--) {
              if (i6 == i8 || i6 == i7) {continue};
              for (let i5 = 8; i5 > 0; i5--) {
                if (i5 == i8 || i5 == i7 || i5 == i6) {continue};
                for (let i4 = 8; i4 > 0; i4--) {
                  if (i4 == i8 || i4 == i7 || i4 == i6 || i4 == i5) {continue};
                  for (let i3 = 8; i3 > 0; i3--) {
                    if (i3 == i8 || i3 == i7 || i3 == i6 || i3 == i5 || i3 == i4) {continue};
                    for (let i2 = 8; i2 > 0; i2--) {
                      if (i2 == i8 || i2 == i7 || i2 == i6 || i2 == i5 || i2 == i4 || i2 == i3) {continue};
                      for (let i1 = 8; i1 > 0; i1--) {
                        if (i1 == i8 || i1 == i7 || i1 == i6 || i1 == i5 || i1 == i4 || i1 == i3 || i1 == i2) {continue};
                        const bruteDeck: Deck = [i8,i7,i6,i5,i4,i3,i2,i1];
                        const bruteDeckHash = keccak256(
                          ['bytes32', 'uint256', 'uint8[8]'],
                          [secret, lootId, bruteDeck]
                        );
                        if (bruteDeckHash == deckHash) {
                          deck = bruteDeck
                          console.log('FOUND: ', deck)
                          found = true;
                          break;
                        }
                      }
                      if (found) {
                        break;
                      }
                    }
                    if (found) {
                      break;
                    }
                  }
                  if (found) {
                    break;
                  }
                }
                if (found) {
                  break;
                }
              }
              if (found) {
                break;
              }
            }
            if (found) {
              break;
            }
          }
          if (found) {
            break;
          }
        }
      }

      this.setPartial({step: 'WAITING_TX'});
      await contracts[YooLootContract].revealLootDeck(lootId, deck, secret);
      this.setPartial({step: 'WAITING_FOR_ACKNOWLEDGMENT'});
    });
  }



  private _reset() {
    this.setPartial({step: 'IDLE', data: undefined});
  }
}

export default new PurchaseFlowStore();
