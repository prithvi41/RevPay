const transactionModel = require("../model/transaction");
const http_status_code = require("../utils/httpStatusCode");
const accountModel = require("../model/account");

async function newTransaction(req, res) {
    try {
        const data = req.body;
        // required fields validation
        if (
            !data.account_id ||
            !data.amount ||
            !data.beneficiary_account_number
        ) {
            return res
                .status(http_status_code.BAD_REQUEST)
                .send("Missing required fields");
        }
        const amount = parseFloat(data.amount);
        // amount validation
        if (amount <= 0) {
            return res
                .status(http_status_code.BAD_REQUEST)
                .send("please enter a valid amount");
        }
        // get account info of sender
        const senderAccountInfo = await accountModel.getAccountById(
            data.account_id
        );
        // account exists or not
        if (!senderAccountInfo) {
            return res.status(http_status_code.BAD_REQUEST).send("Account not found");
        }
        // if account_id belongs to currently logged business
        if (req.user.businessId != senderAccountInfo.business_id) {
            return res
                .status(http_status_code.UNAUTHORIZED)
                .send("unauthorized transactions, account id is not correct");
        }
        // sender account status
        if (senderAccountInfo.activation_status === "INACTIVE") {
            return res
                .status(http_status_code.BAD_REQUEST)
                .send("your account is inactive");
        }
        // withdrawl status
        if (senderAccountInfo.transaction_allowed === "CREDIT") {
            return res
                .status(http_status_code.BAD_REQUEST)
                .send("withdrawl is not allowed for your account");
        }
        // amount availability
        if (parseFloat(senderAccountInfo.balance) - amount < 0) {
            return res.status(http_status_code.BAD_REQUEST).send("insufficient balance to transfer");
        }
        // daily withdrawl limit for a day
        const total_withdrawl = await transactionModel.getDailyWithdrawnAmount(data.account_id);
        if (parseFloat(total_withdrawl) + amount > parseFloat(senderAccountInfo.daily_withdrawl_limit)) {
            return res
                .status(http_status_code.UNAUTHORIZED)
                .send("daily withdrawl limit reached");
        }
        //get account info of receiver
        const receiverAccountInfo = await accountModel.getAccountByAccountNumber(
            data.beneficiary_account_number
        );
        if (!receiverAccountInfo) {
            return res
                .status(http_status_code.BAD_REQUEST)
                .send("Beneficiary Account not found");
        }
        // receiver account status
        if (receiverAccountInfo.activation_status === "INACTIVE") {
            return res
                .status(http_status_code.BAD_REQUEST)
                .send("Receiver's account is inactive");
        }
        // deposit status
        if (receiverAccountInfo.transaction_allowed === "DEBIT") {
            return res
                .status(http_status_code.BAD_REQUEST)
                .send("deposit is not allowed for beneficiary's account");
        }
        // update account balance and create transaction entry
        const newSenderBalance = parseFloat(senderAccountInfo.balance) - amount;
        const newReceiverBalance = parseFloat(receiverAccountInfo.balance) + amount;
        const transactionData = {
            sender_account_id: senderAccountInfo.id,
            sender_account_number: senderAccountInfo.account_number,
            sender_account_balance: newSenderBalance,
            receiver_account_id: receiverAccountInfo.id,
            receiver_account_number: receiverAccountInfo.account_number,
            receiver_account_balance: newReceiverBalance,
            transaction_amount: amount
        };
        const result = await accountModel.updateBalanceAndCreateTransactions(
            transactionData
        );
        return res.status(http_status_code.CREATED).send(result);
    } catch (err) {
        console.log(err);
        return res
            .status(http_status_code.INTERNAL_SERVER_ERROR)
            .send("unexpected server error");
    }
}

module.exports = { newTransaction };
