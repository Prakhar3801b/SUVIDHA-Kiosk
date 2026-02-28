import { useState, useEffect } from 'react';
import axios from 'axios';

export default function KioskFleet({ apiBase, adminKey, wsEvents }) {
    const [kiosks, setKiosks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFleet = async () => {
        try {
            const res = await axios.get(`${apiBase}/api/kiosks/fleet`, { headers: { 'x-admin-key': adminKey } });
            setKiosks(res.data.kiosks || []);
        } catch (e) { console.error('Fleet fetch error', e.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchFleet(); }, []);

    // Update fleet on WS events
    useEffect(() => {
        const last = wsEvents[0];
        if (!last) return;
        if (last.type === 'kiosk_online') {
            setKiosks(prev => {
                const exists = prev.find(k => k.id === last.payload.kioskId);
                if (exists) return prev.map(k => k.id === last.payload.kioskId ? { ...k, status: 'online' } : k);
                return [...prev, { id: last.payload.kioskId, name: last.payload.name, location: last.payload.location, status: 'online' }];
            });
        }
        if (last.type === 'kiosk_offline') {
            setKiosks(prev => prev.map(k => k.id === last.payload.kioskId ? { ...k, status: 'offline' } : k));
        }
    }, [wsEvents]);

    if (loading) return <div className="empty"><span className="spinner" /></div>;

    return (
        <div>
            <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
                <StatCard value={kiosks.length} label="Total Kiosks" color="var(--text-primary)" />
                <StatCard value={kiosks.filter(k => k.status === 'online').length} label="Online" color="var(--success)" />
                <StatCard value={kiosks.filter(k => k.status === 'offline').length} label="Offline" color="var(--danger)" />
                <StatCard value={kiosks.length > 0 ? Math.round((kiosks.filter(k => k.status === 'online').length / kiosks.length) * 100) + '%' : '—'} label="Uptime" color="var(--accent)" />
            </div>

            {kiosks.length === 0 ? (
                <div className="empty">No kiosks registered yet. Start a kiosk to register it.</div>
            ) : (
                <div className="card">
                    <p className="card-title">Kiosk Fleet Status</p>
                    <table className="data-table">
                        <thead><tr>
                            <th>Status</th><th>Kiosk ID</th><th>Name</th><th>Location</th><th>Last Seen</th>
                        </tr></thead>
                        <tbody>
                            {kiosks.map(k => (
                                <tr key={k.id}>
                                    <td>
                                        <span className={`status-dot ${k.status === 'online' ? 'dot-green' : 'dot-red'}`} style={{ marginRight: 6 }} />
                                        <span className={`badge ${k.status === 'online' ? 'badge-green' : 'badge-red'}`}>
                                            {k.status === 'online' ? 'Online' : 'Offline'}
                                        </span>
                                    </td>
                                    <td><code style={{ fontFamily: 'monospace' }}>{k.id}</code></td>
                                    <td>{k.name}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{k.location}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        {k.last_seen ? new Date(k.last_seen).toLocaleTimeString('en-IN') : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function StatCard({ value, label, color }) {
    return (
        <div className="card stat-card">
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
        </div>
    );
}
