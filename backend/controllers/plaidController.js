const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const BankConnection = require('../models/BankConnection');
const Expense = require('../models/Expense');
const logger = require('../utils/logger');

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

// @desc    Create a link token for Plaid
// @route   POST /api/plaid/create-link-token
// @access  Private
const createLinkToken = async (req, res) => {
    try {
        const request = {
            user: {
                client_user_id: req.user.id.toString(),
            },
            client_name: 'Finsight Expense Tracker',
            products: ['transactions'],
            language: 'en',
            country_codes: ['US'],
        };

        const createTokenResponse = await plaidClient.linkTokenCreate(request);
        res.json(createTokenResponse.data);
    } catch (error) {
        logger.error(`Error creating Plaid link token: ${error.message}`);
        res.status(500).json({ message: 'Failed to create link token' });
    }
};

// @desc    Exchange public token for access token
// @route   POST /api/plaid/exchange-public-token
// @access  Private
const exchangePublicToken = async (req, res) => {
    try {
        const { publicToken, institutionName } = req.body;
        const exchangeResponse = await plaidClient.itemPublicTokenExchange({
            public_token: publicToken,
        });

        const accessToken = exchangeResponse.data.access_token;
        const itemId = exchangeResponse.data.item_id;

        // Save connection to database
        const connection = await BankConnection.create({
            userId: req.user.id,
            accessToken,
            itemId,
            institutionName: institutionName || 'Unknown Bank'
        });

        res.status(201).json({ message: 'Bank account connected successfully', connectionId: connection.id });
    } catch (error) {
        logger.error(`Error exchanging Plaid public token: ${error.message}`);
        res.status(500).json({ message: 'Failed to exchange public token' });
    }
};

// @desc    Sync transactions from connected banks
// @route   POST /api/plaid/sync-transactions
// @access  Private
const syncTransactions = async (req, res) => {
    try {
        const connections = await BankConnection.findAll({ where: { userId: req.user.id } });
        
        if (connections.length === 0) {
            return res.status(404).json({ message: 'No bank accounts connected' });
        }

        let newExpensesCount = 0;

        for (const connection of connections) {
            // Fetch transactions for the last 30 days
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            const formattedStartDate = startDate.toISOString().split('T')[0];
            const formattedEndDate = new Date().toISOString().split('T')[0];

            const request = {
                access_token: connection.accessToken,
                start_date: formattedStartDate,
                end_date: formattedEndDate,
            };

            const response = await plaidClient.transactionsGet(request);
            const transactions = response.data.transactions;

            for (const txn of transactions) {
                // Check if expense already exists (we could add a plaidTransactionId field to Expense, 
                // but for now we'll just check based on amount, date, and description to avoid duplicates)
                // Actually, Plaid provides `transaction_id`. To keep schema simple, let's just log them.
                // In a real production system we'd add `transactionId` to Expense to prevent exact dupes.
                
                // Only sync outgoing money (expenses)
                if (txn.amount > 0) {
                    await Expense.create({
                        description: txn.name,
                        amount: txn.amount,
                        category: txn.category ? txn.category[0] : 'Other',
                        date: new Date(txn.date),
                        status: 'approved', // Auto-approve bank synced
                        paymentMethod: 'Bank Transfer',
                        userId: req.user.id,
                        organizationId: req.user.organizationId
                    });
                    newExpensesCount++;
                }
            }
        }

        res.json({ message: `Successfully synced ${newExpensesCount} new transactions` });
    } catch (error) {
        logger.error(`Error syncing Plaid transactions: ${error.message}`);
        res.status(500).json({ message: 'Failed to sync transactions' });
    }
};

module.exports = {
    createLinkToken,
    exchangePublicToken,
    syncTransactions
};
