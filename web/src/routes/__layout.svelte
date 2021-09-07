<script lang="ts">
  import '../service-worker-handler';
  import '../global.css';
  import {url} from '$lib/utils/url';
  import NavBar from '$lib/components/navigation/NavBar.svelte';
  import Notifications from '$lib/components/notification/Notifications.svelte';
  import NoInstallPrompt from '$lib/components/NoInstallPrompt.svelte';
  import NewVersionNotification from '$lib/components/NewVersionNotification.svelte';
  // import Install from './components/Install.svelte';

  import {appDescription, url as appUrl} from '../../application.json';
  import Modal from '$lib/components/Modal.svelte';
  import { flow, wallet } from '$lib/stores/wallet';

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

<NoInstallPrompt />
<NewVersionNotification />
<Notifications />
<NavBar
  links={[
    {href: url(''), title: 'Home'},
    {href: url('battle/'), title: 'Battle'},
    // {href: url('search/'), title: 'Search'},
    // {href: url('transmute/'), title: 'Transmute'}
  ]} />


<!-- <button class="text-red-600 underline" on:click={increaseTime}>increase time by 1 week</button> -->

<div class="text-white">


<slot />
</div>
