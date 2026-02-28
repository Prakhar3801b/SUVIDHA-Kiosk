import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import api from '../../services/api';

const KIOSK_ID = import.meta.env.VITE_KIOSK_ID || 'KIOSK-1';

// Field definitions per service
const FIELDS = {
    gas_connection: [
        { key: 'applicantName', label: 'Full Name', labelHi: 'पूरा नाम', type: 'text', required: true },
        { key: 'mobileNo', label: 'Mobile Number', labelHi: 'मोबाइल नंबर', type: 'tel', required: true },
        { key: 'aadhaarNo', label: 'Aadhaar Number (12 digits)', labelHi: 'आधार नंबर', type: 'text', required: false },
        { key: 'address', label: 'Full Address', labelHi: 'पूरा पता', type: 'text', required: true },
        { key: 'housingType', label: 'Housing Type (Owned/Rented)', labelHi: 'मकान प्रकार', type: 'text', required: true },
    ],
    driving_test: [
        { key: 'applicantName', label: 'Full Name', labelHi: 'पूरा नाम', type: 'text', required: true },
        { key: 'mobileNo', label: 'Mobile Number', labelHi: 'मोबाइल नंबर', type: 'tel', required: true },
        { key: 'dob', label: 'Date of Birth (DD/MM/YYYY)', labelHi: 'जन्म तिथि', type: 'text', required: true },
        { key: 'licenceNo', label: 'Learner Licence Number', labelHi: 'लर्नर लाइसेंस नंबर', type: 'text', required: true },
        { key: 'preferredDate', label: 'Preferred Test Date', labelHi: 'पसंदीदा तारीख', type: 'text', required: true },
    ],
    property_registry: [
        { key: 'applicantName', label: 'Owner Name', labelHi: 'मालिक का नाम', type: 'text', required: true },
        { key: 'mobileNo', label: 'Mobile Number', labelHi: 'मोबाइल नंबर', type: 'tel', required: true },
        { key: 'propertyId', label: 'Property ID', labelHi: 'संपत्ति आईडी', type: 'text', required: true },
        { key: 'transactionType', label: 'Transaction Type (Sale/Gift/etc.)', labelHi: 'लेनदेन प्रकार', type: 'text', required: true },
        { key: 'preferredDate', label: 'Preferred Appointment Date', labelHi: 'तारीख', type: 'text', required: true },
    ],
    health_scheme: [
        { key: 'applicantName', label: 'Full Name', labelHi: 'पूरा नाम', type: 'text', required: true },
        { key: 'mobileNo', label: 'Mobile Number', labelHi: 'मोबाइल नंबर', type: 'tel', required: true },
        { key: 'aadhaarNo', label: 'Aadhaar Number', labelHi: 'आधार नंबर', type: 'text', required: true },
        { key: 'incomeCategory', label: 'Income Category (APL/BPL)', labelHi: 'आय वर्ग', type: 'text', required: true },
    ],
    scholarship: [
        { key: 'applicantName', label: 'Student Full Name', labelHi: 'विद्यार्थी का नाम', type: 'text', required: true },
        { key: 'mobileNo', label: 'Mobile Number', labelHi: 'मोबाइल नंबर', type: 'tel', required: true },
        { key: 'aadhaarNo', label: 'Aadhaar Number', labelHi: 'आधार नंबर', type: 'text', required: true },
        { key: 'className', label: 'Class / Year', labelHi: 'कक्षा / वर्ष', type: 'text', required: true },
        { key: 'schoolName', label: 'School / College Name', labelHi: 'स्कूल / कॉलेज', type: 'text', required: true },
    ],
    other: [
        { key: 'applicantName', label: 'Full Name', labelHi: 'पूरा नाम', type: 'text', required: true },
        { key: 'mobileNo', label: 'Mobile Number', labelHi: 'मोबाइल नंबर', type: 'tel', required: true },
        { key: 'description', label: 'Describe what you need', labelHi: 'आवश्यकता बताएं', type: 'text', required: true },
    ],
};

export default function FormFillScreen() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const service = state?.service;
    const fields = FIELDS[service?.id] || FIELDS.other;

    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!service) { navigate('/forms'); return null; }

    const onChange = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    const handleSubmit = async () => {
        const missing = fields.filter(f => f.required && !formData[f.key]?.trim());
        if (missing.length) return setError(`Please fill: ${missing.map(f => f.label).join(', ')}`);
        setLoading(true); setError('');
        try {
            const res = await api.post('/forms/submit', {
                kioskId: KIOSK_ID,
                serviceType: service.id,
                applicantName: formData.applicantName,
                mobileNo: formData.mobileNo,
                aadhaarNo: formData.aadhaarNo || undefined,
                formData,
            });
            navigate('/forms/success', { state: { service, applicationId: res.data.applicationId } });
        } catch (e) {
            setError(e.response?.data?.error || 'Submission failed. Try again.');
        } finally { setLoading(false); }
    };

    return (
        <div className="screen">
            <header className="header">
                <button className="btn btn-secondary" onClick={() => navigate('/forms')}>← Back</button>
                <span className="header-logo">{service.icon} {service.label}</span>
                <span />
            </header>
            <div className="content fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
                <div className="card" style={{ marginTop: '1rem' }}>
                    <h2 style={{ marginBottom: '1.5rem' }}>Fill the Form <span className="hindi">/ फॉर्म भरें</span></h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {fields.map(f => (
                            <div key={f.key}>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '0.3rem' }}>
                                    {f.label} <span className="hindi" style={{ color: 'var(--text-muted)' }}>/ {f.labelHi}</span>
                                    {f.required && <span style={{ color: 'var(--danger)' }}> *</span>}
                                </label>
                                <input className="input" type={f.type} placeholder={f.label}
                                    value={formData[f.key] || ''}
                                    onChange={e => onChange(f.key, e.target.value)} />
                            </div>
                        ))}
                    </div>
                    {error && <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>{error}</p>}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button className="btn btn-secondary" onClick={() => navigate('/forms')}>Cancel</button>
                        <button className="btn btn-primary btn-large" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
                            {loading ? <span className="spinner" /> : 'Submit Application / जमा करें'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
