const express = require("express");
app = express();
require("dotenv").config();
app.use(express.json());
const authRoute = require('./route/authRouter');

app.use('/', authRoute);

app.listen(process.env.port, async(req, res) => {
    console.log(`server is running on port: ${process.env.port}`);
})