require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '5mb' }));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// Health
app.get('/health', (req, res) => res.json({ status: 'ok', server: 'SUVIDHA Govt Mock Server' }));

// POST /api/receive — receive a batch from the main backend
app.post('/api/receive', async (req, res) => {
    const { batchId, records } = req.body;
    if (!batchId || !Array.isArray(records)) {
        return res.status(400).json({ error: 'Invalid payload' });
    }
    try {
        for (const record of records) {
            await pool.query(
                `INSERT INTO govt_received_records (batch_id, transaction_id, kiosk_id, type, payload)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT DO NOTHING`,
                [batchId, record.transactionId || null, record.kioskId || null, record.type || 'unknown', JSON.stringify(record)]
            );
        }
        console.log(`[GOVT] ✅ Received batch ${batchId} — ${records.length} records`);
        res.json({ success: true, batchId, received: records.length });
    } catch (err) {
        console.error('[GOVT] ❌ Error:', err.message);
        res.status(500).json({ error: 'Failed to store records' });
    }
});

// GET /api/records — view all received records
app.get('/api/records', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, batch_id, transaction_id, kiosk_id, type, received_at
       FROM govt_received_records ORDER BY received_at DESC LIMIT 200`
        );
        res.json({ success: true, records: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 4001;
async function start() {
    try {
        await pool.query('SELECT 1');
        console.log('✅ Database connected');
    } catch (err) {
        console.error('❌ Database connection FAILED:', err.message);
    }
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ SUVIDHA Govt Mock Server running on port ${PORT}`);
    });
}
start();
