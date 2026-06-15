const { sequelize } = require('../config/db');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const { fn, col, Op } = require('sequelize');
const { convertCurrency } = require('../utils/currencyConverter');
const User = require('../models/User');


const getCategoryReport = async (req, res) => {
    try {
        // Build date filter
        const dateFilter = { userId: req.user.id };
        const { dateFrom, dateTo, timeRange } = req.query;

        if (dateFrom || dateTo) {
            dateFilter.date = {};
            if (dateFrom) dateFilter.date[Op.gte] = new Date(dateFrom);
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                dateFilter.date[Op.lte] = end;
            }
        } else if (timeRange && timeRange !== 'all') {
            const now = new Date();
            let fromDate = new Date();
            if (timeRange === '7d') fromDate.setDate(now.getDate() - 7);
            else if (timeRange === '30d') fromDate.setDate(now.getDate() - 30);
            else if (timeRange === '90d') fromDate.setDate(now.getDate() - 90);
            else if (timeRange === '1y') fromDate.setFullYear(now.getFullYear() - 1);
            dateFilter.date = { [Op.gte]: fromDate };
        }

        const report = await Expense.findAll({
            where: dateFilter,
            attributes: [
                ['category', '_id'],
                [fn('SUM', col('amount')), 'total']
            ],
            group: ['category']
        });

        // Get user for preferred currency
        const user = await User.findByPk(req.user.id);
        const targetCurrency = user.preferredCurrency || 'USD';

        // Process and convert
        const processedReport = {};
        let grandTotal = 0;

        for (const item of report) {
            const category = item.getDataValue('_id');
            const amount = parseFloat(item.getDataValue('total'));
            // Convert to user's preferred currency
            const converted = await convertCurrency(amount, 'USD', targetCurrency);
            if (!processedReport[category]) {
                processedReport[category] = 0;
            }
            processedReport[category] += parseFloat(converted);
            grandTotal += parseFloat(converted);
        }

        const finalReport = Object.keys(processedReport).map(key => ({
            _id: key,
            total: parseFloat(processedReport[key].toFixed(2))
        }));

        res.json({
            report: finalReport,
            grandTotal: parseFloat(grandTotal.toFixed(2)),
            currency: targetCurrency
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMonthlyReport = async (req, res) => {
    try {
        const dialect = sequelize.getDialect();
        let monthAttr;
        let groupBy;
        let orderBy;

        if (dialect === 'sqlite') {
            monthAttr = [fn('strftime', '%m', col('date')), 'month'];
            groupBy = fn('strftime', '%m', col('date'));
            orderBy = fn('strftime', '%m', col('date'));
        } else if (dialect === 'postgres') {
            // Trim whitespace from to_char output in Postgres
            monthAttr = [fn('trim', fn('to_char', col('date'), 'Month')), 'month'];
            groupBy = [fn('to_char', col('date'), 'Month'), sequelize.literal("EXTRACT(MONTH FROM date)")];
            orderBy = [sequelize.literal("EXTRACT(MONTH FROM date)"), 'ASC'];
        } else {
            // Default to MySQL
            monthAttr = [fn('MONTHNAME', col('date')), 'month'];
            groupBy = fn('MONTHNAME', col('date'));
            orderBy = fn('MONTH', col('date'));
        }

        // Build date filter
        const dateFilter = { userId: req.user.id };
        const { dateFrom, dateTo, timeRange } = req.query;

        if (dateFrom || dateTo) {
            dateFilter.date = {};
            if (dateFrom) dateFilter.date[Op.gte] = new Date(dateFrom);
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                dateFilter.date[Op.lte] = end;
            }
        } else if (timeRange && timeRange !== 'all') {
            const now = new Date();
            let fromDate = new Date();
            if (timeRange === '7d') fromDate.setDate(now.getDate() - 7);
            else if (timeRange === '30d') fromDate.setDate(now.getDate() - 30);
            else if (timeRange === '90d') fromDate.setDate(now.getDate() - 90);
            else if (timeRange === '1y') fromDate.setFullYear(now.getFullYear() - 1);
            dateFilter.date = { [Op.gte]: fromDate };
        }

        const isLiteralOrder = Array.isArray(orderBy);

        const report = await Expense.findAll({
            where: dateFilter,
            attributes: [
                monthAttr,
                [fn('SUM', col('amount')), 'total']
            ],
            group: Array.isArray(groupBy) ? groupBy : [groupBy],
            order: isLiteralOrder ? [orderBy] : [[orderBy, 'ASC']]
        });

        const finalReport = report.map(item => ({
            month: item.getDataValue('month'),
            total: parseFloat(parseFloat(item.getDataValue('total') || 0).toFixed(2))
        }));

        res.json(finalReport);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAdminSummary = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }

        // Date filter
        const dateFilter = { organizationId: req.user.organizationId };
        const { dateFrom, dateTo, timeRange } = req.query;

        if (dateFrom || dateTo) {
            dateFilter.date = {};
            if (dateFrom) dateFilter.date[Op.gte] = new Date(dateFrom);
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                dateFilter.date[Op.lte] = end;
            }
        } else if (timeRange && timeRange !== 'all') {
            const now = new Date();
            let fromDate = new Date();
            if (timeRange === '7d') fromDate.setDate(now.getDate() - 7);
            else if (timeRange === '30d') fromDate.setDate(now.getDate() - 30);
            else if (timeRange === '90d') fromDate.setDate(now.getDate() - 90);
            else if (timeRange === '1y') fromDate.setFullYear(now.getFullYear() - 1);
            dateFilter.date = { [Op.gte]: fromDate };
        }

        const totalCompanySpend = await Expense.sum('amount', { 
            where: { 
                ...dateFilter,
                status: 'approved' 
            } 
        }) || 0;
        
        const pendingCount = await Expense.count({ 
            where: { 
                ...dateFilter,
                status: 'pending' 
            } 
        });

        // Top Spenders
        const topSpendersRaw = await Expense.findAll({
            where: { ...dateFilter, status: 'approved' },
            attributes: [
                'userId',
                [fn('SUM', col('amount')), 'totalSpent']
            ],
            include: [{ model: User, attributes: ['name'] }],
            group: ['userId', 'User.id'],
            order: [[fn('SUM', col('amount')), 'DESC']],
            limit: 5
        });
        const topSpenders = topSpendersRaw.map(s => ({
            name: s.User?.name || 'Unknown',
            total: parseFloat(parseFloat(s.getDataValue('totalSpent') || 0).toFixed(2))
        }));

        // Enterprise Stats
        const Project = require('../models/Project');
        const Vendor = require('../models/Vendor');
        const Asset = require('../models/Asset');
        const enterpriseStats = {
            projects: await Project.count({ where: { organizationId: req.user.organizationId } }),
            vendors: await Vendor.count({ where: { organizationId: req.user.organizationId } }),
            assets: await Asset.count({ where: { organizationId: req.user.organizationId } })
        };

        // Company categories
        const companyCategoryRaw = await Expense.findAll({
            where: dateFilter,
            attributes: [
                ['category', '_id'],
                [fn('SUM', col('amount')), 'total']
            ],
            group: ['category']
        });
        const companyCategoryData = companyCategoryRaw.map(item => ({
            _id: item.getDataValue('_id'),
            total: parseFloat(parseFloat(item.getDataValue('total') || 0).toFixed(2))
        }));

        // Company monthly trend
        const dialect = sequelize.getDialect();
        let monthAttr, groupBy, orderBy;
        if (dialect === 'postgres') {
            monthAttr = [fn('trim', fn('to_char', col('date'), 'Month')), 'month'];
            groupBy = [fn('to_char', col('date'), 'Month'), sequelize.literal("EXTRACT(MONTH FROM date)")];
            orderBy = [sequelize.literal("EXTRACT(MONTH FROM date)"), 'ASC'];
        } else {
            monthAttr = [fn('MONTHNAME', col('date')), 'month'];
            groupBy = fn('MONTHNAME', col('date'));
            orderBy = fn('MONTH', col('date'));
        }

        const companyMonthlyRaw = await Expense.findAll({
            where: dateFilter,
            attributes: [
                monthAttr,
                [fn('SUM', col('amount')), 'total']
            ],
            group: Array.isArray(groupBy) ? groupBy : [groupBy],
            order: Array.isArray(orderBy) ? [orderBy] : [[orderBy, 'ASC']]
        });
        const companyMonthlyData = companyMonthlyRaw.map(item => ({
            month: item.getDataValue('month'),
            total: parseFloat(parseFloat(item.getDataValue('total') || 0).toFixed(2))
        }));

        res.json({
            totalCompanySpend: parseFloat(parseFloat(totalCompanySpend).toFixed(2)),
            pendingCount,
            topSpenders,
            enterpriseStats,
            companyCategoryData,
            companyMonthlyData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const exportExpenses = async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        let expenseFilter = { userId: req.user.id };
        if (dateFrom || dateTo) {
            expenseFilter.date = {};
            if (dateFrom) expenseFilter.date[Op.gte] = new Date(dateFrom);
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                expenseFilter.date[Op.lte] = end;
            }
        }

        const expenses = await Expense.findAll({
            where: expenseFilter,
            order: [['date', 'DESC']]
        });
        const csvHeader = 'Date,Title,Category,Amount,Currency,Status\n';
        const csvRows = expenses.map(exp => {
            return `${new Date(exp.date).toLocaleDateString()},"${exp.title.replace(/"/g, '""')}",${exp.category},${exp.amount},${exp.currency || 'USD'},${exp.status}`;
        }).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=expenses_export.csv');
        res.status(200).send(csvHeader + csvRows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getBudgetComparison = async (req, res) => {
  try {
    // Fetch budgets for the user's organization (or all if none)
    const budgetWhere = req.user.organizationId ? { organizationId: req.user.organizationId } : {};
    const budgets = await Budget.findAll({ where: budgetWhere });

    // Start of the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Spending per category for the current month (exclude rejected)
    const spending = await Expense.findAll({
      where: {
        userId: req.user.id,
        date: { [Op.gte]: startOfMonth },
        status: { [Op.ne]: 'rejected' }
      },
      attributes: [
        ['category', '_id'],
        [fn('SUM', col('amount')), 'total']
      ],
      group: ['category']
    });

    // Map of spending amounts by category
    const spendingMap = {};
    spending.forEach(s => {
      spendingMap[s.getDataValue('_id')] = parseFloat(s.getDataValue('total'));
    });

    // Ensure every expense category has a budget entry (use placeholder if missing)
    const expenseCategories = Object.keys(spendingMap);
    const budgetMap = new Map(budgets.map(b => [b.category, b]));
    const allBudgets = [...budgets];
    expenseCategories.forEach(cat => {
      if (!budgetMap.has(cat)) {
        allBudgets.push({ category: cat, amount: 0 });
      }
    });

    // Build comparison array
    const comparison = allBudgets.map(b => {
      const budgetAmt = parseFloat(b.amount);
      const spent = spendingMap[b.category] || 0;
      const percentage = budgetAmt > 0 ? ((spent / budgetAmt) * 100).toFixed(1) : '0';
      return {
        category: b.category,
        budgetAmount: budgetAmt,
        actualSpent: spent,
        percentage
      };
    });

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCategoryReport, getMonthlyReport, getAdminSummary, exportExpenses, getBudgetComparison };
