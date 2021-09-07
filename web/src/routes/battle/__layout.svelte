<script lang="ts">
  // import NavLink from './NavLink.svelte';
  import {url, urlOfPath} from '$lib/utils/url';
  import {page} from '$app/stores';
  import { goto } from '$app/navigation';
import Tab from '$lib/components/battle/Tab.svelte';

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
      <Tab href={url('battle/')} title="Rules" selected={urlOfPath('battle/', $page.path)}></Tab>
      <Tab href={url('battle/commit/')} title="Commit" selected={urlOfPath('battle/commit/', $page.path)}></Tab>
      <Tab href={url('battle/reveal/')} title="Reveal" selected={urlOfPath('battle/reveal/', $page.path)}></Tab>
      <Tab href={url('battle/withdraw/')} title="Withdraw" selected={urlOfPath('battle/withdraw', $page.path)}></Tab>

    </nav>
  </div>
</div>


<slot></slot>
