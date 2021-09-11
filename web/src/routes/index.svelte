<script lang="ts">
  import {base} from '$app/paths';
  import { url } from '$lib/utils/url';
  import contractsInfo from '$lib/contracts.json';
</script>


<div
  class="w-full h-full mx-auto flex text-center flex-col items-center justify-center text-gray-300 text-xl">

  <p class="m-6 text-white font-extrabold text-4xl">
    YooLoot is a Free For All Battle Game For <a class="underline" target="_blank" href="https://lootproject.com">Loot!</a>
  </p>

    <p class="m-6 text-white font-extrabold text-2xl">
      Grab your best Loot and compete with other Looters
    </p>

  <p class="mx-8 my-8 text-white font-extrabold">The game works as follow:</p>

  <p class="mx-8">Select your Loot and sort its content from 1 to 8.</p>
  <p class="mx-8">Each item in your loot have an associated power that can see on the card.</p>
  <p class="mx-8">Once you decided on your deck order, you'll commit a hash of it on the smart contract, along side your Loot token</p>
  <p class="mx-8">You'll have to come back on the reveal period to reveal your deck to everyone. (you ll have ++ days to do so. If you do not that step, your Loot will be lost forever.</p>
  <p class="mx-8">After the reveal is over, a winner will be computed based on the following rules</p>


  <p class="mx-8 my-8 text-white font-extrabold">The game works as follow:</p>

  <p>Points are distributed each roubd to players with the lowest occurence and the highest score. The amount of points distributed is equal to the round.</p>
  <p>You can adjust your selected Loot and Strategy until the joust starts.</p>
  <p class="mx-8 mt-3">Once the joust start, you have to acknowledge your strategy (which previously hidden from other player) and note that if you do not reveal, your Loot is burnt forever.</p>
  <p class="mx-8 mt-3">Then once the reveal period is over you can watch the battle unfold and reap victory ... or defeat.</p>

  <a class="m-2 p-2 border-2 border-red-600" href={url("commit/")} >GO PLAY</a>
</div>
