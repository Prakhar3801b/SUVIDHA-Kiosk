const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { broadcastToAdmin, sendToKiosk } = require('../websocket/wsHub');
const { enqueue } = require('../services/queueService');
const Joi = require('joi');

// Middleware: simple admin API key check
function requireAdminKey(req, res, next) {
    const key = req.headers['x-admin-key'];
    if (!key || key !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// GET /api/admin/transactions — all completed transactions
router.get('/transactions', requireAdminKey, async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT t.*, 
              bp.bill_type, bp.amount, bp.payment_method, bp.receipt_no, bp.consumer_name,
              fa.service_type, fa.application_id, fa.applicant_name,
              c.complaint_id, c.department
       FROM transactions t
       LEFT JOIN bill_payments bp ON bp.transaction_id = t.id
       LEFT JOIN form_applications fa ON fa.transaction_id = t.id
       LEFT JOIN complaints c ON c.transaction_id = t.id
       WHERE t.status = 'completed'
       ORDER BY t.completed_at DESC LIMIT 200`
        );
        res.json({ success: true, transactions: result.rows });
    } catch (err) { next(err); }
});

// GET /api/admin/pending — pending applications (forms not yet processed)
router.get('/pending', requireAdminKey, async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT fa.*, t.kiosk_id, t.created_at as txn_date
       FROM form_applications fa
       JOIN transactions t ON fa.transaction_id = t.id
       WHERE fa.status = 'submitted'
       ORDER BY fa.created_at DESC`
        );
        res.json({ success: true, applications: result.rows });
    } catch (err) { next(err); }
});

// GET /api/admin/physical-payments — pending cash approvals
router.get('/physical-payments', requireAdminKey, async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT ppa.*, bp.bill_type, bp.amount, bp.consumer_name, bp.identifier
       FROM physical_payment_approvals ppa
       JOIN bill_payments bp ON ppa.bill_payment_id = bp.id
       WHERE ppa.status = 'pending'
       ORDER BY ppa.created_at DESC`
        );
        res.json({ success: true, payments: result.rows });
    } catch (err) { next(err); }
});

// POST /api/admin/approve-payment — admin approves a cash payment
router.post('/approve-payment', requireAdminKey, async (req, res, next) => {
    const schema = Joi.object({
        receiptNo: Joi.string().required(),
        adminNote: Joi.string().optional().allow(''),
    });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Get approval record
        const approvalRes = await client.query(
            `SELECT ppa.*, bp.transaction_id, ppa.kiosk_id as kiosk
       FROM physical_payment_approvals ppa
       JOIN bill_payments bp ON ppa.bill_payment_id = bp.id
       WHERE ppa.receipt_no = $1 AND ppa.status = 'pending'`,
            [value.receiptNo]
        );
        if (approvalRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Receipt not found or already processed' });
        }
        const approval = approvalRes.rows[0];

        // Update approval
        await client.query(
            `UPDATE physical_payment_approvals SET status='approved', admin_note=$1, approved_at=NOW() WHERE receipt_no=$2`,
            [value.adminNote || '', value.receiptNo]
        );

        // Mark transaction complete
        await client.query(
            `UPDATE transactions SET status='completed', completed_at=NOW() WHERE id=$1`,
            [approval.transaction_id]
        );

        await client.query('COMMIT');

        // Enqueue for govt sync
        await enqueue(approval.transaction_id, {
            transactionId: approval.transaction_id,
            kioskId: approval.kiosk,
            type: 'bill_payment',
            receiptNo: value.receiptNo,
        });

        // Notify kiosk that payment was approved
        sendToKiosk(approval.kiosk, {
            type: 'payment_approved',
            payload: { receiptNo: value.receiptNo, transactionId: approval.transaction_id }
        });

        // Notify all admins
        broadcastToAdmin({
            type: 'payment_approved',
            payload: { receiptNo: value.receiptNo, transactionId: approval.transaction_id }
        });

        res.json({ success: true, message: 'Payment approved' });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
});

module.exports = router;
