const accountModel = require("../model/account");
const http_status_code = require("../utils/httpStatusCode");
const {
    validActivationStatus,
    validTransactionsAllowed,
} = require("../utils/enum");

async function createAccount(req, res) {
    try {
        const data = {
            ...req.body,
            business_id: req.user.businessId,
        };
        // required fields validation
        if (!data.account_number || !data.ifsc_code) {
            return res
                .status(http_status_code.BAD_REQUEST)
                .send("missing required fields");
        }
        // if account number already exists
        const AccountAlreadyExists = await accountModel.getAccountByAccountNumber(
            data.account_number
        );
        if (AccountAlreadyExists) {
            return res
                .status(http_status_code.BAD_REQUEST)
                .send("Account number already exists");
        }
        // validate activation status
        if (
            data.activation_status &&
            !validActivationStatus.includes(data.activation_status)
        ) {
            return res
                .status(http_status_code.BAD_REQUEST)
                .send(
                    "Allowed values for activation_status is only ACTIVE or INACTIVE"
                );
        }
        //validate allowed_transactions status
        if (
            data.transactions_allowed &&
            !validTransactionsAllowed.includes(data.transactions_allowed)
        ) {
            return res
                .status(http_status_code.BAD_REQUEST)
                .send(
                    "Allowed values for transactions_allowed is only CREDIT or DEBIT or BOTH"
                );
        }
        const result = await accountModel.createNewAccount(data);
        return res.status(http_status_code.OK).json(result.rows[0]);
    } catch (err) {
        console.log(err);
        return res
            .status(http_status_code.INTERNAL_SERVER_ERROR)
            .send("unexpected server error");
    }
}

async function getAccounts(req, res) {
    try {
        // required fields validation
        const business_id = req.user.businessId;
        if (!business_id) {
            return res
                .status(http_status_code.BAD_REQUEST)
                .send("Business ID is required");
        }
        // fetch all accounts
        const accounts = await accountModel.getAllAccountsByBusinessId(business_id);
        return res.status(http_status_code.OK).json(accounts.rows);
    } catch (err) {
        console.log(err);
        return res
            .status(http_status_code.INTERNAL_SERVER_ERROR)
            .send("Unexpected server error");
    }
}

async function getAccountBalance(req, res) {
    try {
        const account_id = req.params.account_id;
        // account exist
        const accountDetails = await accountModel.getAccountById(account_id);
        if (!accountDetails) {
            return res
                .status(http_status_code.BAD_REQUEST)
                .send("Invalid account id");
        }
        return res
            .status(http_status_code.OK)
            .send({ "Account Balance": accountDetails.balance });
    } catch (err) {
        console.log(err);
        return res
            .status(http_status_code.INTERNAL_SERVER_ERROR)
            .send("unexpected server error");
    }
}

module.exports = { createAccount, getAccounts, getAccountBalance };