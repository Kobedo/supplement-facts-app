<script>
  import { onMount } from 'svelte';
  import Generator from './components/Generator.svelte';
  import SavedPanels from './components/SavedPanels.svelte';
  import IngredientManager from './components/IngredientManager.svelte';

  let currentPage = 'generator';

  function setPage(page) {
    currentPage = page;
  }

  onMount(() => {
    // Initial page load logic if needed
  });
</script>

<main class="min-h-screen bg-gray-100">
  <nav class="bg-blue-600 text-white p-4">
    <ul class="flex space-x-4">
      <li><button class="hover:underline" on:click={() => setPage('generator')}>Generator</button></li>
      <li><button class="hover:underline" on:click={() => setPage('saved')}>Saved Panels</button></li>
      <li><button class="hover:underline" on:click={() => setPage('ingredients')}>Manage Ingredients</button></li>
    </ul>
  </nav>

  <div class="container mx-auto p-4">
    {#if currentPage === 'generator'}
      <Generator />
    {:else if currentPage === 'saved'}
      <SavedPanels />
    {:else if currentPage === 'ingredients'}
      <IngredientManager />
    {/if}
  </div>
</main>