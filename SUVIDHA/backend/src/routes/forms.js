const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { broadcastToAdmin } = require('../websocket/wsHub');
const { enqueue } = require('../services/queueService');
const Joi = require('joi');

// POST /api/forms/submit
router.post('/submit', async (req, res, next) => {
    const schema = Joi.object({
        kioskId: Joi.string().required(),
        serviceType: Joi.string().valid(
            'gas_connection', 'driving_test', 'property_registry',
            'health_scheme', 'scholarship', 'other'
        ).required(),
        applicantName: Joi.string().min(2).max(100).required(),
        mobileNo: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
        aadhaarNo: Joi.string().length(12).optional(),
        formData: Joi.object().optional(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const txResult = await client.query(
            `INSERT INTO transactions (kiosk_id, type, status) VALUES ($1,'form','completed') RETURNING id`,
            [value.kioskId]
        );
        const transactionId = txResult.rows[0].id;

        // Generate application ID
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const countRes = await client.query(
            `SELECT COUNT(*) FROM form_applications WHERE created_at::date = CURRENT_DATE`
        );
        const seq = String(parseInt(countRes.rows[0].count) + 1).padStart(3, '0');
        const prefix = value.serviceType.slice(0, 3).toUpperCase();
        const applicationId = `APP-${prefix}-${today}-${seq}`;

        await client.query(
            `INSERT INTO form_applications
        (transaction_id, service_type, application_id, applicant_name, aadhaar_no, mobile_no, form_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [transactionId, value.serviceType, applicationId, value.applicantName,
                value.aadhaarNo || null, value.mobileNo, JSON.stringify(value.formData || {})]
        );

        await client.query(
            `UPDATE transactions SET completed_at=NOW() WHERE id=$1`, [transactionId]
        );
        await client.query('COMMIT');

        await enqueue(transactionId, { transactionId, kioskId: value.kioskId, type: 'form', serviceType: value.serviceType });

        broadcastToAdmin({
            type: 'new_application',
            payload: { transactionId, kioskId: value.kioskId, serviceType: value.serviceType, applicationId }
        });

        res.json({ success: true, applicationId });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
});

// GET /api/forms/list (for admin)
router.get('/list', async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT fa.*, t.kiosk_id, t.created_at as txn_created
       FROM form_applications fa JOIN transactions t ON fa.transaction_id = t.id
       ORDER BY fa.created_at DESC LIMIT 100`
        );
        res.json({ success: true, applications: result.rows });
    } catch (err) { next(err); }
});

module.exports = router;
