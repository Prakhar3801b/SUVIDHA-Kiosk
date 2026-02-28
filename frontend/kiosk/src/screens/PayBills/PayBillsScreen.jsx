import { useNavigate } from 'react-router-dom';

const BILL_TYPES = [
    {
        id: 'electricity', icon: '⚡', label: 'Electricity Bill', labelHi: 'बिजली बिल',
        dept: 'MSEDCL / State Electricity Board', field: 'IVRS Number', fieldHi: 'IVRS नंबर'
    },
    {
        id: 'gas', icon: '🔥', label: 'Gas Bill', labelHi: 'गैस बिल',
        dept: 'Indane / HP / Bharat Gas', field: 'Customer Account No.', fieldHi: 'खाता नंबर'
    },
    {
        id: 'property_tax', icon: '🏠', label: 'Property Tax', labelHi: 'संपत्ति कर',
        dept: 'Municipal Corporation', field: 'Property ID', fieldHi: 'संपत्ति आईडी'
    },
    {
        id: 'other', icon: '🏛', label: 'Other Government Bill', labelHi: 'अन्य सरकारी बिल',
        dept: 'Various Departments', field: 'Reference Number', fieldHi: 'संदर्भ नंबर'
    },
];

export default function PayBillsScreen() {
    const navigate = useNavigate();

    return (
        <div className="screen">
            <header className="header">
                <button className="btn btn-secondary" onClick={() => navigate('/')}>← Back / वापस</button>
                <span className="header-logo">💳 Pay Bills / बिल भुगतान</span>
                <span />
            </header>
            <div className="content fade-in">
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                    Select bill type &nbsp;|&nbsp; <span className="hindi">बिल प्रकार चुनें</span>
                </h2>
                <div className="grid-2" style={{ maxWidth: 900, margin: '0 auto' }}>
                    {BILL_TYPES.map((bt) => (
                        <button
                            key={bt.id}
                            className="card"
                            style={{ cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                            onClick={() => navigate('/pay/detail', { state: { billType: bt } })}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>{bt.icon}</div>
                            <h3 style={{ color: 'var(--text-primary)' }}>{bt.label}</h3>
                            <p className="hindi" style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>{bt.labelHi}</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{bt.dept}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
