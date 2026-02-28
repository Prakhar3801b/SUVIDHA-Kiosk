import { useEffect } from 'react';
import api from './api';

const KIOSK_ID = import.meta.env.VITE_KIOSK_ID || 'KIOSK-1';
const KIOSK_NAME = import.meta.env.VITE_KIOSK_NAME || 'Main Kiosk';
const KIOSK_LOCATION = import.meta.env.VITE_KIOSK_LOCATION || 'Ground Floor';

export function useHeartbeat() {
    useEffect(() => {
        // Register on startup
        api.post('/kiosks/register', { kioskId: KIOSK_ID, name: KIOSK_NAME, location: KIOSK_LOCATION })
            .catch(e => console.warn('[HEARTBEAT] Register failed:', e.message));

        // Send heartbeat every 30s
        const interval = setInterval(() => {
            api.post('/kiosks/heartbeat', { kioskId: KIOSK_ID })
                .catch(e => console.warn('[HEARTBEAT] Failed:', e.message));
        }, 30000);

        return () => clearInterval(interval);
    }, []);
}
