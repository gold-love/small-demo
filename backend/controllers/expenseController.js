const Expense = require('../models/Expense');
const Organization = require('../models/Organization');
const { checkBudgetStatus } = require('../utils/budgetCheck');
const { Op } = require('sequelize');

const getExpenses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // Build dynamic filter
        let where = {};
        if (req.user.role === 'admin' && req.query.scope === 'company') {
            where = { organizationId: req.user.organizationId };
        } else {
            where = { userId: req.user.id };
        }

        // Search by title or category
        if (req.query.search) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${req.query.search}%` } },
                { category: { [Op.iLike]: `%${req.query.search}%` } }
            ];
        }

        // Filter by category
        if (req.query.category) {
            where.category = req.query.category;
        }

        // Filter by status
        if (req.query.status) {
            where.status = req.query.status;
        }

        // Filter by date range
        if (req.query.dateFrom || req.query.dateTo) {
            where.date = {};
            if (req.query.dateFrom) {
                where.date[Op.gte] = new Date(req.query.dateFrom);
            }
            if (req.query.dateTo) {
                const endDate = new Date(req.query.dateTo);
                endDate.setHours(23, 59, 59, 999);
                where.date[Op.lte] = endDate;
            }
        }

        // Filter by amount range
        if (req.query.minAmount) {
            where.amount = { ...(where.amount || {}), [Op.gte]: parseFloat(req.query.minAmount) };
        }
        if (req.query.maxAmount) {
            where.amount = { ...(where.amount || {}), [Op.lte]: parseFloat(req.query.maxAmount) };
        }

        // Sorting logic
        const sortBy = req.query.sortBy || 'date';
        const sortOrder = req.query.sortOrder || 'DESC';
        const validSortColumns = ['date', 'amount', 'title', 'category', 'status', 'createdAt'];
        const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'date';
        const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        const { count, rows: expenses } = await Expense.findAndCountAll({
            where,
            include: [
                { model: require('../models/User'), attributes: ['id', 'name'] },
                { model: require('../models/Project'), attributes: ['id', 'name', 'code'] },
                { model: require('../models/Vendor'), attributes: ['id', 'name'] }
            ],
            order: [[finalSortBy, finalSortOrder]],
            limit,
            offset,
        });

        res.json({
            expenses,
            pagination: {
                total: count,
                page,
                pages: Math.ceil(count / limit),
                limit,
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createExpense = async (req, res) => {
    let { 
        title, amount, category, date, description, currency, 
        isRecurring, recurringInterval, projectId, vendorId, taxRate 
    } = req.body;

    // Validation
    if (!title || title.trim().length === 0) {
        return res.status(400).json({ message: 'Title is required' });
    }
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    if (!category) {
        return res.status(400).json({ message: 'Category is required' });
    }

    const receiptUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        let status = 'pending';
        let finalAmount = parseFloat(amount);
        let appliedCurrency = currency || 'USD';

        // 💱 Task 2: Live Currency Conversion Engine Simulation
        const companyBaseCurrency = req.user.preferredCurrency || 'USD';

        if (appliedCurrency !== companyBaseCurrency) {
            // In a real production app, this would call: await axios.get(`https://api.exchangerate-api.com/v4/latest/${appliedCurrency}`)
            // Here we use a static mock dictionary for demonstration:
            const mockRatesToUSD = { 'EUR': 1.08, 'GBP': 1.25, 'CAD': 0.73, 'AUD': 0.65, 'JPY': 0.0066 };
            const fromRate = mockRatesToUSD[appliedCurrency] || 1;
            const toRate = mockRatesToUSD[companyBaseCurrency] || 1;

            // Formula: (Amount * From USD Rate) / To USD Rate
            const convertedAmount = (finalAmount * fromRate) / toRate;
            
            // Add a note about conversion to description
            const conversionNote = `[Converted from ${amount} ${appliedCurrency}]`;
            description = description ? `${description}\n${conversionNote}` : conversionNote;
            
            finalAmount = convertedAmount;
            appliedCurrency = companyBaseCurrency;

            console.log(`[Currency Engine] Converted ${amount} to ${finalAmount.toFixed(2)} ${companyBaseCurrency}`);
        }

        // Check for Organization Rules
        if (req.user.organizationId) {
            const organization = await Organization.findByPk(req.user.organizationId);
            const isAdmin = req.user.role === 'admin';

            if (organization && organization.settings) {
                // Admins are auto-approved
                if (isAdmin) {
                    status = 'approved';
                } else if (organization.settings.autoApproveLimit) {
                    // Auto-Approval Check for regular users
                    const limit = parseFloat(organization.settings.autoApproveLimit);
                    if (finalAmount <= limit) {
                        status = 'approved';
                    }
                }

                // Strictly Enforce Max Limit (Regular users only)
                if (!isAdmin && organization.settings.maxExpenseLimit) {
                    const max = parseFloat(organization.settings.maxExpenseLimit);
                    if (finalAmount > max) {
                        return res.status(400).json({ message: `Expense exceeds organization's single-expense limit of ${max}` });
                    }
                }

                // Check Receipt requirements (Regular users only)
                if (!isAdmin && organization.settings.requireReceipts && !receiptUrl) {
                    return res.status(400).json({ message: 'Organization policy requires a receipt for all expenses.' });
                }

                // Strict Budget Enforcement (Regular users only)
                if (!isAdmin && organization.settings.strictBudgetEnforcement) {
                    const Budget = require('../models/Budget');
                    const budget = await Budget.findOne({
                        where: { userId: req.user.id, category }
                    });

                    if (budget) {
                        const totalSpentRaw = await Expense.sum('amount', {
                            where: { userId: req.user.id, category }
                        });
                        const totalSpent = parseFloat(totalSpentRaw || 0);
                        if (totalSpent + finalAmount > budget.amount) {
                            return res.status(400).json({ message: `Strict budget enforcement: Expense rejected because it exceeds the budget for ${category}. Budget: ${budget.amount}, Spent: ${totalSpent}` });
                        }
                    }
                }
            }
        }

        // Calculate Tax if provided
        const appliedTaxRate = parseFloat(taxRate) || 0;
        const taxAmount = (finalAmount * (appliedTaxRate / 100));

        const expense = await Expense.create({
            userId: req.user.id,
            organizationId: req.user.organizationId,
            projectId: projectId || null,
            vendorId: vendorId || null,
            title,
            amount: finalAmount,
            category,
            date: date || new Date(),
            description,
            currency: appliedCurrency,
            receiptUrl,
            status,
            taxRate: appliedTaxRate,
            taxAmount,
            isRecurring: isRecurring === 'true' || isRecurring === true,
            recurringInterval: (isRecurring === 'true' || isRecurring === true) ? recurringInterval : null,
        });

        res.status(201).json(expense);

        // Run budget check in background
        checkBudgetStatus(req.user.id, category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findByPk(req.params.id);

        if (expense) {
            const isAdminForOrg = req.user.role === 'admin' && expense.organizationId === req.user.organizationId;
            if (expense.userId !== req.user.id && !isAdminForOrg) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            await expense.destroy();
            res.json({ message: 'Expense removed' });
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateExpense = async (req, res) => {
    const { 
        title, amount, category, date, description, currency, 
        isRecurring, recurringInterval, projectId, vendorId, taxRate 
    } = req.body;

    try {
        const expense = await Expense.findByPk(req.params.id);

        if (expense) {
            const isAdminForOrg = req.user.role === 'admin' && expense.organizationId === req.user.organizationId;
            if (expense.userId !== req.user.id && !isAdminForOrg) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            expense.title = title || expense.title;
            expense.amount = amount || expense.amount;
            expense.category = category || expense.category;
            expense.date = date || expense.date;
            expense.description = description || expense.description;
            expense.currency = currency || expense.currency;
            expense.projectId = projectId !== undefined ? (projectId || null) : expense.projectId;
            expense.vendorId = vendorId !== undefined ? (vendorId || null) : expense.vendorId;
            
            if (taxRate !== undefined) {
                expense.taxRate = parseFloat(taxRate);
                expense.taxAmount = (parseFloat(expense.amount) * (expense.taxRate / 100));
            }

            if (isRecurring !== undefined) {
                expense.isRecurring = isRecurring === 'true' || isRecurring === true;
                expense.recurringInterval = expense.isRecurring ? recurringInterval : null;
            }

            if (req.file) expense.receiptUrl = req.file.path;

            const updatedExpense = await expense.save();
            res.json(updatedExpense);

            // Run budget check in background
            checkBudgetStatus(req.user.id, updatedExpense.category);
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteAllExpenses = async (req, res) => {
    try {
        await Expense.destroy({
            where: { userId: req.user.id }
        });
        res.json({ message: 'All expense data cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getBudgetStatus = async (req, res) => {
    try {
        const { expenseId } = req.params;
        const expense = await Expense.findByPk(expenseId);
        
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Find the user's budget for this category
        const budget = await require('../models/Budget').findOne({
            where: {
                userId: expense.userId,
                category: expense.category,
                status: 'approved'
            }
        });

        if (!budget) {
            return res.json({ hasBudget: false });
        }

        // Calculate total spent in this category (only approved ones)
        const totalSpentRaw = await Expense.sum('amount', {
            where: {
                userId: expense.userId,
                category: expense.category,
                status: 'approved',
                id: { [Op.ne]: expenseId } // Exclude this one if it's already approved
            }
        });

        const totalSpent = parseFloat(totalSpentRaw || 0);
        const budgetAmount = parseFloat(budget.amount);
        const currentExpenseAmount = parseFloat(expense.amount);
        const remaining = budgetAmount - totalSpent;
        const willBeOver = (totalSpent + currentExpenseAmount) > budgetAmount;

        res.json({
            hasBudget: true,
            budgetAmount,
            totalSpent,
            currentExpenseAmount,
            remaining,
            willBeOver,
            percentUsed: ((totalSpent / budgetAmount) * 100).toFixed(1),
            percentWithNew: (((totalSpent + currentExpenseAmount) / budgetAmount) * 100).toFixed(1)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getExpenses, createExpense, deleteExpense, updateExpense, deleteAllExpenses, getBudgetStatus };

