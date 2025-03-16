<script>
  import { onMount } from 'svelte';
  import 'isomorphic-fetch';

  let ingredients = { dailyValue: [], nonDailyValue: [] };
  let newIngredient = { ingredient: '', parent_id: null, unit: '', rdi: null, is_daily_value: true, no_rdi: false };
  let editingId = null;
  let editingIngredient = null;
  let dailyValueSymbol = '*';
  let nonDailyValueSymbol = '†';

  onMount(async () => {
    const [ingRes, settingsRes] = await Promise.all([
      fetch('/api/ingredients'),
      fetch('/api/settings'),
    ]);
    ingredients = await ingRes.json();
    const settings = await settingsRes.json();
    dailyValueSymbol = settings.dailyValueSymbol || '*';
    nonDailyValueSymbol = settings.nonDailyValueSymbol || '†';
    console.log('Loaded ingredients:', ingredients);
    console.log('Loaded settings:', settings);
  });

  async function addIngredient() {
    const payload = { ...newIngredient, rdi: newIngredient.no_rdi ? null : newIngredient.rdi };
    const res = await fetch('/api/ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const { id } = await res.json();
      newIngredient.id = id;
      ingredients[newIngredient.is_daily_value ? 'dailyValue' : 'nonDailyValue'].push({ ...payload });
      newIngredient = { ingredient: '', parent_id: null, unit: '', rdi: null, is_daily_value: true, no_rdi: false };
    }
  }

  function startEdit(ing) {
    editingId = ing.id;
    editingIngredient = { ...ing, no_rdi: ing.rdi === null };
  }

  async function saveEdit() {
    const payload = { ...editingIngredient, rdi: editingIngredient.no_rdi ? null : editingIngredient.rdi };
    await fetch(`/api/ingredients/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const list = editingIngredient.is_daily_value ? 'dailyValue' : 'nonDailyValue';
    const index = ingredients[list].findIndex(i => i.id === editingId);
    ingredients[list][index] = { ...payload };
    editingId = null;
    editingIngredient = null;
  }

  async function deleteIngredient(id, isDailyValue) {
    await fetch(`/api/ingredients/${id}`, { method: 'DELETE' });
    const list = isDailyValue ? 'dailyValue' : 'nonDailyValue';
    ingredients[list] = ingredients[list].filter(i => i.id !== id);
  }

  async function saveSymbols() {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyValueSymbol, nonDailyValueSymbol }),
    });
    alert('Symbols updated');
  }

  function getParentName(parentId) {
    const all = [...ingredients.dailyValue, ...ingredients.nonDailyValue];
    const parent = all.find(i => i.id === parentId);
    return parent ? parent.ingredient : 'None';
  }
</script>

<div class="bg-white p-4 rounded shadow">
  <h2 class="text-xl font-bold mb-4">Manage Ingredients</h2>
  
  <!-- Symbol Management -->
  <div class="mb-4">
    <h3 class="font-semibold">Symbol Settings</h3>
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label for="dailyValueSymbol" class="block font-semibold">Daily Value Symbol</label>
        <input id="dailyValueSymbol" bind:value={dailyValueSymbol} class="w-full p-2 border rounded" />
      </div>
      <div>
        <label for="nonDailyValueSymbol" class="block font-semibold">Non-Daily Value Symbol</label>
        <input id="nonDailyValueSymbol" bind:value={nonDailyValueSymbol} class="w-full p-2 border rounded" />
      </div>
      <button on:click={saveSymbols} class="bg-blue-500 text-white p-2 rounded col-span-2">Save Symbols</button>
    </div>
  </div>

  <!-- Add New Ingredient -->
  <div class="mb-4">
    <h3 class="font-semibold">Add New Ingredient</h3>
    <div class="grid grid-cols-2 gap-2">
      <input bind:value={newIngredient.ingredient} placeholder="Ingredient" class="p-2 border rounded" />
      <select bind:value={newIngredient.parent_id} class="p-2 border rounded">
        <option value={null}>No Parent</option>
        {#each [...ingredients.dailyValue, ...ingredients.nonDailyValue] as parent}
          <option value={parent.id}>{parent.ingredient}</option>
        {/each}
      </select>
      <input bind:value={newIngredient.unit} placeholder="Unit" class="p-2 border rounded" />
      <input bind:value={newIngredient.rdi} placeholder="RDI" type="number" class="p-2 border rounded" disabled={newIngredient.no_rdi} />
      <label><input type="checkbox" bind:checked={newIngredient.is_daily_value} /> Daily Value Ingredient</label>
      <label><input type="checkbox" bind:checked={newIngredient.no_rdi} /> No RDI</label>
      <button on:click={addIngredient} class="bg-blue-500 text-white p-2 rounded col-span-2">Add</button>
    </div>
  </div>

  <!-- Existing Ingredients -->
  <div>
    <h3 class="font-semibold">Existing Ingredients</h3>
    {#each ['dailyValue', 'nonDailyValue'] as type}
      <h4 class="mt-4">{type === 'dailyValue' ? 'Daily Value' : 'Non-Daily Value'}</h4>
      <div class="flex space-x-2 my-2 font-bold">
        <span class="w-32">Parent</span>
        <span class="w-32">Ingredient</span>
        <span class="w-16">Unit</span>
        <span class="w-16">RDI</span>
        <span class="w-16">Actions</span>
      </div>
      {#each ingredients[type] as ing}
        {#if editingId === ing.id}
          <div class="flex space-x-2 my-2 items-center">
            <select bind:value={editingIngredient.parent_id} class="p-2 border rounded">
              <option value={null}>No Parent</option>
              {#each [...ingredients.dailyValue, ...ingredients.nonDailyValue] as parent}
                {#if parent.id !== ing.id}
                  <option value={parent.id}>{parent.ingredient}</option>
                {/if}
              {/each}
            </select>
            <input bind:value={editingIngredient.ingredient} placeholder="Ingredient" class="p-2 border rounded" />
            <input bind:value={editingIngredient.unit} placeholder="Unit" class="p-2 border rounded" />
            <input bind:value={editingIngredient.rdi} placeholder="RDI" type="number" class="p-2 border rounded" disabled={editingIngredient.no_rdi} />
            <label><input type="checkbox" bind:checked={editingIngredient.is_daily_value} /> Daily Value Ingredient</label>
            <label><input type="checkbox" bind:checked={editingIngredient.no_rdi} /> No RDI</label>
            <button on:click={saveEdit} class="bg-green-500 text-white p-2 rounded">Save</button>
            <button on:click={() => (editingId = null)} class="bg-gray-500 text-white p-2 rounded">Cancel</button>
          </div>
        {:else}
          <div class="flex space-x-2 my-2 items-center">
            <span class="w-32">{getParentName(ing.parent_id)}</span>
            <span class="w-32">{ing.ingredient}</span>
            <span class="w-16">{ing.unit}</span>
            <span class="w-16">{ing.rdi !== null ? ing.rdi : nonDailyValueSymbol}</span>
            <button on:click={() => startEdit(ing)} class="bg-blue-500 text-white p-2 rounded">Edit</button>
            <button on:click={() => deleteIngredient(ing.id, ing.is_daily_value)} class="bg-red-500 text-white p-2 rounded">Delete</button>
          </div>
        {/if}
      {/each}
    {/each}
  </div>
</div>