const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "store_rating",
  password: "rakshita1523",
  port: 5432,
});

module.exports = pool;