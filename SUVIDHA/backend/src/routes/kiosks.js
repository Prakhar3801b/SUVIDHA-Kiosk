const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { broadcastToAdmin } = require('../websocket/wsHub');
const Joi = require('joi');

// POST /api/kiosks/register — called on every kiosk startup
router.post('/register', async (req, res, next) => {
    const schema = Joi.object({
        kioskId: Joi.string().required(),
        name: Joi.string().required(),
        location: Joi.string().required(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    try {
        await pool.query(
            `INSERT INTO kiosks (id, name, location, status, last_seen)
       VALUES ($1, $2, $3, 'online', NOW())
       ON CONFLICT (id) DO UPDATE SET status='online', last_seen=NOW(), name=$2, location=$3`,
            [value.kioskId, value.name, value.location]
        );

        broadcastToAdmin({
            type: 'kiosk_online',
            payload: { kioskId: value.kioskId, name: value.name, location: value.location }
        });

        console.log(`[KIOSK] Registered: ${value.kioskId} (${value.location})`);
        res.json({ success: true });
    } catch (err) { next(err); }
});

// POST /api/kiosks/heartbeat — called every 30s by kiosk
router.post('/heartbeat', async (req, res, next) => {
    const schema = Joi.object({ kioskId: Joi.string().required() });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    try {
        await pool.query(
            `UPDATE kiosks SET last_seen=NOW(), status='online' WHERE id=$1`,
            [value.kioskId]
        );
        res.json({ success: true });
    } catch (err) { next(err); }
});

// GET /api/kiosks/fleet — admin: all kiosks with current status
router.get('/fleet', async (req, res, next) => {
    try {
        // Mark kiosks offline if no heartbeat in 90s
        await pool.query(
            `UPDATE kiosks SET status='offline' WHERE last_seen < NOW() - INTERVAL '90 seconds' AND status='online'`
        );
        const result = await pool.query(`SELECT * FROM kiosks ORDER BY registered_at`);
        res.json({ success: true, kiosks: result.rows });
    } catch (err) { next(err); }
});

// Cleanup stale kiosks (called internally by a cron or on fleet fetch)
setInterval(async () => {
    try {
        const result = await pool.query(
            `UPDATE kiosks SET status='offline'
       WHERE last_seen < NOW() - INTERVAL '90 seconds' AND status='online'
       RETURNING id`
        );
        for (const row of result.rows) {
            broadcastToAdmin({ type: 'kiosk_offline', payload: { kioskId: row.id } });
            console.log(`[KIOSK] Marked offline: ${row.id}`);
        }
    } catch (e) { /* silently handle */ }
}, 30000); // check every 30s

module.exports = router;
