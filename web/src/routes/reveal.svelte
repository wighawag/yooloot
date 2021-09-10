<script lang="ts">
  import WalletAccess from '$lib/WalletAccess.svelte';
  import revealFlow from '$lib/stores/revealFlow';
  import gamestate from '$lib/stores/gamestate';
import { url } from '$lib/utils/url';
import Modal from '$lib/components/Modal.svelte';


  let deckString: string;
  let lootId: string;
  let nonceString: string;

  function reveal() {
    const deck = deckString.split(',').map(v => parseInt(v));
    if (deck.length !== 8) {
      throw new Error(`invalid deck: length:${deck.length}, need to be 8`);
    }
    let checks = [0,0,0,0,0,0,0,0];
    for (let i = 0; i < deck.length; i++) {
      const elem = deck[i];
      if (isNaN(elem)) {
        throw new Error(`invalid deck: not all element are numbers`);
      }
      checks[elem] ++;
    }
    for (const check of checks) {
      if (check !== 1) {
        throw new Error(`invalid deck: all number, 0,1,2,3,4,5,6,7 need to be present one and only one time`);
      }
    }
    const nonce = parseInt(nonceString);

    if (isNaN(nonce)) {
      throw new Error('invalid nonce');
    }

    revealFlow.revealLootDeck(lootId, deck as [number, number, number, number, number, number,number, number], nonce);
  }

  $: revealOver = ($gamestate.phase !== "IDLE" && $gamestate.phase !== "LOADING" && $gamestate.phase !== "COMMIT"  && $gamestate.phase !== "REVEAL");
  $: revealNotReady = $gamestate.phase === "COMMIT"
</script>

<WalletAccess>
  <section
    class="py-8 md:w-3/4 w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white ">

    {#if revealOver}
      Reveal is over. Any Loot not resolved is lost forever!
      time to check the widthdrawal and see who won the game <a href={url('withdraw/')} class="border-red-600 border-2 p-2 m-2">WITHDRAW!</a>
    {:else if revealNotReady}
      The commit phase is not over yet, please go to <a href={url('commit/')} class="border-red-600 border-2 p-2 m-2">here</a> to play!
    {:else}
      <label for="lootId">LootId</label><input id="lootId" type="text" class="bg-black" bind:value={lootId}/>
      <label for="deck">deck</label><input id="deck" type="text" class="bg-black" bind:value={deckString}/>
      <label for="nonce">nonce</label><input id="lootId" type="text" class="bg-black" bind:value={nonceString}/>

      <button class="my-4 p-1 border-2 border-red-600" on:click={reveal}>REVEAL</button>
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

  {/if}
{/if}
