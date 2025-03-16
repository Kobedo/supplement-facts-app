<script>
  import { onMount } from 'svelte';
  import 'isomorphic-fetch';

  let sku = '';
  let productName = '';
  let servingSize = '';
  let servingsPerContainer = '';
  let dailyValueIngredients = [];
  let nonDailyValueIngredients = [];
  let otherIngredients = '';
  let containsAllergens = [];
  let manufacturer = '';
  let distributor = '';
  let allIngredients = { dailyValue: [], nonDailyValue: [] };
  let allAllergens = [];
  let allManufacturers = [];
  let allDistributors = [];
  let showManufacturer = false;
  let showDistributor = false;
  let dailyValueSymbol = '*';
  let nonDailyValueSymbol = '†';
  let error = null;

  onMount(async () => {
    try {
      console.log('Fetching data...');
      const [ingredientsRes, allergensRes, manufacturersRes, distributorsRes, settingsRes] = await Promise.all([
        fetch('/api/ingredients'),
        fetch('/api/allergens'),
        fetch('/api/manufacturers'),
        fetch('/api/distributors'),
        fetch('/api/settings'),
      ]);
      allIngredients = await ingredientsRes.json();
      allAllergens = await allergensRes.json();
      allManufacturers = await manufacturersRes.json();
      allDistributors = await distributorsRes.json();
      const settings = await settingsRes.json();
      dailyValueSymbol = settings.dailyValueSymbol || '*';
      nonDailyValueSymbol = settings.nonDailyValueSymbol || '†';
      console.log('Loaded ingredients:', allIngredients);
      console.log('Loaded settings:', settings);
    } catch (err) {
      console.error('Failed to load data:', err);
      error = err.message;
    }
  });

  function addIngredient(type) {
    if (type === 'daily') {
      dailyValueIngredients = [...dailyValueIngredients, { id: null, amount: '' }];
    } else {
      nonDailyValueIngredients = [...nonDailyValueIngredients, { id: null, amount: '' }];
    }
  }

  function removeIngredient(type, index) {
    if (type === 'daily') {
      dailyValueIngredients = dailyValueIngredients.filter((_, i) => i !== index);
    } else {
      nonDailyValueIngredients = nonDailyValueIngredients.filter((_, i) => i !== index);
    }
  }

  function calculateDV(ingredient) {
    const ing = allIngredients.dailyValue.find(i => i.id === ingredient.id);
    if (ing && ing.rdi && ingredient.amount) {
      return ((ingredient.amount / ing.rdi) * 100).toFixed(1);
    }
    return null;
  }

  async function savePanel() {
    const panel = {
      sku,
      productName,
      servingSize,
      servingsPerContainer,
      dailyValueIngredients,
      nonDailyValueIngredients,
      otherIngredients,
      containsAllergens,
      manufacturer,
      distributor,
    };
    const res = await fetch('/api/panels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(panel),
    });
    if (res.ok) alert('Panel saved!');
    else alert('Failed to save panel');
  }

  function printPanel() {
    window.print();
  }
</script>

