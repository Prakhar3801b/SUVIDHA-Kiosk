import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import api from '../../services/api';

const KIOSK_ID = import.meta.env.VITE_KIOSK_ID || 'KIOSK-1';

// Mock UPI ID for the kiosk
const KIOSK_UPI_ID = 'suvidha.kiosk@upi';

export default function PaymentMethodScreen() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { billType, bill, identifier } = state || {};

    const [method, setMethod] = useState(null); // 'upi' | 'cash'
    const [upiTxnId, setUpiTxnId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!bill) { navigate('/pay'); return null; }

    const handlePay = async () => {
        if (method === 'upi' && !upiTxnId.trim()) {
            return setError('Please enter the UPI Transaction ID / UPI ट्रांजेक्शन ID दर्ज करें');
        }
        setLoading(true); setError('');
        try {
            const res = await api.post('/payments/initiate', {
                kioskId: KIOSK_ID,
                billType: billType.id,
                identifier: identifier,
                identifierType: billType.id,
                consumerName: bill.consumerName,
                amount: bill.amount,
                paymentMethod: method,
                upiTxnId: method === 'upi' ? upiTxnId : undefined,
            });
            navigate('/pay/success', { state: { method, receiptNo: res.data.receiptNo, bill, billType, upiTxnId } });
        } catch (e) {
            setError(e.response?.data?.error || 'Payment failed. Try again.');
        } finally { setLoading(false); }
    };

    // Simple QR placeholder (real app: use qrcode.react library)
    const upiUrl = `upi://pay?pa=${KIOSK_UPI_ID}&pn=SUVIDHA+Kiosk&am=${bill.amount}&tn=${billType.id}`;

    return (
        <div className="screen">
            <header className="header">
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
                <span className="header-logo">₹ Pay ₹{bill.amount.toLocaleString('en-IN')}</span>
                <span />
            </header>
            <div className="content fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
                {!method && (
                    <>
                        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            Choose Payment Method &nbsp;|&nbsp; <span className="hindi">भुगतान विधि चुनें</span>
                        </h2>
                        <div className="grid-2">
                            <button className="card" style={{ cursor: 'pointer', textAlign: 'center', padding: '2.5rem' }}
                                onClick={() => setMethod('upi')}>
                                <div style={{ fontSize: '3rem' }}>📱</div>
                                <h3 style={{ margin: '1rem 0 0.5rem' }}>Pay Online via UPI</h3>
                                <p className="hindi" style={{ color: 'var(--text-secondary)' }}>UPI से भुगतान करें</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                    Use PhonePe · GPay · Paytm · BHIM
                                </p>
                            </button>
                            <button className="card" style={{ cursor: 'pointer', textAlign: 'center', padding: '2.5rem' }}
                                onClick={() => setMethod('cash')}>
                                <div style={{ fontSize: '3rem' }}>💵</div>
                                <h3 style={{ margin: '1rem 0 0.5rem' }}>Pay at Counter (Cash)</h3>
                                <p className="hindi" style={{ color: 'var(--text-secondary)' }}>काउंटर पर नकद भुगतान</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                    Get a receipt &amp; pay at the cash desk
                                </p>
                            </button>
                        </div>
                    </>
                )}

                {method === 'upi' && (
                    <div className="card fade-in" style={{ marginTop: '1rem' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Scan &amp; Pay / स्कैन करें और भुगतान करें</h2>
                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            {/* QR placeholder */}
                            <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', flexShrink: 0 }}>
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`}
                                    alt="UPI QR Code" width={180} height={180} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>UPI ID</p>
                                <p style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--accent)' }}>
                                    {KIOSK_UPI_ID}
                                </p>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Amount / राशि</p>
                                <p className="amount" style={{ marginBottom: '1.5rem' }}>₹{bill.amount.toLocaleString('en-IN')}</p>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                    After paying, enter UPI Transaction ID below:
                                </p>
                                <p className="hindi" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.8rem' }}>
                                    भुगतान के बाद नीचे UPI ट्रांजेक्शन ID दर्ज करें
                                </p>
                                <input className="input" placeholder="UPI Transaction ID (12 digits)"
                                    value={upiTxnId} onChange={e => setUpiTxnId(e.target.value)} />
                            </div>
                        </div>
                        {error && <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>{error}</p>}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => setMethod(null)}>← Change Method</button>
                            <button className="btn btn-primary btn-large" onClick={handlePay} disabled={loading} style={{ flex: 1 }}>
                                {loading ? <span className="spinner" /> : 'Confirm Payment / पुष्टि करें'}
                            </button>
                        </div>
                    </div>
                )}

                {method === 'cash' && (
                    <div className="card fade-in" style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🖨</div>
                        <h2>Cash Payment Receipt</h2>
                        <p className="hindi" style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>काउंटर पर नकद भुगतान रसीद</p>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            A receipt will be printed. Take it to the <strong>cash counter</strong> and pay ₹{bill.amount.toLocaleString('en-IN')}.
                        </p>
                        <p className="hindi" style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                            रसीद प्रिंट होगी। इसे काउंटर पर ले जाएं और ₹{bill.amount.toLocaleString('en-IN')} का भुगतान करें।
                        </p>
                        {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className="btn btn-secondary" onClick={() => setMethod(null)}>← Change Method</button>
                            <button className="btn btn-success btn-large" onClick={handlePay} disabled={loading}>
                                {loading ? <span className="spinner" /> : '🖨 Print Receipt & Submit'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
