import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            padding: '24px',
            textAlign: 'center',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div className="fade-in" style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                padding: '60px 40px',
                borderRadius: '32px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                maxWidth: '500px',
                width: '100%'
            }}>
                <div style={{
                    fontSize: '120px',
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #818cf8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1,
                    marginBottom: '16px',
                    letterSpacing: '-4px'
                }}>
                    404
                </div>
                <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: '#1e293b', fontWeight: '800' }}>
                    Lost in Space?
                </h2>
                <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '1.1rem', lineHeight: 1.6 }}>
                    The page you're searching for has vanished into the digital void. Don't worry, even the best trackers lose their way sometimes.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Link
                        to="/"
                        style={{
                            padding: '16px 32px',
                            fontSize: '1rem',
                            fontWeight: '700',
                            background: 'var(--primary)',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '14px',
                            boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)',
                            transition: 'all 0.2s',
                            display: 'inline-block'
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        🏠 Return to Dashboard
                    </Link>
                    <Link
                        to="/login"
                        style={{
                            fontSize: '0.9rem',
                            color: 'var(--gray)',
                            textDecoration: 'none',
                            fontWeight: '600'
                        }}
                    >
                        Or try logging in again
                    </Link>
                </div>
            </div>

            <div style={{ marginTop: '40px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Finsight Expense Tracker • Enterprise Edition
            </div>
        </div>
    );
};

export default NotFound;
