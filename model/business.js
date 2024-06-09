const client = require("../utils/dbConnection");
const query_error = require("../utils/enum");
async function createUser(data) {
  try {
    const query = `INSERT INTO BUSINESSES (user_name, password, business_name) VALUES ($1, $2, $3)`;
    const values = [data.user_name, data.password, data.business_name];
    const result = await client.query(query, values);
    return result;
  } 
  catch (err) {
    console.log(err);
    throw new Error(query_error);
  }
}

async function getBusinessByUserName(user_name) {
  try {
    const query = `SELECT * FROM BUSINESSES WHERE user_name = $1`;
    const values = [user_name];
    const result = await client.query(query, values);
    return result;
  } 
  catch (err) {
    console.log(err);
    throw new Error(query_error);
  }
}

module.exports = { getBusinessByUserName, createUser };
