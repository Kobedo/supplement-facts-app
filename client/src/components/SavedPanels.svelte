<script>
    import { onMount } from 'svelte';
    import 'isomorphic-fetch';
  
    let panels = [];
  
    onMount(async () => {
      const res = await fetch('/api/panels');
      panels = await res.json();
    });
  
    function editPanel(panel) {
      // Placeholder for editing logic (could redirect to Generator with pre-filled data)
      alert('Edit functionality TBD');
    }
  </script>
  
  <div class="bg-white p-4 rounded shadow">
    <h2 class="text-xl font-bold mb-4">Saved Panels</h2>
    {#if panels.length === 0}
      <p>No panels saved yet.</p>
    {:else}
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-200">
            <th class="p-2 text-left">SKU</th>
            <th class="p-2 text-left">Product Name</th>
            <th class="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each panels as panel}
            <tr class="border-b">
              <td class="p-2">{panel.sku}</td>
              <td class="p-2">{panel.productName}</td>
              <td class="p-2 text-right">
                <button on:click={() => editPanel(panel)} class="bg-blue-500 text-white p-1 rounded">Edit</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>