import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function FormSuccessScreen() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { service, applicationId } = state || {};
    useEffect(() => { const t = setTimeout(() => navigate('/'), 12000); return () => clearTimeout(t); }, []);
    return (
        <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className="card fade-in" style={{ maxWidth: 580, width: '90%', textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                <h2 style={{ color: 'var(--success)' }}>Application Submitted!</h2>
                <p className="hindi" style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 2rem' }}>आवेदन सफलतापूर्वक जमा हुआ!</p>
                <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: 'var(--radius-sm)', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Your Application ID</p>
                    <p style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent)', letterSpacing: '2px' }}>
                        {applicationId}
                    </p>
                    <p className="hindi" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        इस नंबर से अपने आवेदन का हाल जानें
                    </p>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Note this ID for tracking. SMS updates will be sent. | Returning home in 12 seconds.
                </p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>🏠 Return to Home</button>
            </div>
        </div>
    );
}
