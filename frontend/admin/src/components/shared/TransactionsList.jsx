import { useState, useEffect } from 'react';
import axios from 'axios';

export default function TransactionsList({ apiBase, adminKey }) {
    const [txns, setTxns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${apiBase}/api/admin/transactions`, { headers: { 'x-admin-key': adminKey } })
            .then(r => setTxns(r.data.transactions || []))
            .catch(e => console.error(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="empty"><span className="spinner" /></div>;

    return (
        <div className="card">
            <p className="card-title">All Completed Transactions ({txns.length})</p>
            {txns.length === 0 ? (
                <div className="empty">No completed transactions yet.</div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr><th>Type</th><th>Kiosk</th><th>Details</th><th>Amount/ID</th><th>Completed</th></tr>
                    </thead>
                    <tbody>
                        {txns.map(t => (
                            <tr key={t.id}>
                                <td>
                                    <span className={`badge ${t.type === 'bill_payment' ? 'badge-blue' : t.type === 'form' ? 'badge-green' : 'badge-yellow'}`}>
                                        {t.type === 'bill_payment' ? '💳 Bill' : t.type === 'form' ? '📋 Form' : '📣 Complaint'}
                                    </span>
                                </td>
                                <td><code style={{ fontSize: '0.8rem' }}>{t.kiosk_id}</code></td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    {t.consumer_name || t.applicant_name || 'N/A'}
                                    {t.bill_type && ` · ${t.bill_type.replace('_', ' ')}`}
                                    {t.service_type && ` · ${t.service_type.replace('_', ' ')}`}
                                    {t.department && ` · ${t.department}`}
                                </td>
                                <td>
                                    {t.amount && <strong style={{ color: 'var(--success)' }}>₹{parseFloat(t.amount).toLocaleString('en-IN')}</strong>}
                                    {t.application_id && <code style={{ color: 'var(--success)', fontSize: '0.8rem' }}>{t.application_id}</code>}
                                    {t.complaint_id && <code style={{ color: 'var(--warning)', fontSize: '0.8rem' }}>{t.complaint_id}</code>}
                                </td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    {t.completed_at ? new Date(t.completed_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
