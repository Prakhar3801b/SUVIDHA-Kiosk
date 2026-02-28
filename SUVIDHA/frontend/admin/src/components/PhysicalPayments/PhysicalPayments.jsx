import { useState, useEffect } from 'react';
import axios from 'axios';

export default function PhysicalPayments({ apiBase, adminKey }) {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(null);

    const fetch = async () => {
        try {
            const res = await axios.get(`${apiBase}/api/admin/physical-payments`, { headers: { 'x-admin-key': adminKey } });
            setPayments(res.data.payments || []);
        } catch (e) { console.error('Physical payments error', e.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); const t = setInterval(fetch, 15000); return () => clearInterval(t); }, []);

    const approve = async (receiptNo) => {
        setApproving(receiptNo);
        try {
            await axios.post(`${apiBase}/api/admin/approve-payment`, { receiptNo }, { headers: { 'x-admin-key': adminKey } });
            setPayments(prev => prev.filter(p => p.receipt_no !== receiptNo));
        } catch (e) { alert(`Approval failed: ${e.response?.data?.error || e.message}`); }
        finally { setApproving(null); }
    };

    if (loading) return <div className="empty"><span className="spinner" /></div>;

    return (
        <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
                <p className="card-title">Pending Cash Payments — {payments.length} awaiting approval</p>
            </div>

            {payments.length === 0 ? (
                <div className="empty">No pending cash payments. Auto-refreshes every 15 seconds.</div>
            ) : (
                payments.map(p => (
                    <div key={p.id} className="card fade-in" style={{ marginBottom: '0.8rem', display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem' }}>
                            <Field label="Receipt No." value={<code style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{p.receipt_no}</code>} />
                            <Field label="Consumer" value={p.consumer_name} />
                            <Field label="Bill Type" value={p.bill_type?.replace('_', ' ')} />
                            <Field label="Amount" value={<strong style={{ color: 'var(--success)', fontSize: '1.1rem' }}>₹{parseFloat(p.amount).toLocaleString('en-IN')}</strong>} />
                        </div>
                        <button className="btn btn-success" onClick={() => approve(p.receipt_no)} disabled={approving === p.receipt_no}>
                            {approving === p.receipt_no ? <span className="spinner" /> : '✅ Approve'}
                        </button>
                    </div>
                ))
            )}
        </div>
    );
}

function Field({ label, value }) {
    return (
        <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{label}</div>
            <div style={{ fontSize: '0.9rem' }}>{value}</div>
        </div>
    );
}
