const client = require("../utils/dbConnection");
const query_error = require("../utils/enum");
const transactionModel = require("../model/transaction");

async function createNewAccount(data) {
    try {
        const query = `INSERT INTO ACCOUNTS (business_id, account_number, ifsc_code, activation_status, transaction_allowed, daily_withdrawal_limit, balance)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;`;
        const values = [
            data.business_id,
            data.account_number,
            data.ifsc_code,
            data.activation_status || "ACTIVE",
            data.transactions_allowed || "BOTH",
            data.daily_withdrawal_limit || 100000.0,
            data.balance || 0.0,
        ];
        const result = await client.query(query, values);
        return result;
    } catch (err) {
        console.log(err);
        throw new Error(query_error);
    }
}

async function getAllAccountsByBusinessId(business_id) {
    try {
        const query = `SELECT * FROM ACCOUNTS WHERE business_id = $1`;
        const values = [business_id];
        const result = await client.query(query, values);
        return result;
    } catch (err) {
        console.log(err);
        throw new Error(query_error);
    }
}

async function getAccountByAccountNumber(account_number) {
    try {
        const query = `SELECT * FROM ACCOUNTS WHERE account_number = $1`;
        const values = [account_number];
        const result = await client.query(query, values);
        return result.rows[0];
    } catch (err) {
        console.log(err);
        throw new Error(query_error);
    }
}

async function getAccountById(account_id) {
    try {
        const query = `SELECT * FROM ACCOUNTS WHERE id = $1`;
        const values = [account_id];
        const result = await client.query(query, values);
        return result.rows[0];
    } catch (err) {
        console.log(err);
        throw new Error(query_error);
    }
}

async function updateAccountBalance(account_id, account_number, new_balance) {
    try {
        const query = `UPDATE ACCOUNTS
                        SET balance = $1
                        WHERE id = $2 AND account_number = $3`;
        const values = [new_balance, account_id, account_number];
        const result = await client.query(query, values);
        return result;
    } catch (err) {
        console.log(err);
        throw new Error(query_error);
    }
}

// ACID TRANSACTIONS
async function updateBalanceAndCreateTransactions(
    data
) {
    try {
        await client.query("BEGIN");
        // update sender balance
        await updateAccountBalance(
            data.sender_account_id,
            data.sender_account_number,
            data.sender_account_balance
        );
        // update receiver balance
        await updateAccountBalance(
            data.receiver_account_id,
            data.receiver_account_number,
            data.receiver_account_balance
        );
        // create transaction entry for sender
        const senderTransaction = await transactionModel.createTransaction(
            data.sender_account_id,
            "WITHDRAWL",
            data.transaction_amount
        );
        // create transaction entry for reciever
        const receiverTransaction = await transactionModel.createTransaction(
            data.receiver_account_id,
            "DEPOSIT",
            data.transaction_amount
        );
        await client.query("COMMIT");
        return {
            senderTransaction: senderTransaction,
            receiverTransaction: receiverTransaction
        };

    } catch (err) {
        console.log(err);
        await client.query("ROLLBACK");
        throw new Error(query_error);
    }
}

module.exports = {
    createNewAccount,
    getAllAccountsByBusinessId,
    getAccountByAccountNumber,
    getAccountById,
    updateBalanceAndCreateTransactions,
};
