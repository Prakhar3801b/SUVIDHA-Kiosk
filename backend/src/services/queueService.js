const pool = require('../db/pool');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BATCH_SIZE = parseInt(process.env.SYNC_BATCH_SIZE) || 10;
let pendingCount = 0;

/** Add a completed transaction to the sync queue */
async function enqueue(transactionId, payload) {
    await pool.query(
        `INSERT INTO sync_queue (transaction_id, payload) VALUES ($1,$2)`,
        [transactionId, JSON.stringify(payload)]
    );
    pendingCount++;
    console.log(`[QUEUE] Enqueued tx ${transactionId}. Pending: ${pendingCount}/${BATCH_SIZE}`);

    if (pendingCount >= BATCH_SIZE) {
        await flushQueue();
    }
}

/** Push all pending queue items to the govt mock server */
async function flushQueue() {
    const govtUrl = process.env.GOVT_SERVER_URL;
    if (!govtUrl) {
        console.warn('[QUEUE] GOVT_SERVER_URL not set, skipping flush.');
        return;
    }

    const client = await pool.connect();
    try {
        // Lock and fetch pending rows
        const res = await client.query(
            `SELECT * FROM sync_queue WHERE status='pending' ORDER BY created_at LIMIT 50`
        );
        if (res.rows.length === 0) {
            pendingCount = 0;
            return;
        }

        const batchId = uuidv4();
        const ids = res.rows.map(r => r.id);

        // Mark as syncing
        await client.query(
            `UPDATE sync_queue SET status='syncing', last_attempt=NOW() WHERE id=ANY($1)`, [ids]
        );

        // Push batch
        const batch = res.rows.map(r => ({ ...r.payload, queueId: r.id }));
        await axios.post(`${govtUrl}/api/receive`, { batchId, records: batch }, { timeout: 10000 });

        // Mark done
        await client.query(
            `UPDATE sync_queue SET status='done', pushed_at=NOW() WHERE id=ANY($1)`, [ids]
        );
        pendingCount = 0;
        console.log(`[QUEUE] ✅ Batch ${batchId} pushed (${ids.length} records)`);
    } catch (err) {
        console.error('[QUEUE] ❌ Flush failed:', err.message);
        // Mark failed + increment attempt
        await client.query(
            `UPDATE sync_queue SET status='failed', attempt_count=attempt_count+1
       WHERE id IN (SELECT id FROM sync_queue WHERE status='syncing')`
        );
        // Retry failed items on next batch
        const retryRes = await client.query(
            `UPDATE sync_queue SET status='pending' WHERE status='failed' AND attempt_count < 5 RETURNING id`
        );
        pendingCount = retryRes.rowCount;
    } finally {
        client.release();
    }
}

module.exports = { enqueue, flushQueue };
