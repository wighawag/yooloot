<script lang="ts">
  import WalletAccess from '$lib/WalletAccess.svelte';
  import revealFlow from '$lib/stores/revealFlow';


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
</script>

<WalletAccess>
  <section
    class="py-8 md:w-3/4 w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white ">

    <label for="lootId">LootId</label><input id="lootId" type="text" class="bg-black" bind:value={lootId}/>
    <label for="deck">deck</label><input id="deck" type="text" class="bg-black" bind:value={deckString}/>
    <label for="nonce">nonce</label><input id="lootId" type="text" class="bg-black" bind:value={nonceString}/>

    <button class="my-4 p-1 border-2 border-red-600" on:click={reveal}>REVEAL</button>
  </section>
</WalletAccess>
