const accountModel = require('../model/account');
const http_status_code = require("../utils/httpStatusCode");

async function createAccount(req, res) {
    try {
        const data = {
            ...req.body,
            business_id : req.user.businessId
        };
        if(!data.account_number || !data.ifsc_code) {
            return res.send(http_status_code.BAD_REQUEST).send("missing required fields");
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