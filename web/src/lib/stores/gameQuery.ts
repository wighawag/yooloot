import type {Invalidator, Subscriber, Unsubscriber} from 'web3w/dist/esm/utils/internals';
import {SUBGRAPH_ENDPOINT} from '$lib/blockchain/subgraph';
import type {QueryState, QueryStore, QueryStoreWithRuntimeVariables} from '$lib/utils/stores/graphql';
import {HookedQueryStore} from '$lib/utils/stores/graphql';
import type {EndPoint} from '$lib/utils/graphql/endpoint';
import {chainTempo} from '$lib/blockchain/chainTempo';
import type {Readable, Writable} from 'svelte/store';
import {derived, writable} from 'svelte/store';
import { chain, wallet } from './wallet';
import type { ChainData, WalletData } from 'web3w';
import { YooLootContract } from '$lib/config';

export type GameQueryResult = {
  lootSubmitteds: {
    id: string;
    player: {id: string};
    deckHash: string;
    deck?: number[];
    withdrawn: boolean;
    takenByWinner: boolean;
    transactionHash: string;
  }[];
  yooLootGame: {
    numLoots: string;
  }
}

export type GameState = {
  result: GameQueryResult;
  loading?: boolean;
  currentPlayer: string;
}

// TODO fleetArrivedEvents need to be capped from 7 days / latest acknowledged block number
export class GameQueryStore implements QueryStore<GameState> {
  private queryStore: QueryStoreWithRuntimeVariables<GameQueryResult>;
  private store: Writable<QueryState<GameState>>;
  private unsubscribeFromQuery: () => void | undefined;
  private stopAccountSubscription: (() => void) | undefined = undefined;
  private stopChainSubscription: (() => void) | undefined = undefined;

  /*
`query($first: Int! $lastId: ID! $blockNumber: Int $owner: String) {
  planets(first: $first where: {id_gt: $lastId} ?$blockNumber?block: {number:$blockNumber}?) {
  */
  constructor(endpoint: EndPoint) {
    this.queryStore = new HookedQueryStore( // TODO full list
      endpoint,
      `query($first: Int! $lastId: ID! $yoolootContractAddress: String!) {
        lootSubmitteds(first: $first where: {id_gt: $lastId game: $yoolootContractAddress}) {
          id
          player {id}
          deckHash
          deck
          withdrawn
          takenByWinner
          transactionHash
        }
        yooLootGame(id: $yoolootContractAddress) {
          numLoots
        }
      }`,
      chainTempo, // replayTempo, //
      {
        list: {path: 'lootSubmitteds'},
      }
    );

    this.store = writable({step: 'IDLE'}, this.start.bind(this));
    this.start();
  }

  protected start(): () => void {
    this.stopAccountSubscription = wallet.subscribe(async ($wallet) => {
      await this._handleAccountChange($wallet);
    });
    this.stopChainSubscription = chain.subscribe(async ($chain) => {
      await this._handleChainChange($chain);
    });
    this.unsubscribeFromQuery = this.queryStore.subscribe(this.update.bind(this));
    return this.stop.bind(this);
  }

  protected stop(): void {
    if (this.stopAccountSubscription) {
      this.stopAccountSubscription();
      this.stopAccountSubscription = undefined;
    }
    if (this.unsubscribeFromQuery) {
      this.unsubscribeFromQuery();
      this.unsubscribeFromQuery = undefined;
    }
    if (this.stopChainSubscription) {
      this.stopChainSubscription();
      this.stopChainSubscription = undefined;
    }
  }

  private async _handleAccountChange($account: WalletData): Promise<void> {
    const accountAddress = $account.address?.toLowerCase();
    this.queryStore.runtimeVariables.yoolootContractAddress = wallet.contracts && wallet.contracts[YooLootContract].address;
    if (this.queryStore.runtimeVariables.owner !== accountAddress) {
      this.queryStore.runtimeVariables.owner = accountAddress;
      this.store.update((v) => {
        if (v.data) {
          v.data.loading = true;
        }
        return v;
      });
      this.queryStore.fetch({blockNumber: chainTempo.chainInfo.lastBlockNumber});
    }
    // TODO
    // delete other account data in sync
    // by the way, planet can be considered loading if the blockHash their state is taken from is different than latest query blockHash
    // this means we have to keep track of each planet query's blockHash
    // then a global loading flag could be set based on whether there is at least one planet loading, or account changed
  }

