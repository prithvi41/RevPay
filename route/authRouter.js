const express = require("express");
const router = express.Router();
const authController = require('../controller/authController');

router.post('/register', authController.registerBusiness);
router.post('/login', authController.loginBusiness);

module.exports = router;