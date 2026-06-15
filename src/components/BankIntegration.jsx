import React, { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const BankIntegration = () => {
    const [linkToken, setLinkToken] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const toast = useToast();

    // Fetch Link Token on mount
    useEffect(() => {
        const getLinkToken = async () => {
            try {
                const response = await api.post('/plaid/create-link-token');
                setLinkToken(response.data.link_token);
            } catch (error) {
                console.error('Failed to get link token', error);
            }
        };
        getLinkToken();
    }, []);

    const onSuccess = useCallback(async (publicToken, metadata) => {
        try {
            await api.post('/plaid/exchange-public-token', {
                publicToken,
                institutionName: metadata.institution.name,
            });
            toast.success(`Successfully connected to ${metadata.institution.name}`);
        } catch (error) {
            toast.error('Failed to connect bank account');
        }
    }, [toast]);

    const { open, ready } = usePlaidLink({
        token: linkToken,
        onSuccess,
    });

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const response = await api.post('/plaid/sync-transactions');
            toast.success(response.data.message || 'Transactions synced successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to sync transactions. Ensure you have a connected bank account.');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="bank-integration-card" style={{ padding: '24px', border: '1px solid var(--gray-light)', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '20px' }}>
                    🏦
                </div>
                <div>
                    <h4 style={{ margin: 0, fontSize: '18px' }}>Plaid Bank Sync</h4>
                    <span style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: '600' }}>Automated Transactions</span>
                </div>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--dark-soft)', marginBottom: '20px' }}>
                Connect your bank account or corporate card to automatically import transactions and skip manual data entry.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                    className="btn btn-primary" 
                    onClick={() => open()} 
                    disabled={!ready}
                    style={{ flex: 1, fontWeight: 'bold' }}
                >
                    Connect Bank
                </button>
                <button 
                    className="btn" 
                    onClick={handleSync} 
                    disabled={isSyncing}
                    style={{ flex: 1, background: 'white', border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 'bold' }}
                >
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
            </div>
        </div>
    );
};

export default BankIntegration;
