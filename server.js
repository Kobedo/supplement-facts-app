const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// SQLite setup
const db = new sqlite3.Database(path.join(__dirname, 'data', 'supplement.db'), (err) => {
  if (err) console.error('DB Error:', err);
  else console.log('Connected to SQLite');
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Initialize tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      panel_name TEXT NOT NULL,
      parent_id INTEGER,
      unit TEXT,
      rdi REAL,
      symbol TEXT,
      is_daily_value BOOLEAN,
      FOREIGN KEY (parent_id) REFERENCES ingredients(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS panels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      json_data TEXT NOT NULL
    )
  `);
  db.run(`CREATE TABLE IF NOT EXISTS allergens (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS manufacturers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, address TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS distributors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, address TEXT)`);
});

// Seed initial data (runs only if tables are empty)
db.get('SELECT COUNT(*) as count FROM ingredients', (err, row) => {
  if (err) console.error('Seed Error:', err);
  else if (row.count === 0) {
    db.serialize(() => {
      db.run(`INSERT INTO ingredients (name, panel_name, parent_id, unit, rdi, symbol, is_daily_value) VALUES
        ('Protein', 'Protein', NULL, 'g', 50, '*', 1),
        ('Fats', 'Total Fat', NULL, 'g', 78, '*', 1),
        ('Saturated Fat', 'Saturated Fat', 2, 'g', 20, '*', 1),
        ('Trans Fat', 'Trans Fat', 2, 'g', NULL, '†', 1),
        ('Vitamin D', 'Vitamin D', NULL, 'mcg', 20, '*', 1),
        ('L-Carnitine', 'L-Carnitine', NULL, 'mg', NULL, '†', 0),
        ('Energy Blend', 'Energy Blend', NULL, 'mg', NULL, '†', 0),
        ('Caffeine', 'Caffeine', 7, 'mg', NULL, '†', 0)`);
      db.run(`INSERT INTO allergens (name) VALUES ('Milk'), ('Eggs'), ('Fish'), ('Shellfish'), ('Tree Nuts'), ('Peanuts'), ('Wheat'), ('Soy')`);
      db.run(`INSERT INTO manufacturers (name, address) VALUES ('NutriCorp', '123 Health St, Wellness City, CA 90210')`);
      db.run(`INSERT INTO distributors (name, address) VALUES ('FitDist', '456 Energy Rd, Fitness Town, NY 10001')`);
    });
    console.log('Seeded initial data');
  }
});

// API Routes
app.get('/api/ingredients', (req, res) => {
  db.all('SELECT * FROM ingredients', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to load ingredients' });
    res.json({ dailyValue: rows.filter(r => r.is_daily_value), nonDailyValue: rows.filter(r => !r.is_daily_value) });
  });
});

app.post('/api/ingredients', (req, res) => {
  const { name, panel_name, parent_id, unit, rdi, symbol, is_daily_value } = req.body;
  db.run(
    'INSERT INTO ingredients (name, panel_name, parent_id, unit, rdi, symbol, is_daily_value) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, panel_name, parent_id || null, unit, rdi || null, symbol, is_daily_value],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to add ingredient' });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put('/api/ingredients/:id', (req, res) => {
  const { name, panel_name, parent_id, unit, rdi, symbol, is_daily_value } = req.body;
  db.run(
    'UPDATE ingredients SET name = ?, panel_name = ?, parent_id = ?, unit = ?, rdi = ?, symbol = ?, is_daily_value = ? WHERE id = ?',
    [name, panel_name, parent_id || null, unit, rdi || null, symbol, is_daily_value, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update ingredient' });
      res.json({ message: 'Ingredient updated' });
    }
  );
});

app.delete('/api/ingredients/:id', (req, res) => {
  db.run('DELETE FROM ingredients WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete ingredient' });
    res.json({ message: 'Ingredient deleted' });
  });
});

app.post('/api/panels', (req, res) => {
  const { sku, ...panelData } = req.body;
  db.run('INSERT INTO panels (sku, json_data) VALUES (?, ?)', [sku, JSON.stringify(panelData)], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to save panel' });
    res.status(201).json({ id: this.lastID });
  });
});

app.get('/api/panels', (req, res) => {
  db.all('SELECT * FROM panels', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to load panels' });
    res.json(rows.map(row => ({ id: row.id, sku: row.sku, ...JSON.parse(row.json_data) })));
  });
});

app.get('/api/allergens', (req, res) => {
  db.all('SELECT * FROM allergens', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to load allergens' });
    res.json(rows);
  });
});

app.get('/api/manufacturers', (req, res) => {
  db.all('SELECT * FROM manufacturers', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to load manufacturers' });
    res.json(rows);
  });
});

app.get('/api/distributors', (req, res) => {
  db.all('SELECT * FROM distributors', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to load distributors' });
    res.json(rows);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});