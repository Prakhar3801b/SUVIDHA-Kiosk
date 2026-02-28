const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { broadcastToAdmin, sendToKiosk } = require('../websocket/wsHub');
const { generateReceiptNo } = require('../services/receiptService');
const { enqueue } = require('../services/queueService');
const { encrypt } = require('../services/encryptionService');
const Joi = require('joi');

// ─── Mock bill lookup (replace with real dept API later) ─────────────
function mockBillLookup(billType, identifier) {
    const mockData = {
        electricity: { consumerName: 'Ramesh Kumar', amount: 1450, dueDate: '2026-03-05', billPeriod: 'Feb 2026' },
        gas: { consumerName: 'Sunita Devi', amount: 890, dueDate: '2026-03-10', billPeriod: 'Feb 2026' },
        property_tax: { consumerName: 'Mohan Lal', amount: 5200, dueDate: '2026-03-31', billPeriod: 'FY 2025-26' },
        other: { consumerName: 'Citizen', amount: 500, dueDate: '2026-03-15', billPeriod: 'Feb 2026' },
    };
    return mockData[billType] || mockData.other;
}

// POST /api/payments/lookup — fetch bill details by ID
router.post('/lookup', async (req, res, next) => {
    const schema = Joi.object({
        billType: Joi.string().valid('electricity', 'gas', 'property_tax', 'other').required(),
        identifier: Joi.string().min(3).max(50).required(),
        identifier2: Joi.string().max(50).optional(),
        kioskId: Joi.string().required(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const billData = mockBillLookup(value.billType, value.identifier);
    res.json({ success: true, bill: billData });
});

// POST /api/payments/initiate — create a transaction + bill record
router.post('/initiate', async (req, res, next) => {
    const schema = Joi.object({
        kioskId: Joi.string().required(),
        billType: Joi.string().valid('electricity', 'gas', 'property_tax', 'other').required(),
        identifier: Joi.string().min(3).max(50).required(),
        identifierType: Joi.string().required(),
        consumerName: Joi.string().required(),
        amount: Joi.number().positive().required(),
        paymentMethod: Joi.string().valid('upi', 'cash').required(),
        upiTxnId: Joi.string().optional(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Create master transaction
        const txResult = await client.query(
            `INSERT INTO transactions (kiosk_id, type, status) VALUES ($1, 'bill_payment', $2) RETURNING id`,
            [value.kioskId, value.paymentMethod === 'cash' ? 'pending_cash' : 'in_progress']
        );
        const transactionId = txResult.rows[0].id;

        let receiptNo = null;
        if (value.paymentMethod === 'cash') {
            receiptNo = await generateReceiptNo(client);
        }

        const encryptedUpi = value.upiTxnId ? encrypt(value.upiTxnId) : null;

        const bpResult = await client.query(
            `INSERT INTO bill_payments
        (transaction_id, bill_type, identifier, identifier_type, consumer_name, amount, payment_method, upi_txn_id, receipt_no)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
            [transactionId, value.billType, value.identifier, value.identifierType,
                value.consumerName, value.amount, value.paymentMethod, encryptedUpi, receiptNo]
        );

        if (value.paymentMethod === 'cash') {
            await client.query(
                `INSERT INTO physical_payment_approvals (receipt_no, bill_payment_id, kiosk_id, status)
         VALUES ($1,$2,$3,'pending')`,
                [receiptNo, bpResult.rows[0].id, value.kioskId]
            );
        }

        await client.query('COMMIT');

        // Notify admin of new entry
        broadcastToAdmin({
            type: 'new_transaction',
            payload: {
                transactionId, kioskId: value.kioskId, billType: value.billType,
                amount: value.amount, paymentMethod: value.paymentMethod, receiptNo
            }
        });

        // If UPI — mark complete and enqueue for sync
        if (value.paymentMethod === 'upi') {
            await completeAndEnqueue(transactionId, value.kioskId, value.billType, value.amount);
        }

        res.json({ success: true, transactionId, receiptNo });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
});

async function completeAndEnqueue(transactionId, kioskId, billType, amount) {
    await pool.query(
        `UPDATE transactions SET status='completed', completed_at=NOW() WHERE id=$1`, [transactionId]
    );
    await enqueue(transactionId, { transactionId, kioskId, type: 'bill_payment', billType, amount });
    broadcastToAdmin({ type: 'transaction_completed', payload: { transactionId, kioskId } });
}

module.exports = router;
module.exports.completeAndEnqueue = completeAndEnqueue;
