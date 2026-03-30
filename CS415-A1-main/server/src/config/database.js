const { Sequelize } = require("sequelize");

const DB_NAME = process.env.DB_NAME || "bof_banking_db";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = "DB_PASSWORD" in process.env ? process.env.DB_PASSWORD : "";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || 3306);

// Use environment variables when provided; defaults match current local setup.
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: "mysql",
  port: DB_PORT,
  logging: false,
});

module.exports = sequelize;
