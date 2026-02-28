import { useState, useEffect } from 'react';
import axios from 'axios';

const SEVERITY_BADGE = {
    info: 'badge-green',
    warning: 'badge-yellow',
    critical: 'badge-red',
};

const DEVICE_ICON = { printer: '🖨', scanner: '📷' };

export default function Maintenance({ apiBase, adminKey, wsEvents }) {
    const [diagnostics, setDiagnostics] = useState([]);

    const fetchDiagnostics = async () => {
        try {
            const res = await axios.get(`${apiBase}/api/diagnostics/latest`);
            setDiagnostics(res.data.diagnostics || []);
        } catch (e) { console.error('Diagnostics error', e.message); }
    };

    useEffect(() => { fetchDiagnostics(); const t = setInterval(fetchDiagnostics, 10000); return () => clearInterval(t); }, []);

    // Live update on hardware events
    useEffect(() => {
        const last = wsEvents[0];
        if (!last || last.type !== 'hardware_event') return;
        const { kioskId, device, eventCode, severity } = last.payload;
        setDiagnostics(prev => {
            const others = prev.filter(d => !(d.kiosk_id === kioskId && d.device === device));
            return [{ kiosk_id: kioskId, device, event_code: eventCode, severity, created_at: new Date().toISOString() }, ...others];
        });
    }, [wsEvents]);

    // Group by kiosk
    const byKiosk = diagnostics.reduce((acc, d) => {
        if (!acc[d.kiosk_id]) acc[d.kiosk_id] = [];
        acc[d.kiosk_id].push(d);
        return acc;
    }, {});

    return (
        <div>
            {Object.keys(byKiosk).length === 0 ? (
                <div className="empty">No diagnostics received yet. Diagnostics auto-refresh every 10 seconds.</div>
            ) : (
                Object.entries(byKiosk).map(([kioskId, events]) => (
                    <div key={kioskId} className="card" style={{ marginBottom: '1rem' }}>
                        <p className="card-title">🖥 {kioskId}</p>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {events.map((ev, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-hover)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                                    <span style={{ fontSize: '1.2rem' }}>{DEVICE_ICON[ev.device] || '🔧'}</span>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{ev.device}</div>
                                        <span className={`badge ${SEVERITY_BADGE[ev.severity] || 'badge-blue'}`}>{ev.event_code}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>
                                        {new Date(ev.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
