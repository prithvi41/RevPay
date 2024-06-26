const express = require("express");
const router = express.Router();
const accountController = require("../controller/accountController");
const authenticate = require("../middleware/authenticate");

router.post('/new', authenticate, accountController.createAccount);
router.get('/allAccounts', authenticate, accountController.getAccounts);
router.get('/balance/:account_id', authenticate, accountController.getAccountBalance);

module.exports = router;