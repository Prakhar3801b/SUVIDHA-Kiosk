import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import VoiceAssistant from '../components/AIAssistant/VoiceAssistant';
import './HomeScreen.css';

const KIOSK_ID = import.meta.env.VITE_KIOSK_ID || 'KIOSK-1';

const tiles = [
    {
        id: 'pay',
        path: '/pay',
        icon: '💳',
        titleEn: 'Pay Bills',
        titleHi: 'बिल भुगतान',
        descEn: 'Electricity · Gas · Property Tax',
        descHi: 'बिजली · गैस · संपत्ति कर',
        color: '#3b82f6',
    },
    {
        id: 'forms',
        path: '/forms',
        icon: '📋',
        titleEn: 'Apply / Register',
        titleHi: 'आवेदन / पंजीकरण',
        descEn: 'Gas Connection · Driving Test · Schemes',
        descHi: 'गैस कनेक्शन · ड्राइविंग टेस्ट · योजनाएं',
        color: '#22c55e',
    },
    {
        id: 'grievance',
        path: '/grievance',
        icon: '📣',
        titleEn: 'File a Complaint',
        titleHi: 'शिकायत दर्ज करें',
        descEn: 'Report issues to the right department',
        descHi: 'सही विभाग में समस्या दर्ज करें',
        color: '#f59e0b',
    },
];

export default function HomeScreen() {
    const navigate = useNavigate();
    const [time, setTime] = useState(new Date());
    const [hardwareWarning, setHardwareWarning] = useState(null);
    const inactivityTimer = useRef(null);

    // Clock
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // Listen for critical hardware alerts from backend (via ws)
    useEffect(() => {
        const ws = new WebSocket(
            `${import.meta.env.VITE_WS_URL || 'ws://localhost:3001'}/?type=kiosk&kioskId=${KIOSK_ID}`
        );
        ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'hardware_critical') {
                setHardwareWarning(`⚠ Hardware issue: ${msg.payload.device} — ${msg.payload.eventCode}`);
            }
        };
        return () => ws.close();
    }, []);

    // Inactivity auto-reset (90s) — reset timer on any touch
    const resetTimer = () => {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = setTimeout(() => navigate('/'), 90000);
    };
    useEffect(() => {
        window.addEventListener('click', resetTimer);
        window.addEventListener('touchstart', resetTimer);
        resetTimer();
        return () => {
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('touchstart', resetTimer);
            clearTimeout(inactivityTimer.current);
        };
    }, []);

    const fmt = (d) =>
        d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) +
        '  ' + d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    return (
        <div className="screen">
            <header className="header">
                <span className="header-logo">🏛 SUVIDHA</span>
                <span className="header-time">{fmt(time)}</span>
                <span className="header-kiosk">{KIOSK_ID}</span>
            </header>

            {hardwareWarning && (
                <div className="banner-warning">{hardwareWarning}</div>
            )}

            <div className="home-hero">
                <h1 className="home-title">नमस्ते! <span>Welcome</span></h1>
                <p className="home-subtitle hindi">
                    आपकी सेवा में तत्पर है SUVIDHA &nbsp;|&nbsp;
                    <span style={{ fontFamily: 'Inter' }}>Your Government Service Centre</span>
                </p>
            </div>

            <div className="home-tiles fade-in">
                {tiles.map((tile) => (
                    <button
                        key={tile.id}
                        className="tile"
                        style={{ '--tile-color': tile.color }}
                        onClick={() => navigate(tile.path)}
                    >
                        <span className="tile-icon">{tile.icon}</span>
                        <span className="tile-title">{tile.titleEn}</span>
                        <span className="tile-title-hi hindi">{tile.titleHi}</span>
                        <span className="tile-desc">{tile.descEn}</span>
                        <span className="tile-arrow">→</span>
                    </button>
                ))}
            </div>

            <VoiceAssistant />

            <footer className="home-footer">
                <span>Tap the 🎤 button to ask for help in Hindi or English</span>
                <span className="hindi"> · सहायता के लिए 🎤 दबाएं</span>
            </footer>
        </div>
    );
}
