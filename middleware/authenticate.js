const jwt = require('jsonwebtoken');
const http_status_code = require("../utils/httpStatusCode");
require('dotenv').config();

async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.header("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(http_status_code.UNAUTHORIZED).send("Token not provided");
        }
        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, process.env.SECRET_KEY);
        // assign paylaod to req.user
        req.user = payload;
        next();
    }
    catch (err) {
        console.log(err);
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(http_status_code.UNAUTHORIZED).send("Token expired");
        }
        else if (err instanceof jwt.JsonWebTokenError) {
            return res.status(http_status_code.UNAUTHORIZED).send("Invalid token provided");
        }
        else {
            return res.status(http_status_code.INTERNAL_SERVER_ERROR).send("unexpected server error");
        }
    }
}

module.exports = authenticateToken;