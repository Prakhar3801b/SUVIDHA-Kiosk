const pool = require('../db/pool');

/**
 * Generate a unique daily receipt number like RCP-20260225-007
 * Counter resets every calendar day.
 */
async function generateReceiptNo(client) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const dateStr = today.replace(/-/g, '');

    // Upsert counter
    const res = await client.query(
        `INSERT INTO daily_receipt_counter (date, counter)
     VALUES ($1, 1)
     ON CONFLICT (date) DO UPDATE SET counter = daily_receipt_counter.counter + 1
     RETURNING counter`,
        [today]
    );

    const counter = String(res.rows[0].counter).padStart(3, '0');
    return `RCP-${dateStr}-${counter}`;
}

module.exports = { generateReceiptNo };
