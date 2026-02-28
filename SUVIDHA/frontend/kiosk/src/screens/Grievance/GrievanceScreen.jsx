import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import api from '../../services/api';

const KIOSK_ID = import.meta.env.VITE_KIOSK_ID || 'KIOSK-1';

const DEPARTMENTS = [
    { id: 'electricity', label: 'Electricity', labelHi: 'बिजली' },
    { id: 'gas', label: 'Gas', labelHi: 'गैस' },
    { id: 'water', label: 'Water', labelHi: 'पानी' },
    { id: 'sanitation', label: 'Sanitation', labelHi: 'सफाई' },
    { id: 'roads', label: 'Roads', labelHi: 'सड़क' },
    { id: 'ration', label: 'Ration', labelHi: 'राशन' },
    { id: 'other', label: 'Other', labelHi: 'अन्य' },
];

export default function GrievanceScreen() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1=phone, 2=dept, 3=desc, 4=confirm
    const [mobileNo, setMobileNo] = useState('');
    const [dept, setDept] = useState(null);
    const [description, setDescription] = useState('');
    const [inputMethod, setInputMethod] = useState('keyboard');
    const [listening, setListening] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const recognitionRef = useRef(null);

    const startVoice = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { setError('Voice input not supported in this browser'); return; }
        const r = new SR();
        r.lang = 'hi-IN'; // supports both Hindi and English
        r.continuous = false;
        r.onstart = () => { setListening(true); setInputMethod('voice'); };
        r.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            setDescription(prev => prev + (prev ? ' ' : '') + transcript);
        };
        r.onend = () => setListening(false);
        r.onerror = () => { setListening(false); setError('Voice input error. Try typing instead.'); };
        r.start();
        recognitionRef.current = r;
    };

    const stopVoice = () => { recognitionRef.current?.stop(); setListening(false); };

    const handleSubmit = async () => {
        if (!description.trim() || description.trim().length < 10) {
            return setError('Please describe your complaint in at least 10 characters.');
        }
        setLoading(true); setError('');
        try {
            const res = await api.post('/complaints/register', {
                kioskId: KIOSK_ID, mobileNo, department: dept.id, description: description.trim(), inputMethod,
            });
            navigate('/grievance/success', { state: { complaintId: res.data.complaintId, dept, mobileNo } });
        } catch (e) {
            setError(e.response?.data?.error || 'Submission failed.');
        } finally { setLoading(false); }
    };

    return (
        <div className="screen">
            <header className="header">
                <button className="btn btn-secondary" onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/')}>
                    ← Back
                </button>
                <span className="header-logo">📣 File Complaint / शिकायत</span>
                <span />
            </header>

            <div className="content fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
                {/* Step indicators */}
                <div className="steps" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
                    {['Mobile', 'Department', 'Describe', 'Confirm'].map((s, i) => (
                        <span key={s} className={`step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>{i + 1}. {s}</span>
                    ))}
                </div>

                {step === 1 && (
                    <div className="card">
                        <h2 style={{ marginBottom: '1rem' }}>Enter Mobile Number <span className="hindi">/ मोबाइल नंबर</span></h2>
                        <input className="input" type="tel" maxLength={10} placeholder="10-digit mobile number"
                            value={mobileNo} onChange={e => setMobileNo(e.target.value.replace(/\D/, ''))} />
                        {error && <p style={{ color: 'var(--danger)', marginTop: '0.5rem' }}>{error}</p>}
                        <button className="btn btn-primary btn-large" style={{ marginTop: '1.5rem', width: '100%' }}
                            onClick={() => { if (mobileNo.length !== 10) return setError('Enter valid 10-digit mobile number'); setError(''); setStep(2); }}>
                            Next →
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="card">
                        <h2 style={{ marginBottom: '1rem' }}>Select Department <span className="hindi">/ विभाग</span></h2>
                        <div className="grid-2" style={{ gap: '0.8rem' }}>
                            {DEPARTMENTS.map(d => (
                                <button key={d.id} className="btn" style={{
                                    background: dept?.id === d.id ? 'var(--accent-2)' : 'var(--bg-hover)',
                                    color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '1rem',
                                }} onClick={() => setDept(d)}>
                                    {d.label} <span className="hindi" style={{ color: 'var(--text-secondary)' }}>/ {d.labelHi}</span>
                                </button>
                            ))}
                        </div>
                        <button className="btn btn-primary btn-large" style={{ marginTop: '1.5rem', width: '100%' }}
                            onClick={() => { if (!dept) return setError('Please select a department'); setError(''); setStep(3); }}
                            disabled={!dept}>
                            Next →
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="card">
                        <h2 style={{ marginBottom: '0.5rem' }}>Describe your complaint</h2>
                        <p className="hindi" style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>अपनी समस्या बताएं</p>
                        <textarea className="input" rows={5} style={{ resize: 'none' }}
                            placeholder="Describe the issue (Hindi or English)..."
                            value={description} onChange={e => setDescription(e.target.value)} />
                        <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
                            {!listening ? (
                                <button className="btn btn-secondary" onClick={startVoice}>🎤 Speak (बोलें)</button>
                            ) : (
                                <button className="btn btn-danger" onClick={stopVoice}>⏹ Stop Recording</button>
                            )}
                            <span style={{ color: 'var(--text-muted)', alignSelf: 'center', fontSize: '0.85rem' }}>
                                {listening ? '🔴 Listening... (Hindi/English)' : 'or type above'}
                            </span>
                        </div>
                        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
                        <button className="btn btn-primary btn-large" style={{ width: '100%' }}
                            onClick={() => { if (!description.trim()) return setError('Please describe your complaint'); setError(''); setStep(4); }}>
                            Review →
                        </button>
                    </div>
                )}

                {step === 4 && (
                    <div className="card fade-in">
                        <h2 style={{ marginBottom: '1rem' }}>Review &amp; Submit</h2>
                        <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1.5rem' }}>
                            <Row label="Mobile" value={mobileNo} />
                            <Row label="Department" value={`${dept?.label} / ${dept?.labelHi}`} />
                            <Row label="Complaint" value={description} />
                        </div>
                        {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}
                        <button className="btn btn-primary btn-large" style={{ width: '100%' }} onClick={handleSubmit} disabled={loading}>
                            {loading ? <span className="spinner" /> : '✅ Submit Complaint / शिकायत दर्ज करें'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)', minWidth: 120 }}>{label}</span>
            <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: 400, wordBreak: 'break-word' }}>{value}</span>
        </div>
    );
}
