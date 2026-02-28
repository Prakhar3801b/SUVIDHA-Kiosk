const TYPE_LABELS = {
    new_transaction: { icon: '💳', label: 'Bill Payment', badge: 'badge-blue' },
    new_application: { icon: '📋', label: 'Form Submitted', badge: 'badge-green' },
    new_complaint: { icon: '📣', label: 'Complaint Filed', 'badge': 'badge-yellow' },
    payment_approved: { icon: '✅', label: 'Payment Approved', 'badge': 'badge-green' },
    kiosk_online: { icon: '🟢', label: 'Kiosk Online', badge: 'badge-green' },
    kiosk_offline: { icon: '🔴', label: 'Kiosk Offline', badge: 'badge-red' },
    hardware_event: { icon: '🔧', label: 'Hardware Event', badge: 'badge-yellow' },
};

export default function LiveRequests({ wsEvents }) {
    const relevant = wsEvents.filter(e => TYPE_LABELS[e.type]);

    return (
        <div className="card" style={{ maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
            <p className="card-title">Live Event Feed — {relevant.length} events this session</p>
            {relevant.length === 0 ? (
                <div className="empty">Waiting for events... <span className="spinner" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '0.5rem' }} /></div>
            ) : (
                relevant.map((event, i) => {
                    const meta = TYPE_LABELS[event.type] || { icon: '📌', label: event.type, badge: 'badge-blue' };
                    const p = event.payload || {};
                    return (
                        <div key={i} className="feed-item fade-in">
                            <span className="feed-icon">{meta.icon}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span className={`badge ${meta.badge}`}>{meta.label}</span>
                                    {p.kioskId && <span className="badge badge-blue">{p.kioskId}</span>}
                                    {p.receiptNo && <code style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{p.receiptNo}</code>}
                                    {p.complaintId && <code style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>{p.complaintId}</code>}
                                    {p.applicationId && <code style={{ fontSize: '0.75rem', color: 'var(--success)' }}>{p.applicationId}</code>}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                    {p.billType && `Type: ${p.billType}`}
                                    {p.amount && ` · ₹${p.amount}`}
                                    {p.paymentMethod && ` · ${p.paymentMethod.toUpperCase()}`}
                                    {p.serviceType && `Service: ${p.serviceType}`}
                                    {p.department && `Dept: ${p.department}`}
                                    {p.eventCode && `${p.device} — ${p.eventCode}`}
                                </div>
                            </div>
                            <span className="feed-time">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    );
                })
            )}
        </div>
    );
}
