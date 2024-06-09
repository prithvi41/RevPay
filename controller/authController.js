const businessModel = require("../model/business");
const bcrypt = require("bcrypt");
const http_status_code = require("../utils/httpStatusCode");
const jwt = require("../utils/jwtGenerator");

// register a business
async function registerBusiness(req, res) {
    try {
        const data = req.body;
        // data validation
        if(!data.user_name || !data.password || !data.business_name) {
            return res.status(http_status_code.BAD_REQUEST).send("missing required fields");
        }
        if(data.password && data.password.length < 8) {
            return res.status(http_status_code.UNAUTHORIZED).send("minimum 8 length of password is required");
        }
        const businessExist = await businessModel.getBusinessByUserName(data.user_name);
        if(businessExist && businessExist.rows.length > 0) {
            return res.status(http_status_code.BAD_REQUEST).send("business already registered");
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPasssword = await bcrypt.hash(data.password, salt);
        data.password = hashedPasssword;
        const result = await businessModel.createUser(data);
        return res.status(http_status_code.CREATED).send({message : "business registered successfully"});
    }
    catch(err) {
        console.log(err);
        return res.status(http_status_code.INTERNAL_SERVER_ERROR).send("unexpected server error");
    }
}

// login 
async function loginBusiness(req, res) {
    try {
        const data = req.body;
        if(!data.user_name || !data.password) {
            return res.status(http_status_code.BAD_REQUEST).send("missing required fields");
        }
        const businessExist = await businessModel.getBusinessByUserName(data.user_name);
        if(businessExist.rows.length === 0) {
            return res.status(http_status_code.BAD_REQUEST).send("business not registered");
        }
        const passwordMatch = await bcrypt.compare(data.password, businessExist.rows[0].password);
        if(!passwordMatch) {
            return res.status(http_status_code.BAD_REQUEST).send("wrong password");
        }
        const token = await jwt.jwtGenerator(data.user_name, businessExist.rows[0].id);
        return res.status(http_status_code.OK).send({Token : token});
    }
    catch(err) {
        console.log(err);
        return res.status(http_status_code.INTERNAL_SERVER_ERROR).send("unexpected server error");
    }
}

module.exports = { registerBusiness, loginBusiness };
