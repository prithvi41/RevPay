const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const transactionController = require("../controller/transactionController");

router.post('/fundTransfer', authenticate, transactionController.newTransaction);

module.exports = router;