import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import api from '../../services/api';

export default function BillDetailScreen() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const billType = state?.billType;

    const [identifier, setIdentifier] = useState('');
    const [identifier2, setIdentifier2] = useState('');
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!billType) { navigate('/pay'); return null; }

    const handleFetch = async () => {
        if (!identifier.trim()) return setError('Please enter the required ID / कृपया आईडी दर्ज करें');
        setLoading(true); setError('');
        try {
            const res = await api.post('/payments/lookup', {
                billType: billType.id,
                identifier: identifier.trim(),
                identifier2: identifier2.trim() || undefined,
                kioskId: import.meta.env.VITE_KIOSK_ID || 'KIOSK-1',
            });
            setBill(res.data.bill);
        } catch (e) {
            setError(e.response?.data?.error || 'Failed to fetch bill. Try again.');
        } finally { setLoading(false); }
    };

    return (
        <div className="screen">
            <header className="header">
                <button className="btn btn-secondary" onClick={() => navigate('/pay')}>← Back</button>
                <span className="header-logo">{billType.icon} {billType.label}</span>
                <span />
            </header>
            <div className="content fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
                {!bill ? (
                    <div className="card" style={{ marginTop: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Enter your {billType.field}</h2>
                        <p className="hindi" style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            अपना {billType.fieldHi} दर्ज करें
                        </p>
                        <input
                            className="input"
                            placeholder={`${billType.field} / ${billType.fieldHi}`}
                            value={identifier}
                            onChange={e => setIdentifier(e.target.value)}
                            style={{ marginBottom: '1rem' }}
                        />
                        {billType.id === 'gas' && (
                            <>
                                <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0' }}>Mobile Number / मोबाइल नंबर</p>
                                <input
                                    className="input"
                                    placeholder="10-digit mobile number"
                                    value={identifier2}
                                    onChange={e => setIdentifier2(e.target.value)}
                                    style={{ marginBottom: '1rem' }}
                                />
                            </>
                        )}
                        {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}
                        <button className="btn btn-primary btn-large" onClick={handleFetch} disabled={loading}>
                            {loading ? <span className="spinner" /> : 'Fetch Bill / बिल देखें'}
                        </button>
                    </div>
                ) : (
                    <div className="card fade-in" style={{ marginTop: '2rem' }}>
                        <h2 style={{ marginBottom: '1rem' }}>Bill Details / बिल विवरण</h2>
                        <div className="divider" />
                        <div style={{ display: 'grid', gap: '0.8rem' }}>
                            <Row label="Consumer Name" value={bill.consumerName} />
                            <Row label="Bill Period" value={bill.billPeriod} />
                            <Row label="Due Date" value={bill.dueDate} />
                            <Row label="Amount Due" value={<span className="amount">₹{bill.amount.toLocaleString('en-IN')}</span>} />
                        </div>
                        <div className="divider" />
                        <button
                            className="btn btn-primary btn-large"
                            style={{ width: '100%' }}
                            onClick={() => navigate('/pay/method', { state: { billType, bill, identifier } })}
                        >
                            Proceed to Pay / भुगतान करें →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontWeight: 600 }}>{value}</span>
        </div>
    );
}
