<script>
  import Generator from './components/Generator.svelte';
  import IngredientManager from './components/IngredientManager.svelte';
  let page = 'generator';
</script>

<nav class="bg-blue-500 p-4 text-white print:hidden">
  <button on:click={() => (page = 'generator')} class="mr-4">Generator</button>
  <button on:click={() => (page = 'ingredients')} class="mr-4">Manage Ingredients</button>
  <button on:click={() => (page = 'panels')}>Saved Panels</button>
</nav>

<main class="p-4">
  {#if page === 'generator'}
    <Generator />
  {:else if page === 'ingredients'}
    <IngredientManager />
  {:else if page === 'panels'}
    <h2 class="text-xl font-bold">Saved Panels (WIP)</h2>
  {/if}
</main>