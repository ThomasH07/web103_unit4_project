import { pool } from '../config/database.js';

const getAllFeatures = async (req, res) => {
    const query = `
        SELECT 
            f.id, 
            f.name,
            json_agg(
                json_build_object(
                    'id', fo.id,
                    'name', fo.name,
                    'price_in_cents', fo.price_in_cents,
                    'image', fo.image
                ) ORDER BY fo.id
            ) as options
        FROM 
            features f
        LEFT JOIN 
            feature_options fo ON f.id = fo.feature_id
        GROUP BY 
            f.id
        ORDER BY
            f.id;
    `;
    try {
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error in getAllFeatures controller:', error);
        res.status(500).json({ error: 'An internal server error occurred while fetching features.' });
    }
};

const getCustomCarById = async (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT
            ci.id,
            ci.name,
            ci.created_at,
            json_agg(
                json_build_object(
                    'id', fo.id,
                    'name', fo.name,
                    'price_in_cents', fo.price_in_cents,
                    'feature_id', f.id,
                    'feature_name', f.name,
                    'image', fo.image
                )
            ) as options
        FROM
            custom_items ci
        LEFT JOIN
            custom_item_options cio ON ci.id = cio.custom_item_id
        LEFT JOIN
            feature_options fo ON cio.option_id = fo.id
        LEFT JOIN
            features f ON fo.feature_id = f.id
        WHERE
            ci.id = $1
        GROUP BY
            ci.id, ci.name, ci.created_at;
    `;
    try {
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: `Custom item with ID ${id} not found.` });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(`Error in getCustomCarById controller for id ${id}:`, error);
        res.status(500).json({ error: 'An internal server error occurred while fetching the item.' });
    }
};

/**
 * Creates a new custom car using your improved logic.
 */
const createCustomCar = async (req, res) => {
    const { name, optionIds } = req.body;

    if (!name || !optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
        return res.status(400).json({ 
            error: 'Bad Request: Please provide a "name" and a non-empty array of "optionIds".' 
        });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const createItemQuery = `
            INSERT INTO custom_items (name)
            VALUES ($1)
            RETURNING id;
        `;
        const itemResult = await client.query(createItemQuery, [name]);
        const newItemId = itemResult.rows[0].id;

        const insertOptionsPromises = optionIds.map(optionId => {
            const insertOptionQuery = `
                INSERT INTO custom_item_options (custom_item_id, option_id)
                VALUES ($1, $2);
            `;
            return client.query(insertOptionQuery, [newItemId, parseInt(optionId, 10)]);
        });

        await Promise.all(insertOptionsPromises);
        await client.query('COMMIT');

        res.status(201).json({
            message: 'Custom item created successfully!',
            data: { id: newItemId, name: name, optionIds: optionIds }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in createCustomCar controller:', error);
        res.status(500).json({ error: 'An internal server error occurred while creating the item.' });
    } finally {
        client.release();
    }
};

const getAllCustomCars = async (req, res) => {
    try {
        const query = `
            SELECT
                ci.id,
                ci.name,
                ci.created_at,
                json_agg(
                    json_build_object(
                        'id', fo.id,
                        'name', fo.name,
                        'price_in_cents', fo.price_in_cents,
                        'feature', f.name,
                        'image', fo.image
                    )
                ) as options
            FROM
                custom_items ci
            LEFT JOIN
                custom_item_options cio ON ci.id = cio.custom_item_id
            LEFT JOIN
                feature_options fo ON cio.option_id = fo.id
            LEFT JOIN
                features f ON fo.feature_id = f.id
            GROUP BY
                ci.id, ci.name, ci.created_at
            ORDER BY
                ci.created_at DESC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error in getAllCustomCars controller:', error);
        res.status(500).json({ error: 'An internal server error occurred while fetching items.' });
    }
};

const updateCustomCar = async (req, res) => {
    const { id } = req.params;
    const { name, optionIds } = req.body;

    if (!name || !optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
        return res.status(400).json({ 
            error: 'Bad Request: Please provide a "name" and a non-empty array of "optionIds".' 
        });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const updateResult = await client.query('UPDATE custom_items SET name = $1 WHERE id = $2 RETURNING id', [name, id]);

        if (updateResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: `Custom item with ID ${id} not found.` });
        }

        await client.query('DELETE FROM custom_item_options WHERE custom_item_id = $1', [id]);
        
        const insertOptionsPromises = optionIds.map(optionId => {
            const insertOptionQuery = `
                INSERT INTO custom_item_options (custom_item_id, option_id)
                VALUES ($1, $2);
            `;
            return client.query(insertOptionQuery, [id, parseInt(optionId, 10)]);
        });
        await Promise.all(insertOptionsPromises);

        await client.query('COMMIT');

        res.status(200).json({
            message: `Custom item ${id} updated successfully!`,
            data: { id: parseInt(id), name, optionIds }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in updateCustomCar controller:', error);
        res.status(500).json({ error: 'An internal server error occurred while updating the item.' });
    } finally {
        client.release();
    }
};

const deleteCustomCar = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM custom_items WHERE id = $1 RETURNING id', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: `Custom item with ID ${id} not found.` });
        }

        res.status(200).json({ message: `Custom item ${id} deleted successfully.` });
    } catch (error) {
        console.error('Error in deleteCar controller:', error);
        res.status(500).json({ error: 'An internal server error occurred while deleting the item.' });
    }
};

export default {
    getAllFeatures,
    getCustomCarById,
    createCustomCar,
    getAllCustomCars,
    updateCustomCar,
    deleteCustomCar
};

