const express = require("express");
app = express();
require("dotenv").config();
app.use(express.json());
const authRoute = require('./route/authRouter');
const accountRoute = require('./route/accountRouter');

app.use('/', authRoute);
app.use('/accounts', accountRoute);

app.listen(process.env.port, async(req, res) => {
    console.log(`server is running on port: ${process.env.port}`);
})