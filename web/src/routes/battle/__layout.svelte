<script lang="ts">
  // import NavLink from './NavLink.svelte';
  import {url, urlOfPath} from '$lib/utils/url';
  import {page} from '$app/stores';
  import { goto } from '$app/navigation';

  let selected = 'battle/commit/'
  async function select(e) {
    console.log(`selected : ${selected}`, e.target.value);
    await goto(url(e.target.value));
  }

</script>


<div>
  <div class="sm:hidden">
    <label for="tabs" class="sr-only">Select a tab</label>
    <select on:change={select} id="tabs" name="tabs" class="text-white bg-black block w-full focus:ring-offset-red-600 focus:border-red-600 border-gray-300 rounded-md">
      <option selected={urlOfPath('battle/', $page.path)} value="battle/">Rules</option>

      <option selected={urlOfPath('battle/commit/', $page.path)} value="battle/commit/">Commit</option>

      <option selected={urlOfPath('battle/reveal/', $page.path)} value="battle/reveal/">Reveal</option>

      <option selected={urlOfPath('battle/withdraw/', $page.path)} value="battle/withdraw/">Withdraw</option>
    </select>
  </div>
  <div class="hidden sm:block">
    <nav class="relative z-0 rounded-lg shadow flex divide-x divide-gray-200" aria-label="Tabs">
      <!-- Current: "text-gray-900", Default: "text-gray-500 hover:text-gray-700" -->
      <a href={url('battle/')} class="text-gray-50 rounded-l-lg group relative min-w-0 flex-1 overflow-hidden bg-black py-4 px-4 text-sm font-medium text-center hover:bg-gray-500 focus:z-10" aria-current="page">
        <span>Rules</span>
        <span aria-hidden="true" class="bg-red-500 absolute inset-x-0 bottom-0 h-0.5"></span>
      </a>

      <a href={url('battle/commit/')} class="text-gray-50 hover:text-gray-50 group relative min-w-0 flex-1 overflow-hidden bg-black py-4 px-4 text-sm font-medium text-center hover:bg-gray-500 focus:z-10">
        <span>Commit</span>
        <span aria-hidden="true" class="bg-transparent absolute inset-x-0 bottom-0 h-0.5"></span>
      </a>

      <a href={url('battle/reveal/')} class="text-gray-50 hover:text-gray-50 group relative min-w-0 flex-1 overflow-hidden bg-black py-4 px-4 text-sm font-medium text-center hover:bg-gray-500 focus:z-10">
        <span>Reveal</span>
        <span aria-hidden="true" class="bg-transparent absolute inset-x-0 bottom-0 h-0.5"></span>
      </a>

      <a href={url('battle/withdraw/')} class="text-gray-50 hover:text-gray-50 group relative min-w-0 flex-1 overflow-hidden bg-black py-4 px-4 text-sm font-medium text-center hover:bg-gray-500 focus:z-10">
        <span>Withdraw</span>
        <span aria-hidden="true" class="bg-transparent absolute inset-x-0 bottom-0 h-0.5"></span>
      </a>
    </nav>
  </div>
</div>


<slot></slot>
