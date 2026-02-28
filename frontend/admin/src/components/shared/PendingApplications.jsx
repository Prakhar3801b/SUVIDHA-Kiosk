import { useState, useEffect } from 'react';
import axios from 'axios';

export default function PendingApplications({ apiBase, adminKey }) {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${apiBase}/api/admin/pending`, { headers: { 'x-admin-key': adminKey } })
            .then(r => setApps(r.data.applications || []))
            .catch(e => console.error(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="empty"><span className="spinner" /></div>;

    return (
        <div className="card">
            <p className="card-title">Pending Applications ({apps.length})</p>
            {apps.length === 0 ? (
                <div className="empty">No pending applications.</div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr><th>Application ID</th><th>Service</th><th>Applicant</th><th>Mobile</th><th>Kiosk</th><th>Submitted</th></tr>
                    </thead>
                    <tbody>
                        {apps.map(a => (
                            <tr key={a.id}>
                                <td><code style={{ color: 'var(--success)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{a.application_id}</code></td>
                                <td><span className="badge badge-blue">{a.service_type?.replace(/_/g, ' ')}</span></td>
                                <td style={{ fontWeight: 600 }}>{a.applicant_name}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{a.mobile_no}</td>
                                <td><code style={{ fontSize: '0.8rem' }}>{a.kiosk_id}</code></td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    {new Date(a.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
