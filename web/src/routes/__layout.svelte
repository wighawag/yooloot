<script lang="ts">
  import '../service-worker-handler';
  import '../global.css';
  import {url, urlOfPath} from '$lib/utils/url';
  import {page} from '$app/stores';
  import { goto } from '$app/navigation';
  import Tab from '$lib/components/battle/Tab.svelte';
  import Notifications from '$lib/components/notification/Notifications.svelte';
  import NoInstallPrompt from '$lib/components/NoInstallPrompt.svelte';
  import NewVersionNotification from '$lib/components/NewVersionNotification.svelte';
  // import Install from './components/Install.svelte';

  import {appDescription, url as appUrl} from '../../application.json';
  import { base } from '$app/paths';

  const title = 'yooloot';
  const description = appDescription;
  const host = appUrl.endsWith('/') ? appUrl : appUrl + '/';
  const previewImage = host + 'preview.png';


  // function increaseTime() {
  //   flow.execute(async (contracts) => {
  //     await wallet.provider.send('evm_increaseTime', [7 * 24 * 60 * 60]);
  //     await wallet.provider.send('evm_mine', []);
  //   })
  // }


  let selected = 'commit/'
  async function select(e) {
    console.log(`selected : ${selected}`, e.target.value);
    await goto(url(e.target.value));
  }

</script>

<svelte:head>
  <title>{title}</title>
  <meta name="title" content={title} />
  <meta name="description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={host} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={previewImage} />
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content={host} />
  <meta property="twitter:title" content={title} />
  <meta property="twitter:description" content={description} />
  <meta property="twitter:image" content={previewImage} />
</svelte:head>

<div class="text-white text-xl">
<NoInstallPrompt />
<NewVersionNotification />
<Notifications />


<a href="https://yooloot.xyz"><img
      class="m-2 text-white inline"
      src={`${base}/images/yooloot-title-fit.png`}
      alt="YooLoot"
      style="height:34px;"
      height="34px"
    />(For Everyone)</a>


<!-- <button class="text-red-600 underline" on:click={increaseTime}>increase time by 1 week</button> -->


<div>
  <div class="sm:hidden">
    <label for="tabs" class="sr-only">Select a tab</label>
    <select on:change={select} id="tabs" name="tabs" class="text-white bg-black block w-full focus:ring-offset-red-600 focus:border-red-600 border-gray-300 rounded-md">
      <option selected={urlOfPath('', $page.path)} value="">Rules</option>

      <option selected={urlOfPath('commit/', $page.path)} value="commit/">Commit</option>

      <option selected={urlOfPath('reveal/', $page.path)} value="reveal/">Reveal</option>

      <option selected={urlOfPath('withdraw/', $page.path)} value="withdraw/">Withdraw</option>
    </select>
  </div>
  <div class="hidden sm:block">
    <nav class="relative z-0 rounded-lg shadow flex divide-x divide-gray-200" aria-label="Tabs">
      <!-- Current: "text-gray-900", Default: "text-gray-500 hover:text-gray-700" -->
      <Tab href={url('')} title="Rules" selected={urlOfPath('', $page.path)}></Tab>
      <Tab href={url('commit/')} title="Commit" selected={urlOfPath('commit/', $page.path)}></Tab>
      <Tab href={url('reveal/')} title="Reveal" selected={urlOfPath('reveal/', $page.path)}></Tab>
      <Tab href={url('withdraw/')} title="Withdraw" selected={urlOfPath('withdraw', $page.path)}></Tab>

    </nav>
  </div>
</div>



<slot />
</div>