  private async _handleChainChange($chain: ChainData): Promise<void> {
    const contractAddress = wallet.contracts && wallet.contracts[YooLootContract].address?.toLowerCase();
    if (this.queryStore.runtimeVariables.yoolootContractAddress !== contractAddress) {
      console.log({contractAddress})
      this.queryStore.runtimeVariables.yoolootContractAddress = contractAddress;
      this.store.update((v) => {
        if (v.data) {
          v.data.loading = true;
        }
        return v;
      });
      this.queryStore.fetch({blockNumber: chainTempo.chainInfo.lastBlockNumber});
    }

  }

  _transform(data?: GameQueryResult): GameState | undefined {
    if (!data) {
      return undefined;
    }
    return {
      loading: false,
      result: data,
      currentPlayer: this.queryStore.runtimeVariables.owner
    };
  }

  private async update($query: QueryState<GameQueryResult>): Promise<void> {
    const transformed = {
      step: $query.step,
      error: $query.error,
      data: this._transform($query.data),
    };
    this.store.set(transformed);
  }

  acknowledgeError(): void {
    return this.queryStore.acknowledgeError();
  }

  subscribe(
    run: Subscriber<QueryState<GameState>>,
    invalidate?: Invalidator<QueryState<GameState>> | undefined
  ): Unsubscriber {
    return this.store.subscribe(run, invalidate);
  }
}

export const gameQuery = new GameQueryStore(SUBGRAPH_ENDPOINT);


export const toReveal: Readable<QueryState<GameState>>  = derived([gameQuery], ([gameState]) => {
  return {
    step: gameState.step,
    data: gameState.data && gameState.data.result ? {
      result: {
        lootSubmitteds: gameState.data.result.lootSubmitteds.filter((v) =>v.player.id === gameState.data.currentPlayer.toLowerCase()),
        yooLootGame: {
          numLoots: gameState.data.result.yooLootGame?.numLoots || "0",
        }
      },
      loading: gameState.data.loading,
      currentPlayer: gameState.data.currentPlayer
    }: undefined,
    error: gameState.error
  }
})

export const toWithdraw: Readable<QueryState<GameState>>  = derived([gameQuery], ([gameState]) => {
  return {
    step: gameState.step,
    data: gameState.data && gameState.data.result ? {
      result: {
        lootSubmitteds: gameState.data.result.lootSubmitteds.filter((v) => v.deck && !v.withdrawn  && v.player.id === gameState.data.currentPlayer.toLowerCase()),
        yooLootGame: {
          numLoots: gameState.data.result.yooLootGame?.numLoots || "0",
        }
      },
      loading: gameState.data.loading,
      currentPlayer: gameState.data.currentPlayer
    }: undefined,
    error: gameState.error
  }
})


export const toUpdate: Readable<QueryState<GameState>>  = derived([gameQuery], ([gameState]) => {
  return {
    step: gameState.step,
    data: gameState.data && gameState.data.result ? {
      result: {
        lootSubmitteds: gameState.data.result.lootSubmitteds.filter((v) => !v.deck && !v.withdrawn  && v.player.id === gameState.data.currentPlayer.toLowerCase()),
        yooLootGame: {
          numLoots: gameState.data.result.yooLootGame?.numLoots || "0",
        }
      },
      loading: gameState.data.loading,
      currentPlayer: gameState.data.currentPlayer
    }: undefined,
    error: gameState.error
  }
})


export const toWinner: Readable<QueryState<GameState>>  = derived([gameQuery], ([gameState]) => {
  return {
    step: gameState.step,
    data: gameState.data && gameState.data.result ? {
      result: {
        lootSubmitteds: gameState.data.result.lootSubmitteds.filter((v) => v.deck && !v.withdrawn  && v.player.id !== gameState.data.currentPlayer.toLowerCase()),
        yooLootGame: {
          numLoots: gameState.data.result.yooLootGame?.numLoots || "0",
        }
      },
      loading: gameState.data.loading,
      currentPlayer: gameState.data.currentPlayer
    }: undefined,
    error: gameState.error
  }
})
