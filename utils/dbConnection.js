const { Client } = require('pg');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const client = new Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    database: process.env.PGDB
});

client.connect((err) => {
    if (err) {
        console.log(err);
        return new Error("Unable to connect to the database");
    }
    const schemaPath = path.join('model/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    client.query(schema, (err) => {
        if (err) {
            console.log(err);
            return new Error("unexpected error");
        }
        console.log("schema created successfully");
    })
});

module.exports = client;
