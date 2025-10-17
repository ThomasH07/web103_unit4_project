import { pool } from './database.js';

const featureData = {
    "Exterior": [
        { name: "Polar White", price: 0, image: '/images/car-white.png', color: '#FFFFFF' },
        { name: "Obsidian Black", price: 500, image: '/images/car-black.png', color: '#000000' },
        { name: "Velocity Red", price: 750, image: '/images/car-red.png', color: '#FF0000' },
        { name: "Starlight Blue", price: 750, image: '/images/car-blue.png', color: '#005A9C' },
    ],
    "Roof": [
        { name: "Standard Roof", price: 0, image: '/images/roof-standard.png' },
        { name: "Panoramic Sunroof", price: 1200, image: '/images/roof-pano.png' },
        { name: "Convertible Soft Top", price: 2500, image: '/images/roof-convertible.png' },
    ],
    "Wheels": [
        { name: "18-inch Aero", price: 0, image: '/images/wheels-aero.png'  },
        { name: "19-inch Sport", price: 800, image: '/images/wheels-sport.png' },
        { name: "20-inch Performance", price: 1500, image: '/images/wheels-performance.png' },
    ],
    "Interior": [
        { name: "Black Synthetic", price: 0, image: '/images/interior-black.png'  },
        { name: "White Premium", price: 1000, image: '/images//interior-white.png' },
        { name: "Red Accent", price: 1250, image: '/images/interior-red.png' },
    ]
};

const initialCustomItems = [
    {
        name: "Lightning McQueen",
        options: ["Velocity Red", "Standard Roof", "19-inch Sport", "Black Synthetic"]
    },
    {
        name: "White Fox",
        options: ["Polar White", "Panoramic Sunroof", "18-inch Aero", "White Premium"]
    },
    {
        name: "Midnight Rider",
        options: ["Obsidian Black", "Convertible Soft Top", "20-inch Performance", "Red Accent"]
    }
];

const createTables = async () => {
    const dropQueries = `
        DROP TABLE IF EXISTS custom_item_options;
        DROP TABLE IF EXISTS custom_items;
        DROP TABLE IF EXISTS feature_options;
        DROP TABLE IF EXISTS features;
    `;

    const createTableQueries = `
        CREATE TABLE IF NOT EXISTS features (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS feature_options (
            id SERIAL PRIMARY KEY,
            feature_id INTEGER REFERENCES features(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            price_in_cents INTEGER NOT NULL DEFAULT 0,
            image VARCHAR(255) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS custom_items (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS custom_item_options (
            custom_item_id INTEGER REFERENCES custom_items(id) ON DELETE CASCADE,
            option_id INTEGER REFERENCES feature_options(id) ON DELETE CASCADE,
            PRIMARY KEY (custom_item_id, option_id)
        );
    `;
    
    try {
        await pool.query(dropQueries);
        console.log('✅ All old tables dropped successfully.');
        await pool.query(createTableQueries);
        console.log('✅ All new tables created successfully.');
    } catch (err) {
        console.error('❌ Error creating tables:', err);
        throw err;
    }
}

const seedTables = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('🌱 Seeding features and options...');

        const featureMap = {};
        for (const featureName of Object.keys(featureData)) {
            const res = await client.query(
                'INSERT INTO features (name) VALUES ($1) RETURNING id', 
                [featureName]
            );
            featureMap[featureName] = res.rows[0].id;
        }

        const optionMap = {};
        for (const [featureName, options] of Object.entries(featureData)) {
            const featureId = featureMap[featureName];
            for (const option of options) {
                const res = await client.query(
                    'INSERT INTO feature_options (feature_id, name, price_in_cents, image) VALUES ($1, $2, $3, $4) RETURNING id',
                    [featureId, option.name, option.price * 100, option.image]
                );
                optionMap[option.name] = res.rows[0].id;
            }
        }
        
        console.log('🌱 Seeding initial custom items...');
        for (const item of initialCustomItems) {
            const itemRes = await client.query(
                'INSERT INTO custom_items (name) VALUES ($1) RETURNING id',
                [item.name]
            );
            const customItemId = itemRes.rows[0].id;

            for (const optionName of item.options) {
                const optionId = optionMap[optionName];
                 if (optionId) {
                    await client.query(
                        'INSERT INTO custom_item_options (custom_item_id, option_id) VALUES ($1, $2)',
                        [customItemId, optionId]
                   );
                 }
            }
        }

        await client.query('COMMIT');
        console.log('✅ Database seeded successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding database:', err);
        throw err;
    } finally {
        client.release();
    }
}

const runReset = async () => {
    try {
        await createTables();
        await seedTables();
        console.log('🚀 Database reset and seeding complete!');
    } catch (error) {
        console.error('❌ Fatal error during database reset. Halting script.');
    } finally {
        await pool.end(); 
    }
}

runReset();

