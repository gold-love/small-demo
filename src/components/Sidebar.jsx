import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { getTranslation } from '../utils/i18n';

const Sidebar = ({ onClose }) => {
    const { user } = useContext(AuthContext);

    const navItems = [
        { path: '/', label: getTranslation(user?.language, 'dashboard'), icon: '📊' },
        ...(user?.orgSettings?.expenseModuleEnabled !== false ? [
            { path: '/add-expense', label: getTranslation(user?.language, 'add_expense'), icon: '➕' },
            { path: '/expenses', label: getTranslation(user?.language, 'my_expenses'), icon: '💸' }
        ] : []),
        ...(user?.orgSettings?.budgetModuleEnabled !== false ? [
            { path: '/budgets', label: getTranslation(user?.language, 'budgets'), icon: '📈' }
        ] : []),
        { path: '/reports', label: getTranslation(user?.language, 'reports'), icon: '📋' },
        { path: '/settings', label: getTranslation(user?.language, 'settings'), icon: '⚙️' },
    ];

    // Admin-only links
    if (user?.role === 'admin') {
        navItems.splice(4, 0, { path: '/approvals', label: getTranslation(user?.language, 'approvals'), icon: '✅' });
        navItems.splice(6, 0, { path: '/users', label: getTranslation(user?.language, 'users'), icon: '👥' });
        navItems.splice(7, 0, { path: '/enterprise', label: getTranslation(user?.language, 'enterprise'), icon: '🏢' });
        navItems.splice(8, 0, { path: '/audit-logs', label: getTranslation(user?.language, 'audit_logs'), icon: '📋' });
    }


    return (
        <>
            <div className="brand" style={{ marginBottom: '40px', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ color: 'var(--white)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--primary)' }}>●</span> Finsight
                </h1>
                <button
                    className="hamburger"
                    onClick={onClose}
                    style={{ color: 'white' }}
                >
                    ✕
                </button>
            </div>
            <nav>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {navItems.map((item) => (
                        <li key={item.path} style={{ marginBottom: '4px' }}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => isActive ? 'active-link' : ''}
                                onClick={onClose}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div style={{ marginTop: 'auto', padding: '20px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ color: 'var(--gray)', fontSize: '12px' }}>{getTranslation(user?.language, 'logged_in_as')}</p>
                <p style={{ color: 'white', fontWeight: '600' }}>{user?.name}</p>
                <p style={{ color: 'var(--primary)', fontSize: '12px', textTransform: 'capitalize' }}>{user?.role || 'employee'}</p>
            </div>
        </>
    );
};

export default Sidebar;
