const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { broadcastToAdmin, sendToKiosk } = require('../websocket/wsHub');
const Joi = require('joi');

const SEVERITY_MAP = {
    PRINTER_OK: 'info', PAPER_LOW: 'warning', PAPER_OUT: 'critical',
    PRINTER_JAM: 'critical', PRINTER_OFFLINE: 'critical',
    SCANNER_OK: 'info', SCANNER_DISCONNECTED: 'critical',
};

// POST /api/diagnostics/event — kiosk reports a hardware event
router.post('/event', async (req, res, next) => {
    const schema = Joi.object({
        kioskId: Joi.string().required(),
        device: Joi.string().valid('printer', 'scanner').required(),
        eventCode: Joi.string().valid(...Object.keys(SEVERITY_MAP)).required(),
        message: Joi.string().max(200).optional(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const severity = SEVERITY_MAP[value.eventCode];
    try {
        await pool.query(
            `INSERT INTO machine_diagnostics (kiosk_id, device, event_code, severity, message)
       VALUES ($1,$2,$3,$4,$5)`,
            [value.kioskId, value.device, value.eventCode, severity, value.message || null]
        );

        // Broadcast to admin dashboard
        broadcastToAdmin({
            type: 'hardware_event',
            payload: { kioskId: value.kioskId, device: value.device, eventCode: value.eventCode, severity }
        });

        // If critical — also notify the kiosk itself so it can show a banner
        if (severity === 'critical') {
            sendToKiosk(value.kioskId, {
                type: 'hardware_critical',
                payload: { device: value.device, eventCode: value.eventCode }
            });
        }

        res.json({ success: true });
    } catch (err) { next(err); }
});

// GET /api/diagnostics/latest — latest diagnostic per kiosk per device
router.get('/latest', async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT DISTINCT ON (kiosk_id, device)
              kiosk_id, device, event_code, severity, message, created_at
       FROM machine_diagnostics
       ORDER BY kiosk_id, device, created_at DESC`
        );
        res.json({ success: true, diagnostics: result.rows });
    } catch (err) { next(err); }
});

module.exports = router;
