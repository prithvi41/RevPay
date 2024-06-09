const accountModel = require('../model/account');
const http_status_code = require("../utils/httpStatusCode");
const { validActivationStatus, validTransactionsAllowed } = require("../utils/enum");

async function createAccount(req, res) {
    try {
        const data = {
            ...req.body,
            business_id : req.user.businessId
        };
        // required fields validation
        if(!data.account_number || !data.ifsc_code) {
            return res.status(http_status_code.BAD_REQUEST).send("missing required fields");
        }
        // if account number already exists 
        const AccountAlreadyExists = accountModel.getAccountByAccountNumber(data.account_number);
        if(AccountAlreadyExists && (await AccountAlreadyExists).rows.length > 0) {
            return res.status(http_status_code.BAD_REQUEST).send("Account number already exists");
        }
        // validate activation status
        if(data.activation_status && !validActivationStatus.includes(data.activation_status)) {
            return res.status(http_status_code.BAD_REQUEST).send("Allowed values for activation_status is only ACTIVE or INACTIVE");
        }
        //validate allowed_transactions status 
        if(data.transactions_allowed && !validTransactionsAllowed.includes(data.transactions_allowed)) {
            return res.status(http_status_code.BAD_REQUEST).send("Allowed values for transactions_allowed is only CREDIT or DEBIT or BOTH");
        }
        const result = await accountModel.createNewAccount(data);
        return res.status(http_status_code.OK).json(result.rows[0]);
    }
    catch(err) {
        console.log(err);
        return res.status(http_status_code.INTERNAL_SERVER_ERROR).send("unexpected server error");
    }
}

async function getAccounts(req, res) {
    try {
        const business_id = req.user.businessId;
        if (!business_id) {
            return res.status(http_status_code.BAD_REQUEST).send("Business ID is required");
        }
        const accounts = await accountModel.getAllAccountsByBusinessId(business_id);
        return res.status(http_status_code.OK).json(accounts.rows);
    } 
    catch (err) {
        console.error(err);
        return res.status(http_status_code.INTERNAL_SERVER_ERROR).send("Unexpected server error");
    }
}

module.exports = { createAccount, getAccounts };