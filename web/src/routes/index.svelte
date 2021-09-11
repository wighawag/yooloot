<script lang="ts">
  import {base} from '$app/paths';
  import { url } from '$lib/utils/url';
  import contractsInfo from '$lib/contracts.json';
</script>


<div
  class="w-full h-full mx-auto flex text-center flex-col items-center justify-center text-gray-300 text-xl">

  <p class="m-6 text-white font-extrabold text-4xl">
    YooLoot is a "Free For All" Battle Game For <a class="underline" target="_blank" href="https://lootproject.com">Loot!</a>
  </p>

    <p class="m-6 text-white font-extrabold text-2xl">
      Grab your best Loot and compete with other Looters
    </p>

  <p class="mx-8 my-8 text-white font-extrabold">The game works as follow:</p>

  <p class="mx-8">Select your Loot and sort its content from 1 to 8.</p>
  <p>(You can adjust your selected Loot and Strategy until the joust starts).</p>
  <p class="mx-8">Each item in your loot have an associated power that can see on the card.</p>
  <p class="mx-8">Once you decide on your deck order, you'll commit a hash of it on the smart contract, along side your Loot token</p>
  <p class="mx-8">You'll have to come back on the reveal period to reveal your deck to everyone. (you ll have 3 days to do so. If you do not that step, your Loot will be lost forever.</p>
  <p class="mx-8">After the reveal is over, a winner will be computed based on the following rules</p>


  <p class="mx-8 mt-4">Points are distributed each round to the player with a unique power card and the highest score. The amount of points distributed is equal to the round.</p>
  <p class="mx-8">If there is no winner on one round but a winner on a later round, the winner get the points for all rounds involved.</p>
  <p class="mx-8">If there is no winner for all rounds, then the game ends with zero winner and you can all witthdraw your Loot.</p>
  <p class="mx-8">If there is 2 players with the same score, the player who won higher score round wins.</p>

  <p class="mx-8 mt-4">The game is the first of a series. Some design decision were made to keep the smart contract simple. More complex scenario could be handled later.</p>

  <a class="mx-8 my-4 p-2 border-2 border-red-600" href={url("commit/")} >GO PLAY</a>
</div>
