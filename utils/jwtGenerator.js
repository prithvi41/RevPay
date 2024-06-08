const jwt = require('jsonwebtoken');
require('dotenv').config();

async function jwtGenerator(user_name, user_id) {
    const payload = {
        userName : user_name,
        userId : user_id
    };
    return jwt.sign(payload, process.env.SECRET_KEY, {expiresIn : 60 * 60});
} 

module.exports = { jwtGenerator };