const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { broadcastToAdmin } = require('../websocket/wsHub');
const { enqueue } = require('../services/queueService');
const Joi = require('joi');

// POST /api/complaints/register
router.post('/register', async (req, res, next) => {
    const schema = Joi.object({
        kioskId: Joi.string().required(),
        mobileNo: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
        department: Joi.string().valid('electricity', 'gas', 'water', 'sanitation', 'roads', 'ration', 'other').required(),
        description: Joi.string().min(10).max(2000).required(),
        inputMethod: Joi.string().valid('keyboard', 'voice').default('keyboard'),
    });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const txResult = await client.query(
            `INSERT INTO transactions (kiosk_id, type, status) VALUES ($1,'complaint','completed') RETURNING id`,
            [value.kioskId]
        );
        const transactionId = txResult.rows[0].id;

        // Generate complaint ID
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const countRes = await client.query(
            `SELECT COUNT(*) FROM complaints WHERE created_at::date = CURRENT_DATE`
        );
        const seq = String(parseInt(countRes.rows[0].count) + 1).padStart(3, '0');
        const complaintId = `GRV-${today}-${seq}`;

        await client.query(
            `INSERT INTO complaints (transaction_id, complaint_id, mobile_no, department, description, input_method)
       VALUES ($1,$2,$3,$4,$5,$6)`,
            [transactionId, complaintId, value.mobileNo, value.department, value.description, value.inputMethod]
        );

        await client.query(`UPDATE transactions SET completed_at=NOW() WHERE id=$1`, [transactionId]);
        await client.query('COMMIT');

        await enqueue(transactionId, { transactionId, kioskId: value.kioskId, type: 'complaint', department: value.department });

        broadcastToAdmin({
            type: 'new_complaint',
            payload: { transactionId, kioskId: value.kioskId, department: value.department, complaintId }
        });

        res.json({ success: true, complaintId });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
});

// GET /api/complaints/list
router.get('/list', async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT c.*, t.kiosk_id FROM complaints c
       JOIN transactions t ON c.transaction_id = t.id
       ORDER BY c.created_at DESC LIMIT 100`
        );
        res.json({ success: true, complaints: result.rows });
    } catch (err) { next(err); }
});

module.exports = router;
