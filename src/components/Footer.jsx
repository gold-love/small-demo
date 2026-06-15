import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Footer = () => {
    const [sentiment, setSentiment] = useState(null);
    const [comment, setComment] = useState('');
    const [email, setEmail] = useState('');
    const [subscribeToNewsletter, setSubscribeToNewsletter] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        if (!sentiment) {
            alert('Please select Like or Dislike first!');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/feedback', { sentiment, comment });
            
            // Task 6: Optional newsletter subscription
            if (subscribeToNewsletter && email) {
                await api.post('/newsletter/subscribe', { email });
            }

            setSubmitted(true);
            setComment('');
            setSentiment(null);
            setEmail('');
            setSubscribeToNewsletter(false);
        } catch (error) {
            alert(error.response?.data?.message || 'Feedback submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const footerStyles = {
        footer: {
            backgroundColor: 'var(--white)',
            borderTop: '1px solid var(--gray-light)',
            padding: '80px 40px 30px',
            marginTop: 'auto',
            color: 'var(--dark-soft)',
            fontFamily: "'Inter', sans-serif"
        },
        container: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '50px',
            maxWidth: '1300px',
            margin: '0 auto',
            marginBottom: '60px'
        },
        column: {
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
        },
        heading: {
            fontSize: '15px',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '10px',
            color: 'var(--dark)'
        },
        link: {
            fontSize: '14px',
            color: 'var(--gray)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            cursor: 'pointer',
            padding: '4px 0',
            width: '100%'
        },
        linkHover: {
            color: 'var(--primary)',
            paddingLeft: '5px'
        },
        status: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            color: 'var(--success)',
            background: 'var(--success-soft)',
            padding: '6px 12px',
            borderRadius: '20px',
            marginTop: '15px',
            fontWeight: '600',
            width: 'fit-content'
        },
        bottomBar: {
            borderTop: '1px solid var(--gray-light)',
            paddingTop: '30px',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--gray)'
        },
        newsletter: {
            display: 'flex',
            gap: '8px',
            marginTop: '10px'
        },
        input: {
            padding: '10px 15px',
            borderRadius: '8px',
            border: '1px solid var(--gray-light)',
            flex: 1,
            fontSize: '14px'
        },
        btn: {
            padding: '10px 20px',
            borderRadius: '8px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600'
        }
    };

    return (
        <footer style={footerStyles.footer}>
            <div style={footerStyles.container}>
                {/* 1. BRAND & MISSION */}
                <div style={footerStyles.column}>
                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary)', marginBottom: '5px' }}>Finsight</h2>
                    <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: '1.6' }}>
                        The smart standard for modern business spending. Track, manage, and analyze with confidence.
                    </p>
                    <div style={footerStyles.status}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', boxShadow: '0 0 8px var(--success)' }}></span>
                        Systems Online
                    </div>
                </div>

                {/* 2. QUICK NAVIGATION & NEWSLETTER */}
                <div style={footerStyles.column}>
                    <h3 style={footerStyles.heading}>Quick Access</h3>
                    <Link to="/" className="footer-link" style={footerStyles.link}>📊 Main Dashboard</Link>
                    <Link to="/expenses" className="footer-link" style={footerStyles.link}>💸 Expense Tracking</Link>
                    <Link to="/budgets" className="footer-link" style={footerStyles.link}>📅 Budget Management</Link>
                    <Link to="/reports" className="footer-link" style={footerStyles.link}>📈 Analytics & Reports</Link>

                    <h3 style={{ ...footerStyles.heading, marginTop: '20px' }}>Rate Your Experience</h3>
                    {submitted ? (
                        <div style={{ background: 'var(--success-soft)', padding: '15px', borderRadius: '12px', color: 'var(--success-dark)', fontWeight: '600', textAlign: 'center' }}>
                            ✨ Thank you for your feedback!
                            <button onClick={() => setSubmitted(false)} style={{ display: 'block', margin: '8px auto 0', border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '12px' }}>Send another</button>
                        </div>
                    ) : (
                        <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setSentiment('like')}
                                    style={{ 
                                        flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                                        background: sentiment === 'like' ? 'var(--success)' : 'var(--light)',
                                        color: sentiment === 'like' ? 'white' : 'var(--dark)',
                                        border: '1px solid var(--gray-light)',
                                        transition: 'all 0.2s', fontSize: '18px'
                                    }}
                                >
                                    👍
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setSentiment('dislike')}
                                    style={{ 
                                        flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                                        background: sentiment === 'dislike' ? 'var(--danger)' : 'var(--light)',
                                        color: sentiment === 'dislike' ? 'white' : 'var(--dark)',
                                        border: '1px solid var(--gray-light)',
                                        transition: 'all 0.2s', fontSize: '18px'
                                    }}
                                >
                                    👎
                                </button>
                            </div>
                            <textarea 
                                placeholder="Any comments or suggestions?" 
                                style={{ ...footerStyles.input, minHeight: '60px', resize: 'vertical' }}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                            
                            {/* Task 6: Newsletter Toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                                <input 
                                    type="checkbox" 
                                    id="footer-newsletter" 
                                    checked={subscribeToNewsletter} 
                                    onChange={(e) => setSubscribeToNewsletter(e.target.checked)}
                                />
                                <label htmlFor="footer-newsletter" style={{ fontSize: '12px', color: 'var(--gray)', cursor: 'pointer' }}>
                                    Also subscribe to our newsletter
                                </label>
                            </div>
                            
                            {subscribeToNewsletter && (
                                <input 
                                    type="email" 
                                    placeholder="Enter your email" 
                                    style={footerStyles.input}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            )}

                            <button type="submit" disabled={submitting} style={{ ...footerStyles.btn, width: '100%', marginTop: '10px' }}>
                                {submitting ? 'Sending...' : 'Submit Feedback'}
                            </button>
                        </form>
                    )}
                </div>

                {/* 3. SUPPORT & TECHNICAL */}
                <div style={footerStyles.column}>
                    <h3 style={footerStyles.heading}>Support & Help</h3>
                    <Link to="/settings" state={{ tab: 'advanced' }} className="footer-link" style={footerStyles.link}>📖 User Guide & Wiki</Link>
                    <Link to="/settings" state={{ tab: 'advanced' }} className="footer-link" style={footerStyles.link}>🛠️ Developer API Docs</Link>
                    <Link to="/settings" state={{ tab: 'notifications' }} className="footer-link" style={footerStyles.link}>📧 Email Support</Link>
                    <Link to="/settings" state={{ tab: 'profile' }} className="footer-link" style={footerStyles.link}>💬 Contact & Profile</Link>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                        <a href="https://github.com/WorkalemFikir" target="_blank" rel="noopener noreferrer" title="GitHub" style={{ color: 'var(--gray)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--dark)'} onMouseOut={e => e.currentTarget.style.color = 'var(--gray)'}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                        </a>
                        <a href="https://linkedin.com/in/WorkalemFikir" target="_blank" rel="noopener noreferrer" title="LinkedIn" style={{ color: 'var(--gray)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#0a66c2'} onMouseOut={e => e.currentTarget.style.color = 'var(--gray)'}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                        </a>
                        <a href="https://twitter.com/WorkalemFikir" target="_blank" rel="noopener noreferrer" title="X / Twitter" style={{ color: 'var(--gray)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#1da1f2'} onMouseOut={e => e.currentTarget.style.color = 'var(--gray)'}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                        </a>
                    </div>
                </div>

                {/* 4. SECURITY & LEGAL */}
                <div style={footerStyles.column}>
                    <h3 style={footerStyles.heading}>Security & Legal</h3>
                    <Link to="/settings" state={{ tab: 'security' }} className="footer-link" style={footerStyles.link}>🛡️ Privacy Policy</Link>
                    <Link to="/settings" state={{ tab: 'security' }} className="footer-link" style={footerStyles.link}>📜 Terms of Service</Link>
                    <Link to="/settings" state={{ tab: 'security' }} className="footer-link" style={footerStyles.link}>🇪🇺 GDPR Compliance</Link>
                    <Link to="/audit-logs" className="footer-link" style={footerStyles.link}>🔍 Security Audit Logs</Link>
                    <div style={{ marginTop: '15px' }}>
                        <img src="https://img.shields.io/badge/Security-PCI_DSS_Compliant-blue" alt="Security" />
                    </div>
                </div>
            </div>

            <div style={footerStyles.bottomBar}>
                <div className="footer-bottom-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <p>&copy; {new Date().getFullYear()} Finsight. All rights reserved.</p>
                    <p style={{ fontSize: '15px' }}>
                        Developed with ❤️ by <b style={{ color: 'var(--primary)', borderBottom: '2px solid var(--primary-soft)' }}>Workalem Fikir</b>
                    </p>
                    <div style={{ background: 'var(--gray-light)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                        VERSION 1.4.2
                    </div>
                </div>
            </div>
            <style>
                {`
                @media (max-width: 768px) {
                    footer { padding: 40px 20px 20px !important; }
                    .footer-bottom-container { flex-direction: column; text-align: center; gap: 10px !important; }
                }
                `}
            </style>
        </footer>
    );
};

export default Footer;
