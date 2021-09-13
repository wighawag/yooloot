<script lang="ts">
  import WalletAccess from '$lib/WalletAccess.svelte';
  import withdrawFlow from '$lib/stores/withdrawFlow';
  import gamestate from '$lib/stores/gamestate';
import { url } from '$lib/utils/url';
import { flow, wallet } from '$lib/stores/wallet';
import { YooLootContract } from '$lib/config';
import { toWithdraw } from '$lib/stores/gameQuery';


  let winnerLootId: string;
  let lootId: string;

  function withdraw() {
    withdrawFlow.withdraw(lootId);
  }

  function claimVictoryLoot() {
    flow.execute(async (contracts) => {
      await contracts[YooLootContract].claimVictoryLoot(winnerLootId);
    });
  }

  $: withdrawNotReady = $gamestate.phase === "COMMIT" || $gamestate.phase === "REVEAL"
  $: winnerWithdrawReady = $gamestate.phase === 'WINNER';
  $: winnerWithdrawOver = $gamestate.phase === 'WITHDRAW';

  $: destination = $gamestate.phase === 'REVEAL' ? 'reveal/' : 'commit/';
  $: destinationTitle = $gamestate.phase === 'REVEAL' ? 'REVEAL!' : 'PLAY!';
</script>

<WalletAccess>
  <section
    class="py-8 md:w-3/4 w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white ">

  {#if withdrawNotReady}
    <p>The Withdraw phase is not ready yet, please go to <a href={url(destination)} class="border-red-600 border-2 p-2 m-2">here</a> to {destinationTitle}</p>
  {:else}
    <p>Winner is {$gamestate.winner}</p>
  {/if}
  {#if !winnerWithdrawOver}
    {#if $wallet.address && $wallet.address.toLowerCase() === $gamestate.winner?.toLowerCase()}
      <h2>Congrats! You Won!</h2>
      <p>Please pick a loot to withdraw that is not your (sorry not UI yet to pick)</p>
      <label for="winnerLootId">LootId</label><input id="winnerLootId" type="text" class="bg-black" bind:value={winnerLootId}/>

      <button class="my-4 p-1 border-2 border-red-600" on:click={claimVictoryLoot}>LOOT!</button>
    {:else if !withdrawNotReady }
      Waiting for winner to pick its winning loot
    {/if}
  {:else}

      {#if $gamestate.winner === '0x0000000000000000000000000000000000000000'}
      <p class="mt-5">Nobody won, withdraw your loot(s)</p>
      {:else}
      <p class="mt-5">You can now pick your loot (Assuming the winner did not chose it)</p>
      {/if}

      {#if $toWithdraw.data}
        {#if $toWithdraw.data.loading}
          Loading...
        {:else}
        <label for="lootId">LootId</label>
        <select  class="mb-8 bg-black" bind:value={lootId}>
          {#each $toWithdraw.data.result.lootSubmitteds as loot}
            <option value={loot.id}>
              {loot.id}
            </option>
          {/each}
        </select>
        {/if}
      {:else}
      <label for="lootId">LootId</label><input id="lootId" type="text" class="bg-black" bind:value={lootId}/>
      {/if}


      <button class="my-4 p-1 border-2 border-red-600" on:click={withdraw}>WITHDRAW</button>
  {/if}
</section>

</WalletAccess>