{#if error}
  <div class="p-4 text-red-500">Error: {error}</div>
{:else}
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-white p-4 rounded shadow print:hidden">
      <h2 class="text-xl font-bold mb-4">Supplement Facts Generator</h2>
      <div class="space-y-4">
        <input bind:value={sku} placeholder="SKU" class="w-full p-2 border rounded" />
        <input bind:value={productName} placeholder="Product Name" class="w-full p-2 border rounded" />
        <input bind:value={servingSize} placeholder="Serving Size" class="w-full p-2 border rounded" />
        <input bind:value={servingsPerContainer} placeholder="Servings Per Container" class="w-full p-2 border rounded" type="number" />

        <div>
          <h3 class="font-semibold">Daily Value Ingredients</h3>
          <div class="flex space-x-2 my-2 font-bold">
            <span class="w-32">Ingredient</span>
            <span class="w-24">Amount</span>
            <span class="w-16">Actions</span>
          </div>
          {#each dailyValueIngredients as ing, i}
            <div class="flex space-x-2 my-2">
              <select bind:value={ing.id} class="p-2 border rounded w-32">
                <option value={null}>Select Ingredient</option>
                {#each allIngredients.dailyValue as option}
                  <option value={option.id}>{option.ingredient}</option>
                {/each}
              </select>
              <input bind:value={ing.amount} placeholder="Amount" type="number" class="w-24 p-2 border rounded" />
              <button on:click={() => removeIngredient('daily', i)} class="bg-red-500 text-white p-2 rounded">Remove</button>
            </div>
          {/each}
          <button on:click={() => addIngredient('daily')} class="bg-blue-500 text-white p-2 rounded">Add</button>
        </div>

        <div>
          <h3 class="font-semibold">Non-Daily Value Ingredients</h3>
          <div class="flex space-x-2 my-2 font-bold">
            <span class="w-32">Ingredient</span>
            <span class="w-24">Amount</span>
            <span class="w-16">Actions</span>
          </div>
          {#each nonDailyValueIngredients as ing, i}
            <div class="flex space-x-2 my-2">
              <select bind:value={ing.id} class="p-2 border rounded w-32">
                <option value={null}>Select Ingredient</option>
                {#each allIngredients.nonDailyValue as option}
                  <option value={option.id}>{option.ingredient}</option>
                {/each}
              </select>
              <input bind:value={ing.amount} placeholder="Amount" type="number" class="w-24 p-2 border rounded" />
              <button on:click={() => removeIngredient('nonDaily', i)} class="bg-red-500 text-white p-2 rounded">Remove</button>
            </div>
          {/each}
          <button on:click={() => addIngredient('nonDaily')} class="bg-blue-500 text-white p-2 rounded">Add</button>
        </div>

        <div>
          <h3 class="font-semibold">Other Ingredients</h3>
          <textarea bind:value={otherIngredients} placeholder="Enter other ingredients" class="w-full p-2 border rounded"></textarea>
        </div>

        <div>
          <h3 class="font-semibold">Allergens</h3>
          <div class="grid grid-cols-2 gap-2">
            {#each allAllergens as allergen}
              <label>
                <input type="checkbox" bind:group={containsAllergens} value={allergen.name} /> {allergen.name}
              </label>
            {/each}
          </div>
        </div>

        <div>
          <h3 class="font-semibold">Manufacturer</h3>
          <select bind:value={manufacturer} class="w-full p-2 border rounded">
            <option value="">Select Manufacturer</option>
            {#each allManufacturers as m}
              <option value={m.name}>{m.name}</option>
            {/each}
          </select>
          <label><input type="checkbox" bind:checked={showManufacturer} /> Show in Preview</label>
        </div>

        <div>
          <h3 class="font-semibold">Distributor</h3>
          <select bind:value={distributor} class="w-full p-2 border rounded">
            <option value="">Select Distributor</option>
            {#each allDistributors as d}
              <option value={d.name}>{d.name}</option>
            {/each}
          </select>
          <label><input type="checkbox" bind:checked={showDistributor} /> Show in Preview</label>
        </div>

        <div class="space-x-2">
          <button on:click={savePanel} class="bg-green-500 text-white p-2 rounded">Save Panel</button>
          <button on:click={printPanel} class="bg-gray-500 text-white p-2 rounded">Print</button>
        </div>
      </div>
    </div>

    <div class="bg-white p-4 rounded shadow print:contents">
      <h2 class="text-xl font-bold mb-4 print:hidden">Preview</h2>
      <div id="print-area" class="border-2 border-black p-4">
        <h3 class="text-lg font-bold text-center">{productName || 'Product Name'}</h3>
        <div class="border-t-4 border-b-4 border-black my-2 p-2">
          <h4 class="text-lg font-bold">Supplement Facts</h4>
          <p>Serving Size: {servingSize || 'N/A'}</p>
          <p>Servings Per Container: {servingsPerContainer || 'N/A'}</p>
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b-2 border-black">
                <th class="text-left"> </th>
                <th class="text-right">Amount Per Serving</th>
                <th class="text-right">{dailyValueSymbol} Daily Value</th>
              </tr>
            </thead>
            <tbody>
              {#each dailyValueIngredients as ing}
                {#if ing.id}
                  {@const info = allIngredients.dailyValue.find(i => i.id === ing.id)}
                  <tr class="border-b">
                    <td>{info.ingredient}</td>
                    <td class="text-right">{ing.amount || 0} {info.unit}</td>
                    <td class="text-right">{calculateDV(ing) !== null ? `${calculateDV(ing)}%` : nonDailyValueSymbol}</td>
                  </tr>
                {/if}
              {/each}
              {#each nonDailyValueIngredients as ing}
                {#if ing.id}
                  {@const info = allIngredients.nonDailyValue.find(i => i.id === ing.id)}
                  <tr class="border-b">
                    <td>{info.ingredient}</td>
                    <td class="text-right">{ing.amount || 0} {info.unit}</td>
                    <td class="text-right">{nonDailyValueSymbol}</td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
          <p class="text-sm mt-2">{dailyValueSymbol} Percent Daily Values are based on a 2,000 calorie diet.</p>
          <p class="text-sm">{nonDailyValueSymbol} Daily Value not established.</p>
        </div>
        <div>
          {#if otherIngredients}
            <p><strong>Other Ingredients:</strong> {otherIngredients}</p>
          {/if}
          {#if containsAllergens.length}
            <p><strong>Contains:</strong> {containsAllergens.join(', ')}</p>
          {/if}
          {#if showManufacturer && manufacturer}
            <p><strong>Manufacturer:</strong> {manufacturer}</p>
          {/if}
          {#if showDistributor && distributor}
            <p><strong>Distributor:</strong> {distributor}</p>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}