<script lang="ts">
  import WalletAccess from '$lib/WalletAccess.svelte';
  import revealFlow from '$lib/stores/revealFlow';
  import gamestate from '$lib/stores/gamestate';
  import {allToReveal, toReveal} from '$lib/stores/gameQuery';
  import { url } from '$lib/utils/url';
  import Modal from '$lib/components/Modal.svelte';
  import { timeToText } from '$lib/utils';
  import { chain, flow, wallet } from '$lib/stores/wallet';


  let deckString1 = 8;
  let deckString2 = 7;
  let deckString3 = 6;
  let deckString4 = 5;
  let deckString5 = 4;
  let deckString6 = 3;
  let deckString7 = 2;
  let deckString8 = 1;


  let lootId: string;
  let nonceString: string;

  function reveal(bruteForce?: boolean) {
    const deck = [deckString1, deckString2, deckString3, deckString4, deckString5, deckString6, deckString7, deckString8];
    // const deck = [parseInt(deckString1), parseInt(deckString2), parseInt(deckString3), parseInt(deckString4), parseInt(deckString5), parseInt(deckString6), parseInt(deckString7), parseInt(deckString8)];
    if (deck.length !== 8) {
      throw new Error(`invalid deck: length:${deck.length}, need to be 8`);
    }
    let checks = [0,0,0,0,0,0,0,0];
    for (let i = 0; i < deck.length; i++) {
      const elem = deck[i];
      if (isNaN(elem)) {
        throw new Error(`invalid deck: not all element are numbers`);
      }
      checks[elem-1] ++;
    }
    for (const check of checks) {
      if (check !== 1) {
        throw new Error(`invalid deck: all number, 0,1,2,3,4,5,6,7 need to be present one and only one time`);
      }
    }


    const split = lootId.split(':');
    let transactionHash: string | undefined = undefined;
    let lootIdToUse = lootId;
    if (split.length > 1) {
      transactionHash = split[1];
      lootIdToUse = split[0];
    }

    let nonce: number | undefined = undefined;
    if (!transactionHash) {
      nonce = parseInt(nonceString);
      if (isNaN(nonce)) {
        throw new Error('invalid nonce');
      }
    }
    revealFlow.revealLootDeck(lootIdToUse, deck as [number, number, number, number, number, number,number, number], nonce, transactionHash, bruteForce);
  }

  $: revealOver = ($gamestate.phase !== "IDLE" && $gamestate.phase !== "LOADING" && $gamestate.phase !== "COMMIT"  && $gamestate.phase !== "REVEAL");
  $: revealNotReady = $gamestate.phase === "COMMIT"
  $: revealReady = $gamestate.phase === "REVEAL"
</script>

<WalletAccess>

  {#if $chain.state !== 'Connected' && $chain.state !== 'Ready'}
  <div
    class="w-full h-full mx-auto text-center flex-col text-black dark:text-white ">
    <p class="mt-4 text-xs sm:text-base font-black text-yellow-400">
      Please Connect to your wallet see the tokens
    </p>
    <button
      class="m-2 text-xs md:text-base font-black text-yellow-400 border border-yellow-500 p-1"
      on:click={() => flow.connect()}>Connect</button>
  </div>
{:else if !$wallet.address}
  <div
    class="w-full h-full mx-auto text-center flex-col text-black dark:text-white ">
    <p class="mt-4 text-xs sm:text-base font-black text-yellow-400">
      Please Connect to your wallet see your tokens
    </p>
    <button
      class="m-2 text-xs md:text-base font-black text-yellow-400 border border-yellow-500 p-1"
      on:click={() => flow.connect()}>Connect</button>
  </div>
{/if}


  <section
    class="py-8 md:w-3/4 w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white ">

    {#if revealOver}
      Reveal is over. Any Loot not resolved is lost forever!
      time to check the widthdrawal and see who won the game <a href={url('withdraw/')} class="border-red-600 border-2 p-2 m-2">WITHDRAW!</a>
    {:else if revealNotReady}
      The commit phase is not over yet, please go to <a href={url('commit/')} class="border-red-600 border-2 p-2 m-2">here</a> to play!
    {:else if revealReady}

    {#if $allToReveal.data?.result.lootSubmitteds}
    <p>{$allToReveal.data?.result.lootSubmitteds.length} Loot yet to be revealed!</p>
    {/if}

    {#if $gamestate.timeLeftBeforeNextPhase}
    <p class="text-green-400 pb-4">{timeToText($gamestate.timeLeftBeforeNextPhase)} left</p>
    {/if}

      {#if $toReveal.data}
        {#if $toReveal.data.loading}
          Loading...
        {:else}
        <label for="lootId">LootId</label>
        <select  class="mb-8 bg-black" bind:value={lootId}>
          {#each $toReveal.data.result.lootSubmitteds as loot}
            <option value={loot.id + (loot.transactionHash ? ':' +loot.transactionHash : '')}>
              {loot.id}
            </option>
          {/each}
        </select>
        {/if}
      {:else}
      <label for="lootId">LootId</label><input id="lootId" type="text" class="bg-black" bind:value={lootId}/>

      <label for="nonce">nonce</label><input id="lootId" type="text" class="bg-black" bind:value={nonceString}/>
      {/if}

      <label for="lootId">deck</label>
      <div class="w-96">

        <input bind:value={deckString1} class="bg-black" type="number" max="8" min="1" />
        <input bind:value={deckString2} class="bg-black" type="number" max="8" min="1" />
        <input bind:value={deckString3} class="bg-black" type="number" max="8" min="1" />
        <input bind:value={deckString4} class="bg-black" type="number" max="8" min="1" />
        <input bind:value={deckString5} class="bg-black" type="number" max="8" min="1" />
        <input bind:value={deckString6} class="bg-black" type="number" max="8" min="1" />
        <input bind:value={deckString7} class="bg-black" type="number" max="8" min="1" />
        <input bind:value={deckString8} class="bg-black" type="number" max="8" min="1" />

      </div>


      <button class="my-4 p-1 border-2 border-red-600" on:click={() => reveal()}>REVEAL</button>

      <p class="mt-10 text-sm">If you cannot recall what deck you played, we could attempt to brute-force it:</p>

      <button class="text-sm my-4 p-1 border-2 border-red-600" on:click={()=> reveal(true)}>brute-force</button>
    {/if}
  </section>
</WalletAccess>

{#if $revealFlow.step !== 'IDLE' && $revealFlow.step !== 'SUCCESS'}

  {#if $revealFlow.step === 'ALREADY_RESOLVED'}
    <Modal on:close={() => revealFlow.cancel()}>
      <div class="text-center">
        <h2>Loot {$revealFlow.data.lootId} has already been resolved</h2>
        <button
          class="mt-5 p-1 border border-yellow-500"
          label="Pick The Loot"
          on:click={() => revealFlow.cancel()}>
          OK
        </button>
      </div>
    </Modal>
    {:else if $revealFlow.step === 'NO_DECK_FOR_LOOT'}
    <Modal on:close={() => revealFlow.cancel()}>
      <div class="text-center">
        <h2>Loot {$revealFlow.data.lootId} has never been submitted</h2>
        <button
          class="mt-5 p-1 border border-yellow-500"
          label="Pick The Loot"
          on:click={() => revealFlow.cancel()}>
          OK
        </button>
      </div>
    </Modal>

    {:else if $revealFlow.step === 'BRUTE_FORCING'}
    <Modal on:close={() => revealFlow.cancel()}>
      <div class="text-center">
        BRUTE FORCING...
      </div>
    </Modal>
  {/if}
{/if}
