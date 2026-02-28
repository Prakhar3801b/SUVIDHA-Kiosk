import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function GrievanceSuccessScreen() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { complaintId, dept, mobileNo } = state || {};
    useEffect(() => { const t = setTimeout(() => navigate('/'), 12000); return () => clearTimeout(t); }, []);
    return (
        <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className="card fade-in" style={{ maxWidth: 560, width: '90%', textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                <h2 style={{ color: 'var(--success)' }}>Complaint Registered!</h2>
                <p className="hindi" style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 2rem' }}>शिकायत दर्ज हो गई!</p>
                <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: 'var(--radius-sm)', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Complaint ID / शिकायत संख्या</p>
                    <p style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--success)', letterSpacing: '2px' }}>
                        {complaintId}
                    </p>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    Department / विभाग: <strong>{dept?.label}</strong>
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Updates will be sent to: <strong>{mobileNo}</strong>
                </p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>🏠 Return to Home</button>
            </div>
        </div>
    );
}
