import {wallet, flow, chain} from './wallet';
import {BaseStore} from '$lib/utils/stores';
import type { ChainStore, WalletStore } from 'web3w';
import { now, time } from './time';
import { YooLootContract } from '$lib/config';

const week = 7 * 24 * 60 * 60;

export type GameState = {
  phase: 'IDLE' | 'LOADING' | 'COMMIT' | 'REVEAL' | 'WINNER' | 'WITHDRAW';
  startTime?: number;
  commitPeriodEnd?: number;
  revealPeriodEnd?: number;
  winnerPeriodEnd?: number;
  timeLeftBeforeNextPhase?: number;
  winner?: string;
  winnerLoot?: string;
};

class GameStateStore extends BaseStore<GameState> {

  private timeout: NodeJS.Timeout | undefined;

  public constructor() {
    super({
      phase: 'IDLE'
    });
    wallet.subscribe(this.onWallet.bind(this));
    chain.subscribe(this.onChain.bind(this));
    time.subscribe(this.everySecond.bind(this));
  }

  onWallet($wallet: WalletStore) {
    if (wallet.provider && wallet.contracts) {
      this.start()
    } else {
      this.stop();
    }
  }

  onChain($chain: ChainStore) {
    if (wallet.provider && wallet.contracts) {
      this.start()
    } else {
      this.stop();
    }
  }

  everySecond() {
    const currentTime = now();
    if (this.$store.winnerPeriodEnd) {
      if (currentTime > this.$store.winnerPeriodEnd) {
      } else if (currentTime > this.$store.revealPeriodEnd) {
        if (this.$store.winner === "0x0000000000000000000000000000000000000000") {
          this.setPartial({timeLeftBeforeNextPhase: 0, phase: 'WITHDRAW'});
        } else {
          this.setPartial({timeLeftBeforeNextPhase: this.$store.winnerPeriodEnd - currentTime, phase: 'WINNER'});
        }
      } else if (currentTime > this.$store.commitPeriodEnd) {
        this.setPartial({timeLeftBeforeNextPhase: this.$store.revealPeriodEnd - currentTime})
      } else {
        this.setPartial({timeLeftBeforeNextPhase: this.$store.commitPeriodEnd - currentTime})
      }
    }

  }

  start() {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    this.update();
  }

  async update() {

    if (wallet.provider) {
      if (!this.$store.startTime) {

        const params = await wallet.contracts[YooLootContract].callStatic.parameters();
        const {startTime, commit3HPeriod, reveal3HPeriod, winner3HPeriod} = params;
        // console.log({startTime, commit3HPeriod, reveal3HPeriod, winner3HPeriod})
        const commitPeriodEnd = startTime + commit3HPeriod * 3 * 3600;
        const revealPeriodEnd = commitPeriodEnd + reveal3HPeriod * 3 * 3600;
        const winnerPeriodEnd = revealPeriodEnd + winner3HPeriod * 3 * 3600;
        // console.log({startTime, commitPeriodEnd, revealPeriodEnd, winnerPeriodEnd})
        this.setPartial({startTime, commitPeriodEnd, revealPeriodEnd, winnerPeriodEnd});
      }

      // if (!this.$store.winner) {
      //   const winnerInfo = await wallet.contracts[YooLootContract].winner();
      //   this.setPartial({winner: winnerInfo.winnerAddress});
      // }

      const currentTime = now();
      // const timePassed = currentTime - this.$store.startTime;
      if (currentTime > this.$store.winnerPeriodEnd) {
        console.log('winner period ended');
        this.setPartial({timeLeftBeforeNextPhase: 0, phase: 'WITHDRAW'})
        if (!this.$store.winner) {
          const winnerInfo = await wallet.contracts[YooLootContract].winner();
          this.setPartial({winner: winnerInfo.winnerAddress, winnerLoot: winnerInfo.winnerLootId});
        }
      } else if (currentTime > this.$store.revealPeriodEnd) {
        console.log('reveal period ended');
        if (!this.$store.winner) {
          const winnerInfo = await wallet.contracts[YooLootContract].winner();
          this.setPartial({winner: winnerInfo.winnerAddress, winnerLoot: winnerInfo.winnerLootId});
        }
        if (this.$store.winner === "0x0000000000000000000000000000000000000000") {
          this.setPartial({timeLeftBeforeNextPhase: 0, phase: 'WITHDRAW'});
        } else {
          this.setPartial({timeLeftBeforeNextPhase: this.$store.winnerPeriodEnd - currentTime, phase: 'WINNER'});
        }
      } else if (currentTime > this.$store.commitPeriodEnd) {
        console.log('commit period ended');
        this.setPartial({timeLeftBeforeNextPhase: this.$store.revealPeriodEnd - currentTime, phase: 'REVEAL'})
      } else {
        console.log('commit...');
        this.setPartial({timeLeftBeforeNextPhase: this.$store.commitPeriodEnd - currentTime, phase: 'COMMIT'})
      }
    }


    this.timeout = setTimeout(this.update.bind(this), 1000);
  }

  stop() {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    this.setPartial({phase: 'IDLE'});
  }


}

const gameState = new GameStateStore();

export default gameState;

if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as unknown as any).gameState = gameState;
}
