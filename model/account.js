const client = require('../utils/dbConnection');

async function createNewAccount(data) {
    try {
        const query = `INSERT INTO ACCOUNTS (business_id, account_number, ifsc_code, activation_status, transaction_allowed, daily_withdrawal_limit, balance)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;`
        const values = [data.business_id,
                        data.account_number,
                        data.ifsc_code,
                        data.activation_status || 'ACTIVE',
                        data.transaction_allowed || 'BOTH',
                        data.daily_withdrawal_limit || 100000.00,
                        data.balance || 0.00];
        const result = await client.query(query, values);
        return result;
    }
    catch(err) {
        console.log(err);
        throw new Error("error while executing query");
    }
}

async function getAllAccountsByBusinessId(business_id) {
    try {
        const query = `SELECT * FROM ACCOUNTS WHERE business_id = $1`;
        const values = [business_id];
        const result = await client.query(query, values);
        return result;
    }
    catch(err) {
        console.log(err);
        throw new Error("error while executing query");
    }
}

module.exports = { createNewAccount, getAllAccountsByBusinessId };