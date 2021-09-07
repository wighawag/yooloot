<script lang="ts">
  import {base} from '$app/paths';
  import { url } from '$lib/utils/url';
  import contractsInfo from '$lib/contracts.json';
</script>

<div
  class="w-full h-full mx-auto flex text-center flex-col items-center justify-center text-gray-200">

  <h1 class="text-2xl m-8">yooloot</h1>
  <p class="mx-8 pt-3">
    "yooloot" is a Fully on-chain Game of Battle for <a class="underline" href="https://lootproject.com" target="_blank" rel="noreferer">Loot</a>.
  </p>

  <p class="mx-8 pt-3">To participate you just need some Loot. For the first shot, the original Loot contract is used, but MLoot and "Loot For Everyone" is planned</p>

  <p class="mx-8 pt-3">The game is inspired by YOOLOO, a fun card game. The main difference is the open-endeness of the game and the card set to play with.</p>


  <p class="mx-8 pt-3">
    sadsad
  </p>

  <p class="mx-8 pt-3">
    fasdsad
  </p>

  <p class="mx-8 pt-3">sdsadsa</p>
</div>



<div
  class="border-t-2 border-gray-400 mt-16 w-full h-full mx-auto flex text-center flex-col items-center justify-center text-gray-400 ">
  <p class="m-8">
    Note that this project has not been audited and we do not take any responsability of lost loot.
  </p>

  <p class="p-1">
    The source code can be found
    <a
      href="https://github.com/wighawag/yooloot"
      target="_blank"
      class="underline">here</a>
    and the contract address is
    <a
      href={`https://etherscan.io/address/${contractsInfo.contracts.YooLoot?.address}`}
      target="_blank"
      class="underline">{contractsInfo.contracts.YooLoot?.address}</a>
  </p>

  <p class="p-1">
    This project was created by
    <a href="https://ronan.eth.link" target="_blank" class="underline">Ronan
      Sandford</a>
    (a.k.a
    <a
      href="https://twitter.com/wighawag"
      target="_blank"
      class="underline">wighawag
      <img
        class="w-4 h-4 inline"
        alt="wighawag"
        src={`${base}images/wig256x256.jpg`} /></a>)
  </p>
</div>
