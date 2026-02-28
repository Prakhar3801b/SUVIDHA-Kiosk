import { useState, useEffect } from 'react';
import KioskFleet from './components/KioskFleet/KioskFleet';
import LiveRequests from './components/LiveRequests/LiveRequests';
import Maintenance from './components/Maintenance/Maintenance';
import PhysicalPayments from './components/PhysicalPayments/PhysicalPayments';
import TransactionsList from './components/shared/TransactionsList';
import PendingApplications from './components/shared/PendingApplications';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
const ADMIN_KEY = import.meta.env.VITE_ADMIN_API_KEY || '';

const navItems = [
    { id: 'fleet', icon: '🖥', label: 'Kiosk Fleet' },
    { id: 'live', icon: '📡', label: 'Live Requests' },
    { id: 'maintenance', icon: '🔧', label: 'Maintenance' },
    { id: 'payments', icon: '💵', label: 'Physical Payments' },
    { id: 'transactions', icon: '✅', label: 'All Transactions' },
    { id: 'pending', icon: '📋', label: 'Pending Applications' },
];

export default function App() {
    const [activePage, setActivePage] = useState('fleet');
    const [wsEvents, setWsEvents] = useState([]);
    const [time, setTime] = useState(new Date());

    // Clock
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // WebSocket connection — shared across all panels via prop
    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}/?type=admin`);
        ws.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                setWsEvents(prev => [msg, ...prev.slice(0, 199)]); // keep last 200 events
            } catch { }
        };
        ws.onerror = () => console.warn('[WS] Admin connection error');
        return () => ws.close();
    }, []);

    const pages = {
        fleet: <KioskFleet apiBase={BACKEND_URL} adminKey={ADMIN_KEY} wsEvents={wsEvents} />,
        live: <LiveRequests wsEvents={wsEvents} />,
        maintenance: <Maintenance apiBase={BACKEND_URL} adminKey={ADMIN_KEY} wsEvents={wsEvents} />,
        payments: <PhysicalPayments apiBase={BACKEND_URL} adminKey={ADMIN_KEY} />,
        transactions: <TransactionsList apiBase={BACKEND_URL} adminKey={ADMIN_KEY} />,
        pending: <PendingApplications apiBase={BACKEND_URL} adminKey={ADMIN_KEY} />,
    };

    const liveCount = wsEvents.filter(e => ['new_transaction', 'new_application', 'new_complaint'].includes(e.type)).length;

    return (
        <div className="admin-layout">
            {/* Main — left side, grows to fill space */}
            <div className="admin-main">
                <div className="admin-topbar">
                    {/* Brand */}
                    <div className="topbar-brand">
                        🏛 SUVIDHA
                        <span className="topbar-brand-sub">Admin Portal</span>
                    </div>
                    {/* Right side: page name + clock */}
                    <div className="topbar-right">
                        <span className="topbar-page-label">
                            {navItems.find(n => n.id === activePage)?.icon}{' '}
                            {navItems.find(n => n.id === activePage)?.label}
                        </span>
                        <span className="topbar-time">
                            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>
                </div>
                <div className="admin-content fade-in">
                    {pages[activePage]}
                </div>
            </div>

            {/* Sidebar — RIGHT side */}
            <aside className="admin-sidebar">
                <div className="sidebar-logo">🏛 SUVIDHA</div>
                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <button key={item.id} className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                            onClick={() => setActivePage(item.id)}>
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                            {item.id === 'live' && liveCount > 0 && (
                                <span className="badge badge-orange" style={{ marginLeft: 'auto' }}>{liveCount}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </aside>
        </div>
    );
}
