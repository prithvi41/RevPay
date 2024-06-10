const client = require('../utils/dbConnection');
const query_error = require("../utils/enum");

async function getDailyWithdrawnAmount(account_id) {
    try {
        const query = `SELECT COALESCE(SUM(amount), 0.00) AS total_withdrawl
                       FROM TRANSACTIONS 
                       WHERE account_id = $1
                        AND transaction_type = 'WITHDRAWL'
                        AND created_at >= CURRENT_DATE`;
        const values = [account_id];
        const result = await client.query(query, values);
        return result.rows[0].total_withdrawl;
    }
    catch(err) {
        console.log(err);
        throw new Error(query_error);
    }
}

async function createTransaction(account_id, transaction_type, amount) {
    try {
        const query = `INSERT INTO TRANSACTIONS (account_id, transaction_type, amount)
                        VALUES ($1, $2, $3) 
                        RETURNING *;`
        const values = [account_id, transaction_type, amount];
        const result = await client.query(query, values);
        return result.rows[0];
    }
    catch(err) {
        console.log(err);
        throw new Error(query_error);
    }
}

module.exports = { getDailyWithdrawnAmount, createTransaction };