const WebSocket = require('ws');
let wss;
const clients = new Map(); // clientId -> { ws, type: 'kiosk'|'admin', kioskId }

function setupWebSocket(server) {
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
        const params = new URLSearchParams(req.url.replace('/?', ''));
        const clientType = params.get('type') || 'unknown';
        const kioskId = params.get('kioskId') || null;
        const clientId = `${clientType}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        clients.set(clientId, { ws, type: clientType, kioskId });
        console.log(`[WS] Connected: ${clientType} ${kioskId || ''} (${clientId})`);

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                handleMessage(clientId, msg);
            } catch (e) {
                console.error('[WS] Bad message:', e.message);
            }
        });

        ws.on('close', () => {
            clients.delete(clientId);
            console.log(`[WS] Disconnected: ${clientId}`);
        });

        ws.on('error', (err) => console.error('[WS] Error:', err.message));

        // Send welcome
        send(ws, { type: 'connected', clientId });
    });
}

function handleMessage(clientId, msg) {
    // Kiosk sends heartbeat pings — just acknowledge
    if (msg.type === 'ping') {
        const client = clients.get(clientId);
        if (client) send(client.ws, { type: 'pong' });
    }
}

/** Send to a specific kiosk by kioskId */
function sendToKiosk(kioskId, payload) {
    for (const [, client] of clients) {
        if (client.type === 'kiosk' && client.kioskId === kioskId && client.ws.readyState === WebSocket.OPEN) {
            send(client.ws, payload);
        }
    }
}

/** Broadcast to all connected admin dashboards */
function broadcastToAdmin(payload) {
    for (const [, client] of clients) {
        if (client.type === 'admin' && client.ws.readyState === WebSocket.OPEN) {
            send(client.ws, payload);
        }
    }
}

/** Broadcast to everyone */
function broadcast(payload) {
    for (const [, client] of clients) {
        if (client.ws.readyState === WebSocket.OPEN) {
            send(client.ws, payload);
        }
    }
}

function send(ws, payload) {
    try {
        ws.send(JSON.stringify(payload));
    } catch (e) {
        console.error('[WS] Send error:', e.message);
    }
}

module.exports = { setupWebSocket, broadcastToAdmin, sendToKiosk, broadcast };
