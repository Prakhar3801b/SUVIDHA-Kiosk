import { useState, useRef } from 'react';
import api from '../../services/api';
import hindiData from '../../../../ai_system/hindi_faq.json';
import './VoiceAssistant.css';

// Keyword-based Hindi FAQ matcher
function matchHindiFAQ(transcript) {
    const t = transcript.toLowerCase();
    for (const [key, answer] of Object.entries(hindiData)) {
        if (key === 'default') continue;
        if (t.includes(key.toLowerCase())) return answer;
    }
    return hindiData['default'];
}

// Detect if transcript is Hindi (contains Devanagari characters)
function isHindi(text) {
    return /[\u0900-\u097F]/.test(text);
}

export default function VoiceAssistant() {
    const [open, setOpen] = useState(false);
    const [listening, setListening] = useState(false);
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const recognitionRef = useRef(null);

    const startListening = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            setError('Voice not supported. Try on Chromium/Electron.');
            setOpen(true);
            return;
        }
        const r = new SR();
        // Try hi-IN — Chromium understands both Hindi and English in hi-IN mode
        r.lang = 'hi-IN';
        r.continuous = false;
        r.interimResults = false;
        r.maxAlternatives = 1;

        r.onstart = () => { setListening(true); setReply(''); setError(''); setOpen(true); };
        r.onresult = async (e) => {
            const transcript = e.results[0][0].transcript;
            setListening(false);
            setLoading(true);

            if (isHindi(transcript)) {
                // Hindi path → curated FAQ
                const answer = matchHindiFAQ(transcript);
                setReply(answer);
                setLoading(false);
            } else {
                // English path → GPT-2 via backend
                try {
                    const res = await api.post('/ai/chat', { message: transcript, language: 'en' });
                    setReply(res.data.reply);
                } catch (err) {
                    setReply('Sorry, the AI assistant is offline. Please ask staff for help.');
                } finally { setLoading(false); }
            }
        };
        r.onerror = (e) => {
            setListening(false); setLoading(false);
            setError(`Voice error: ${e.error}. Try again.`);
        };
        r.onend = () => setListening(false);
        r.start();
        recognitionRef.current = r;
    };

    const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

    const dismiss = () => { setOpen(false); setReply(''); setError(''); };

    // Auto-dismiss after 30s
    if (reply && !open) setOpen(true);

    return (
        <>
            {/* Floating Mic Button */}
            <button className={`va-mic-btn ${listening ? 'va-listening' : ''}`} onClick={listening ? stopListening : startListening}>
                <span className="va-mic-icon">{listening ? '⏹' : '🎤'}</span>
                <span className="va-mic-label">{listening ? 'बोलें...' : 'Help / मदद'}</span>
            </button>

            {/* Response Bubble */}
            {open && (
                <div className="va-bubble fade-in">
                    <button className="va-close" onClick={dismiss}>✕</button>
                    {listening && (
                        <div className="va-status">
                            <span className="va-dot" />
                            <span>Listening in Hindi / English...</span>
                            <span className="hindi"> बोलें...</span>
                        </div>
                    )}
                    {loading && <div className="va-status"><span className="spinner" /> Thinking...</div>}
                    {reply && (
                        <p className="va-reply" style={{ whiteSpace: 'pre-line' }}>{reply}</p>
                    )}
                    {error && <p className="va-error">{error}</p>}
                    {!listening && !loading && (
                        <button className="btn btn-secondary" style={{ marginTop: '1rem', fontSize: '0.9rem' }}
                            onClick={startListening}>
                            🎤 Ask again / फिर पूछें
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
