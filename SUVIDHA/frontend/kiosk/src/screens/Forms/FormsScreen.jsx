import { useNavigate } from 'react-router-dom';

const SERVICES = [
    { id: 'gas_connection', icon: '🔥', label: 'New Gas Connection', labelHi: 'नया गैस कनेक्शन', dept: 'Gas Department' },
    { id: 'driving_test', icon: '🚗', label: 'Driving Test Slot', labelHi: 'ड्राइविंग टेस्ट स्लॉट', dept: 'RTO' },
    { id: 'property_registry', icon: '📜', label: 'Property Registry Appt.', labelHi: 'संपत्ति रजिस्ट्री नियुक्ति', dept: 'Sub-Registrar Office' },
    { id: 'health_scheme', icon: '🏥', label: 'Health Scheme Enroll', labelHi: 'स्वास्थ्य योजना नामांकन', dept: 'Health Department' },
    { id: 'scholarship', icon: '🎓', label: 'Scholarship Application', labelHi: 'छात्रवृत्ति आवेदन', dept: 'Education Department' },
    { id: 'other', icon: '📋', label: 'Other Government Form', labelHi: 'अन्य सरकारी फॉर्म', dept: 'Various Departments' },
];

export default function FormsScreen() {
    const navigate = useNavigate();
    return (
        <div className="screen">
            <header className="header">
                <button className="btn btn-secondary" onClick={() => navigate('/')}>← Back</button>
                <span className="header-logo">📋 Apply / आवेदन करें</span>
                <span />
            </header>
            <div className="content fade-in">
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                    Select a Service &nbsp;|&nbsp; <span className="hindi">सेवा चुनें</span>
                </h2>
                <div className="grid-3" style={{ maxWidth: 1100, margin: '0 auto' }}>
                    {SERVICES.map(s => (
                        <button key={s.id} className="card" style={{ cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                            onClick={() => navigate('/forms/fill', { state: { service: s } })}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div style={{ fontSize: '2.2rem', marginBottom: '0.8rem' }}>{s.icon}</div>
                            <h3 style={{ fontSize: '1rem' }}>{s.label}</h3>
                            <p className="hindi" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{s.labelHi}</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.4rem' }}>{s.dept}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
