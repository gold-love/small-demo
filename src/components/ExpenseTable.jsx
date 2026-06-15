import React from 'react';

const ExpenseTable = ({ 
    expenses, onDelete, onEdit, onApprove, onReject, isAdmin, 
    selectedIds = [], onToggleSelect, onToggleAll,
    sortBy, sortOrder, onSort, onViewDetails 
}) => {
    const isAllSelected = expenses.length > 0 && selectedIds.length === expenses.length;

    const renderSortIcon = (column) => {
        if (sortBy !== column) return <span style={{ opacity: 0.3, marginLeft: '5px' }}>↕️</span>;
        return sortOrder === 'ASC' ? <span style={{ marginLeft: '5px' }}>🔼</span> : <span style={{ marginLeft: '5px' }}>🔽</span>;
    };

    const headerStyle = { 
        padding: '16px', 
        color: 'var(--gray)', 
        fontSize: '0.8rem', 
        textTransform: 'uppercase', 
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'color 0.2s'
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--light)', textAlign: 'left' }}>
                            <th style={{ padding: '16px', width: '40px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={isAllSelected} 
                                    onChange={onToggleAll}
                                    style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                />
                            </th>
                            <th style={headerStyle} onClick={() => onSort('date')}>
                                Date {renderSortIcon('date')}
                            </th>
                            {isAdmin && <th style={headerStyle} onClick={() => onSort('User.name')}>Employee</th>}
                            <th style={headerStyle} onClick={() => onSort('title')}>
                                Title {renderSortIcon('title')}
                            </th>
                            <th style={headerStyle} onClick={() => onSort('category')}>
                                Category {renderSortIcon('category')}
                            </th>
                            <th style={{ padding: '16px', color: 'var(--gray)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Project / Vendor</th>
                            <th style={headerStyle} onClick={() => onSort('amount')}>
                                Amount {renderSortIcon('amount')}
                            </th>
                            <th style={headerStyle} onClick={() => onSort('status')}>
                                Status {renderSortIcon('status')}
                            </th>
                            <th style={{ padding: '16px', color: 'var(--gray)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map((expense) => (
                            <tr key={expense.id} style={{ 
                                borderBottom: '1px solid var(--gray-light)', 
                                transition: 'background 0.2s',
                                background: selectedIds.includes(expense.id) ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
                            }}>
                                <td style={{ padding: '16px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(expense.id)}
                                        onChange={() => onToggleSelect(expense.id)}
                                        style={{ cursor: 'pointer', transform: 'scale(1.1)' }}
                                    />
                                </td>
                                <td style={{ padding: '16px', color: 'var(--dark-soft)' }}>
                                    {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                {isAdmin && (
                                    <td style={{ padding: '16px', color: 'var(--dark)', fontWeight: '600' }}>
                                        {expense.User?.name || 'Unknown'}
                                    </td>
                                )}
                                <td style={{ padding: '16px', color: 'var(--dark)', fontWeight: '500' }}>{expense.title}</td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        background: 'var(--primary)',
                                        color: 'white',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        opacity: 0.85
                                    }}>
                                        {expense.category}
                                    </span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--dark-soft)', fontWeight: '600' }}>{expense.Project?.name || '---'}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--gray)' }}>{expense.Vendor?.name || ''}</div>
                                </td>
                                <td style={{ padding: '16px', fontWeight: '800', color: 'var(--dark)' }}>
                                    {expense.currency || '$'} {parseFloat(expense.amount).toFixed(2)}
                                    {expense.taxAmount > 0 && (
                                        <div style={{ fontSize: '10px', color: 'var(--gray)', fontWeight: '400' }}>
                                            Incl. {expense.currency} {parseFloat(expense.taxAmount).toFixed(2)} Tax
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span className={`status-badge status-${expense.status}`}>
                                        {expense.status}
                                    </span>
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => onViewDetails(expense)}
                                            className="btn"
                                            style={{
                                                padding: '6px 12px',
                                                fontSize: '12px',
                                                background: '#f1f5f9',
                                                color: '#475569',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            👁️ View
                                        </button>
                                        {isAdmin && expense.status === 'pending' && onApprove && (
                                            <button
                                                onClick={() => onApprove(expense.id)}
                                                className="btn"
                                                style={{
                                                    padding: '6px 12px',
                                                    fontSize: '12px',
                                                    background: '#dcfce7',
                                                    color: '#166534',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontWeight: '700'
                                                }}
                                            >
                                                ✅ Approve
                                            </button>
                                        )}
                                        {isAdmin && expense.status === 'pending' && onReject && (
                                            <button
                                                onClick={() => onReject(expense.id)}
                                                className="btn"
                                                style={{
                                                    padding: '6px 12px',
                                                    fontSize: '12px',
                                                    background: '#fee2e2',
                                                    color: '#991b1b',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontWeight: '700'
                                                }}
                                            >
                                                ❌ Reject
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onEdit(expense)}
                                            className="btn"
                                            style={{
                                                padding: '6px 12px',
                                                fontSize: '12px',
                                                background: 'var(--primary-soft)',
                                                color: 'var(--primary)',
                                                border: 'none',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={() => onDelete(expense.id)}
                                            className="btn"
                                            style={{
                                                padding: '6px 12px',
                                                fontSize: '12px',
                                                background: '#fee2e2',
                                                color: '#dc2626',
                                                border: 'none',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {expenses.length === 0 && (
                <p style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)', fontSize: '0.9rem' }}>No matching expenses found.</p>
            )}
        </div>
    );
};

export default ExpenseTable;
