const Budget = require('../models/Budget');
const Organization = require('../models/Organization');
const User = require('../models/User');

const getBudgets = async (req, res) => {
    try {
        const budgets = await Budget.findAll({ where: { userId: req.user.id } });
        res.json(budgets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createBudget = async (req, res) => {
    const { category, amount, period } = req.body;

    // Validation
    if (!category) {
        return res.status(400).json({ message: 'Category is required' });
    }
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    try {
        let status = 'approved'; // Default to approved for individual users

        // Check for Auto-Approval Rules if part of an organization
        if (req.user.organizationId) {
            const organization = await Organization.findByPk(req.user.organizationId);
            if (organization && organization.settings && organization.settings.autoApproveBudgetLimit) {
                const limit = parseFloat(organization.settings.autoApproveBudgetLimit);
                if (parseFloat(amount) > limit) {
                    status = 'pending';
                }
            }
        }

        const budget = await Budget.create({
            userId: req.user.id,
            organizationId: req.user.organizationId,
            category,
            amount,
            period,
            status
        });

        res.status(201).json(budget);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteBudget = async (req, res) => {
    try {
        const budget = await Budget.findByPk(req.params.id);

        if (budget) {
            // Restriction: Only Admins can delete budgets
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Only administrators can delete budgets' });
            }
            
            // Still check if it belongs to their organization
            if (budget.organizationId !== req.user.organizationId) {
                return res.status(401).json({ message: 'Not authorized for this organization' });
            }
            
            await budget.destroy();
            res.json({ message: 'Budget removed' });
        } else {
            res.status(404).json({ message: 'Budget not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateBudget = async (req, res) => {
    const { category, amount, period } = req.body;

    try {
        const budget = await Budget.findByPk(req.params.id);

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        // Restriction: Only Admins can update budgets
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only administrators can update budgets' });
        }

        // Still check if it belongs to their organization
        if (budget.organizationId !== req.user.organizationId) {
            return res.status(401).json({ message: 'Not authorized for this organization' });
        }

        if (amount && (isNaN(amount) || parseFloat(amount) <= 0)) {
            return res.status(400).json({ message: 'Amount must be a positive number' });
        }

        budget.category = category || budget.category;
        budget.amount = amount || budget.amount;
        budget.period = period || budget.period;

        const updatedBudget = await budget.save();
        res.json(updatedBudget);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getBudgets, createBudget, deleteBudget, updateBudget };
