<script lang="ts">
  import WalletAccess from '$lib/WalletAccess.svelte';
  import withdrawFlow from '$lib/stores/withdrawFlow';


  let lootId: string;

  function withdraw() {
    withdrawFlow.withdraw(lootId);
  }
</script>

<WalletAccess>
  <section
    class="py-8 md:w-3/4 w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white ">

    <label for="lootId">LootId</label><input id="lootId" type="text" class="bg-black" bind:value={lootId}/>

    <button on:click={withdraw}>WITHDRAW</button>
  </section>
</WalletAccess>
