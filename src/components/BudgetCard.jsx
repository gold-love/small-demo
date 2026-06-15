import React from 'react';

const BudgetCard = ({ id, category, amount, spent, onEdit, onDelete, isAdmin }) => {
    const percentage = ((spent / amount) * 100).toFixed(1);
    const cappedPercentage = Math.min(percentage, 100);
    
    // Dynamic colors based on usage
    let statusColor = 'var(--success)';
    if (percentage >= 100) statusColor = 'var(--danger)';
    else if (percentage >= 80) statusColor = 'var(--warning)';

    const icons = {
        'Food': '🍎',
        'Transport': '🚗',
        'Housing': '🏠',
        'Utilities': '💧',
        'Clothing': '👕',
        'Shopping': '🛍️',
        'Entertainment': '🎬',
        'Health': '🏥',
        'Education': '📚',
        'Travel': '✈️',
        'Expense': '📑',
        'Other': '✨'
    };

    return (
        <div className="card slide-up" style={{ 
            position: 'relative', 
            padding: '24px', 
            borderTop: `5px solid ${statusColor}`,
            background: `linear-gradient(180deg, ${statusColor}05 0%, white 100%)`
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '28px', background: 'var(--light)', padding: '10px', borderRadius: '12px' }}>
                        {icons[category] || '💰'}
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{category}</h3>
                        <div style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: '600' }}>Budget Limit</div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--dark)' }}>${amount.toLocaleString()}</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: '700' }}>PER MONTH</div>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', fontWeight: '700' }}>
                    <span style={{ color: 'var(--gray)' }}>Current Spend</span>
                    <span style={{ color: statusColor }}>{percentage}% used</span>
                </div>
                <div style={{ width: '100%', background: 'var(--gray-light)', height: '12px', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ 
                        width: `${cappedPercentage}%`, 
                        background: statusColor, 
                        height: '100%', 
                        borderRadius: '10px',
                        boxShadow: `0 0 10px ${statusColor}40`,
                        transition: 'width 1s ease-in-out'
                    }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px' }}>
                    <span style={{ fontWeight: '800' }}>${spent.toLocaleString()}</span>
                    <span style={{ color: 'var(--gray)' }}>Remaining: ${(amount - spent).toLocaleString()}</span>
                </div>
            </div>

            {isAdmin && (
                <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--gray-light)', paddingTop: '16px' }}>
                    <button 
                        onClick={() => onEdit({ id, category, amount })}
                        style={{ 
                            flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--primary-soft)', 
                            background: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' 
                        }}
                    >
                        Edit Budget
                    </button>
                    <button 
                        onClick={() => onDelete(id)}
                        style={{ 
                            padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--danger-soft)', 
                            background: 'none', color: 'var(--danger)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' 
                        }}
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default BudgetCard;
