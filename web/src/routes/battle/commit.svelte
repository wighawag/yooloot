<script lang="ts">
  import WalletAccess from '$lib/WalletAccess.svelte';
  import NavButton from '$lib/components/navigation/NavButton.svelte';
  import type {NFT} from '$lib/stores/originalloot';
  import {nftsof} from '$lib/stores/originalloot';
  import {wallet, flow, chain} from '$lib/stores/wallet';
  import commitFlow from '$lib/stores/commitFlow';
  import Modal from '$lib/components/Modal.svelte';
import gamestate from '$lib/stores/gamestate';
import { url } from '$lib/utils/url';
import gameState from '$lib/stores/gamestate';

  $: nfts = nftsof($wallet.address);

  function pick(nft: NFT) {
    if (commitOver) {
      return;
    }
    commitFlow.chooseLoot(nft);
  }

  let deckString;

  function chooseDeck() {
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
    commitFlow.chooseDeck(deck);
  }

  $: commitOver = $gamestate.phase !== "IDLE"  && $gamestate.phase !== "LOADING" && $gamestate.phase !== "COMMIT"

  $: destination = $gameState.phase === 'REVEAL' ? 'battle/reveal/' : 'battle/withdraw/';
  $: destinationTitle = $gameState.phase === 'REVEAL' ? 'REVEAL!' : 'WITHDRAW!';
</script>

<WalletAccess>

  <section
    class="py-8 md:w-3/4 w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white ">

    {#if commitOver}
      Commit Phase is over, time to <a href={url(destination)} class="border-red-600 border-2 p-2 m-2">{destinationTitle}</a>

    {/if}
  </section>

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

  {#if $nfts.state === 'Ready'}
    {#if $nfts.tokens.length > 0}
      {#if !commitOver}
      <div
        class="w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white ">
        <p class="p-6">
            Here are your Loot to battle with, pick one
        </p>
      </div>
      {/if}
    {:else if $chain.notSupported}
      <div
        class="py-8 px-10 w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white ">
        <p class="p-4">Please switch network</p>
        <NavButton label="Disonnect" on:click={() => wallet.disconnect()}>
          Disonnect
        </NavButton>
      </div>
    {:else if $wallet.state === 'Ready'}
      <div
        class="w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white ">
          <p class="p-4">You do not have any of the original Loot</p>
      </div>
    {/if}
  {/if}


  <section
    class="py-8 md:w-3/4 w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white ">

    {#if $wallet.state !== 'Ready'}
      <!-- <form class="mt-5 w-full max-w-sm">
        <div class="flex items-center">
          <NavButton
            label="Connect"
            disabled={$wallet.unlocking || $chain.connecting}
            on:click={() => flow.connect()}>
            Connect
          </NavButton>
        </div>
      </form> -->
    {:else if !$nfts}
      <div>Getting Tokens...</div>
    {:else if $nfts.state === 'Idle'}
      <div>Tokens not loaded</div>
    {:else if $nfts.error}
      <div>Error: {$nfts.error}</div>
    {:else if $nfts.tokens.length === 0 && $nfts.state === 'Loading'}
      <div>Loading Your Tokens...</div>
    {:else}
      <ul
        class="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-20 sm:space-y-0 lg:grid-cols-3 lg:gap-x-16">
        {#each $nfts.tokens as nft, index}
          <li>
            <div
              id={nft.id}
              class="space-y-4 py-8 cursor-pointer"
              on:click={() => pick(nft)}
              >
              <div class="aspect-w-3 aspect-h-2">
                {#if nft.error}
                  Error:
                  {nft.error}
                <!-- {:else if nft.tokenSVG} -->
                <!-- <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350"> -->
                <!-- {@html nft.tokenSVG} -->
              <!-- </svg> -->
                {:else if nft.image}
                  <img
                    class="border-2 border-white"
                    width="400px"
                    height="400px"
                    alt={nft.name}
                    src={nft.image} />
                    {nft.deckPower}
                {:else}
                  <p class="">{nft.name}</p>
                {/if}
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</WalletAccess>


{#if $commitFlow.step !== 'IDLE' && $commitFlow.step !== 'SUCCESS'}

  {#if $commitFlow.step === 'CHOOSE_DECK'}

    <Modal on:close={() => commitFlow.cancel()}>
      {#if !$commitFlow.data}
        Error
      {:else}
        <div class="text-center">
          <h2>What is your deck order?</h2>

          <p> this is your card power:</p>
          <p>{$commitFlow.data.loot.deckPower.map((v,i) => `${i}:${v}`).join(" / ")}</p>

          <input bind:value={deckString} class="bg-black" type="text" />
          <button
            class="mt-5 p-1 border border-yellow-500"
            label="confirm"
            on:click={chooseDeck}>
            Confirm
          </button>
        </div>
      {/if}
    </Modal>
  {:else if $commitFlow.step === 'WAITING_FOR_ACKNOWLEDGMENT'}
  <Modal on:close={() => commitFlow.cancel()}>
    <div class="text-center">
      <h2>Loot {$commitFlow.data.loot.id} submited with nonce {$commitFlow.data.nonce} and the following deck :</h2>
      <p> {$commitFlow.data.deck}</p> <!-- TODO show power of each card-->
      <p>You might as well take note of it. You ll need for the reveal phase</p>
      <p>In term of power, this is the following :</p>
      <p> {$commitFlow.data.deck.map((i) => $commitFlow.data.loot.deckPower[i])}</p> <!-- TODO show power of each card-->
      <button
        class="mt-5 p-1 border border-yellow-500"
        label="Pick The Loot"
        on:click={() => commitFlow.acknowledgeSuccess()}>
        OK
      </button>
    </div>

  </Modal>
  {:else if $commitFlow.step === 'NEED_CONFIRMATION'}
    <Modal on:close={() => commitFlow.cancel()}>
      {#if !$commitFlow.data}
        Error
      {:else}
        <div class="text-center">
          <h2>Loot {$commitFlow.data.loot.id}</h2>
          <p> {$commitFlow.data.deck.map((i) => $commitFlow.data.loot.deckPower[i])}</p> <!-- TODO show power of each card-->
          <button
            class="mt-5 p-1 border border-yellow-500"
            label="Pick The Loot"
            on:click={() => commitFlow.confirm()}>
            Confirm
          </button>
        </div>
      {/if}
    </Modal>
  {:else if $commitFlow.step === 'WAITING_FOR_SIGNATURE'}
    <Modal>
      <div class="text-center">
        <h2>Please accept signature to generate your secret</h2>
        <p>This will allow you to recover from loss if needed</p>
      </div>
    </Modal>
  {:else}
  <!-- -->
  {/if}
{/if}
