const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Path to data (assuming the pokemon-data.json folder is in the same directory as this script or one level up)
const DATA_DIR = path.join(__dirname, 'pokemon-data.json');
const POKEDEX_PATH = path.join(DATA_DIR, 'pokedex.json');

let pokedex = [];

async function loadData() {
    try {
        if (await fs.pathExists(POKEDEX_PATH)) {
            pokedex = await fs.readJson(POKEDEX_PATH);
            console.log(`Loaded ${pokedex.length} Pokémon from ${POKEDEX_PATH}`);
        } else {
            console.warn(`Pokedex file not found at ${POKEDEX_PATH}. Make sure the "pokemon-data.json" folder is in the same directory as this script.`);
        }
    } catch (error) {
        console.error('Error loading Pokémon data:', error);
    }
}

// Serve Images Statically
app.use('/images', express.static(path.join(DATA_DIR, 'images')));

// API Routes
app.get('/api/pokemon/random', (req, res) => {
    if (pokedex.length === 0) return res.status(503).json({ error: 'Data not loaded' });
    const pokemon = pokedex[Math.floor(Math.random() * pokedex.length)];
    res.json(pokemon);
});

app.get('/api/pokemon/search', (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query parameter "q" is required' });
    const results = pokedex.filter(p => 
        p.name.english.toLowerCase().includes(query.toLowerCase()) ||
        (p.name.french && p.name.french.toLowerCase().includes(query.toLowerCase())) ||
        p.type.some(t => t.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 10);
    res.json(results);
});

app.get('/api/pokemon/:idOrName', (req, res) => {
    const param = req.params.idOrName;
    let pokemon;
    if (!isNaN(param)) {
        pokemon = pokedex.find(p => p.id === parseInt(param));
    } else {
        const lowerName = param.toLowerCase();
        pokemon = pokedex.find(p => 
            p.name.english.toLowerCase() === lowerName || 
            (p.name.french && p.name.french.toLowerCase() === lowerName) ||
            (p.name.japanese && p.name.japanese.toLowerCase() === lowerName)
        );
    }

    if (!pokemon) return res.status(404).json({ error: 'Pokemon not found' });
    res.json(pokemon);
});

app.get('/', (req, res) => {
    res.send('Pokémon API is running. Endpoints: /api/pokemon/random, /api/pokemon/:id, /api/pokemon/search?q=...');
});

loadData().then(() => {
    app.listen(PORT, () => {
        console.log(`Pokemon API server listening on port ${PORT}`);
    });
});
