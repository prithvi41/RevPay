const express = require("express");
app = express();
require("dotenv").config();
app.use(express.json());

app.listen(process.env.port, async(req, res) => {
    console.log(`server is running on port: ${process.env.port}`);
})