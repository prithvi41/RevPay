const express = require("express");
app = express();
require("dotenv").config();
app.use(express.json());
const authRoute = require('./route/authRouter');
const accountRoute = require('./route/accountRouter');
const transactionRoute = require('./route/transactionRouter');

app.use('/', authRoute);
app.use('/accounts', accountRoute);
app.use('/transaction', transactionRoute);

app.listen(process.env.port, async(req, res) => {
    console.log(`server is running on port: ${process.env.port}`);
})