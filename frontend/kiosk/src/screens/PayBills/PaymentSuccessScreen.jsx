import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function PaymentSuccessScreen() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { method, receiptNo, bill, billType, upiTxnId } = state || {};

    // Auto-return to home after 10s
    useEffect(() => {
        const t = setTimeout(() => navigate('/'), 10000);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className="card fade-in" style={{ maxWidth: 600, width: '90%', textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                    {method === 'upi' ? '✅' : '🖨'}
                </div>

                {method === 'upi' ? (
                    <>
                        <h2 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Payment Successful!</h2>
                        <p className="hindi" style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            भुगतान सफल हुआ!
                        </p>
                        <div className="divider" />
                        <Row label="Bill Type" value={billType?.label} />
                        <Row label="Paid Amount" value={<span style={{ color: 'var(--success)' }}>₹{bill?.amount?.toLocaleString('en-IN')}</span>} />
                        <Row label="UPI Txn ID" value={upiTxnId} />
                    </>
                ) : (
                    <>
                        <h2 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>Receipt Generated!</h2>
                        <p className="hindi" style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>रसीद तैयार है!</p>
                        <div className="divider" />
                        <Row label="Receipt No." value={<span style={{ color: 'var(--accent)', fontFamily: 'monospace', fontSize: '1.2rem' }}>{receiptNo}</span>} />
                        <Row label="Amount" value={`₹${bill?.amount?.toLocaleString('en-IN')}`} />
                        <div style={{ margin: '1.5rem 0', padding: '1rem', background: 'rgba(245,158,11,0.1)', borderRadius: 'var(--radius-sm)' }}>
                            <p style={{ color: 'var(--accent)', fontWeight: 600 }}>Take this receipt to the cash counter</p>
                            <p className="hindi" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                                यह रसीद काउंटर पर ले जाएं और नकद भुगतान करें
                            </p>
                        </div>
                    </>
                )}

                <div className="divider" />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Returning to home in 10 seconds... | होम पर वापस जा रहे हैं...
                </p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>
                    🏠 Return to Home / होम पर वापस
                </button>
            </div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontWeight: 600 }}>{value}</span>
        </div>
    );
}
