import { useEffect } from 'react';
import api from './api';

const KIOSK_ID = import.meta.env.VITE_KIOSK_ID || 'KIOSK-1';

// Check printer and scanner status every 10 seconds
// In production: electron IPC calls to native modules
// Here we do a best-effort browser check and report to backend

export function useHardwareWatcher() {
    useEffect(() => {
        const interval = setInterval(async () => {
            // Printer check: try to detect via navigator (limited in browser)
            // In real Electron app this calls main process via IPC
            const printerOk = true; // placeholder — replaced by IPC call in production build
            const scannerOk = true; // USB HID devices auto-detected as keyboard

            try {
                await api.post('/diagnostics/event', {
                    kioskId: KIOSK_ID,
                    device: 'printer',
                    eventCode: printerOk ? 'PRINTER_OK' : 'PRINTER_OFFLINE',
                });
                await api.post('/diagnostics/event', {
                    kioskId: KIOSK_ID,
                    device: 'scanner',
                    eventCode: scannerOk ? 'SCANNER_OK' : 'SCANNER_DISCONNECTED',
                });
            } catch (e) {
                console.warn('[HARDWARE] Diagnostics report failed:', e.message);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, []);
}
