const request = require('supertest');
const express = require('express');
const transactionController = require('../controller/transactionController');
const http_status_code = require('../utils/httpStatusCode');
const dbConnection = require("../utils/dbConnection");

// Mock the models
jest.mock('../model/transaction');
jest.mock('../model/account');
const transactionModel = require('../model/transaction');
const accountModel = require('../model/account');

// Mock the authenticate middleware
jest.mock('../middleware/authenticate');
const authenticate = require('../middleware/authenticate');

const app = express();
app.use(express.json());

app.post('/transactions/new', authenticate, transactionController.newTransaction);

// Mock the authenticate middleware to always call next()
authenticate.mockImplementation((req, res, next) => {
    req.user = { businessId: 1 };  // Simulate a logged-in user with businessId 1
    next();
});

describe('Transaction Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await dbConnection.end();
        jest.restoreAllMocks();
    });

    describe('newTransaction', () => {
        it('should return 400 if required fields are missing', async () => {
            const response = await request(app)
                .post('/transactions/new')
                .send({ amount: 100 });
            expect(response.status).toBe(http_status_code.BAD_REQUEST);
            expect(response.text).toBe('Missing required fields');
        });

        it('should return 400 if amount is invalid', async () => {
            const response = await request(app)
                .post('/transactions/new')
                .send({ account_id: 1, amount: -100, beneficiary_account_number: '1234567890' });
            expect(response.status).toBe(http_status_code.BAD_REQUEST);
            expect(response.text).toBe('please enter a valid amount');
        });

        it('should return 400 if sender account is not found', async () => {
            accountModel.getAccountById.mockResolvedValue(null);
            const response = await request(app)
                .post('/transactions/new')
                .send({ account_id: 1, amount: 100, beneficiary_account_number: '1234567890' });
            expect(response.status).toBe(http_status_code.BAD_REQUEST);
            expect(response.text).toBe('Account not found');
        });

        it('should return 401 if account_id does not belong to logged-in business', async () => {
            accountModel.getAccountById.mockResolvedValue({ business_id: 2 });
            const response = await request(app)
                .post('/transactions/new')
                .send({ account_id: 1, amount: 100, beneficiary_account_number: '1234567890' });
            expect(response.status).toBe(http_status_code.UNAUTHORIZED);
            expect(response.text).toBe('unauthorized transactions, account id is not correct');
        });

        it('should return 400 if sender account is inactive', async () => {
            accountModel.getAccountById.mockResolvedValue({ business_id: 1, activation_status: 'INACTIVE' });
            const response = await request(app)
                .post('/transactions/new')
                .send({ account_id: 1, amount: 100, beneficiary_account_number: '1234567890' });
            expect(response.status).toBe(http_status_code.BAD_REQUEST);
            expect(response.text).toBe('your account is inactive');
        });

        it('should return 400 if withdrawal is not allowed for sender account', async () => {
            accountModel.getAccountById.mockResolvedValue({ business_id: 1, activation_status: 'ACTIVE', transaction_allowed: 'CREDIT' });
            const response = await request(app)
                .post('/transactions/new')
                .send({ account_id: 1, amount: 100, beneficiary_account_number: '1234567890' });
            expect(response.status).toBe(http_status_code.BAD_REQUEST);
            expect(response.text).toBe('withdrawl is not allowed for your account');
        });

        it('should return 400 if sender has insufficient balance', async () => {
            accountModel.getAccountById.mockResolvedValue({ business_id: 1, activation_status: 'ACTIVE', transaction_allowed: 'BOTH', balance: 50 });
            const response = await request(app)
                .post('/transactions/new')
                .send({ account_id: 1, amount: 100, beneficiary_account_number: '1234567890' });
            expect(response.status).toBe(http_status_code.BAD_REQUEST);
            expect(response.text).toBe('insufficient balance to transfer');
        });

        it('should return 401 if daily withdrawal limit is reached', async () => {
            accountModel.getAccountById.mockResolvedValue({
                business_id: 1,
                activation_status: 'ACTIVE',
                transaction_allowed: 'BOTH',
                balance: 1000,
                daily_withdrawl_limit: 500
            });
            transactionModel.getDailyWithdrawnAmount.mockResolvedValue(450);
            const response = await request(app)
                .post('/transactions/new')
                .send({ account_id: 1, amount: 100, beneficiary_account_number: '1234567890' });
            expect(response.status).toBe(http_status_code.UNAUTHORIZED);
            expect(response.text).toBe('daily withdrawl limit reached');
        });

        it('should return 400 if beneficiary account is not found', async () => {
            accountModel.getAccountById.mockResolvedValue({
                business_id: 1,
                activation_status: 'ACTIVE',
                transaction_allowed: 'BOTH',
                balance: 1000,
                daily_withdrawl_limit: 1000
            });
            transactionModel.getDailyWithdrawnAmount.mockResolvedValue(100);
            accountModel.getAccountByAccountNumber.mockResolvedValue(null);
            const response = await request(app)
                .post('/transactions/new')
                .send({ account_id: 1, amount: 100, beneficiary_account_number: '1234567890' });
            expect(response.status).toBe(http_status_code.BAD_REQUEST);
            expect(response.text).toBe('Beneficiary Account not found');
        });

        it('should return 400 if beneficiary account is inactive', async () => {
            accountModel.getAccountById.mockResolvedValue({
                business_id: 1,
                activation_status: 'ACTIVE',
                transaction_allowed: 'BOTH',
                balance: 1000,
                daily_withdrawl_limit: 1000
            });
            transactionModel.getDailyWithdrawnAmount.mockResolvedValue(100);
            accountModel.getAccountByAccountNumber.mockResolvedValue({ activation_status: 'INACTIVE' });
            const response = await request(app)
                .post('/transactions/new')
                .send({ account_id: 1, amount: 100, beneficiary_account_number: '1234567890' });
            expect(response.status).toBe(http_status_code.BAD_REQUEST);
            expect(response.text).toBe("Receiver's account is inactive");
        });

        it('should return 400 if deposit is not allowed for beneficiary account', async () => {
            accountModel.getAccountById.mockResolvedValue({
                business_id: 1,
                activation_status: 'ACTIVE',
                transaction_allowed: 'BOTH',
                balance: 1000,
                daily_withdrawl_limit: 1000
            });
            transactionModel.getDailyWithdrawnAmount.mockResolvedValue(100);
            accountModel.getAccountByAccountNumber.mockResolvedValue({
                activation_status: 'ACTIVE',
                transaction_allowed: 'DEBIT'
            });
            const response = await request(app)
                .post('/transactions/new')
                .send({ account_id: 1, amount: 100, beneficiary_account_number: '1234567890' });
            expect(response.status).toBe(http_status_code.BAD_REQUEST);
            expect(response.text).toBe("deposit is not allowed for beneficiary's account");
        });

        it('should return 201 and create a transaction if all conditions are met', async () => {
            accountModel.getAccountById.mockResolvedValue({
                business_id: 1,
                activation_status: 'ACTIVE',
                transaction_allowed: 'BOTH',
                balance: 1000,
                daily_withdrawl_limit: 1000
            });
            transactionModel.getDailyWithdrawnAmount.mockResolvedValue(100);
            accountModel.getAccountByAccountNumber.mockResolvedValue({
                activation_status: 'ACTIVE',
                transaction_allowed: 'BOTH',
                balance: 500
            });
            accountModel.updateBalanceAndCreateTransactions.mockResolvedValue({
                sender_account_balance: 900,
                receiver_account_balance: 600
            });

            const response = await request(app)
                .post('/transactions/new')
                .send({ account_id: 1, amount: 100, beneficiary_account_number: '1234567890' });

            expect(response.status).toBe(http_status_code.CREATED);
            expect(response.body).toEqual({
                sender_account_balance: 900,
                receiver_account_balance: 600
            });
        });
        it('should handle server error', async () => {
            accountModel.getAccountById.mockImplementation(() => {
                throw new Error('unexpected server error');
            });
            const response = await request(app)
                .post('/transactions/new')
                .send({ account_id: 1, amount: 100, beneficiary_account_number: '1234567890' });
            expect(response.status).toBe(http_status_code.INTERNAL_SERVER_ERROR);
            expect(response.text).toBe('unexpected server error');
        });
    });
});