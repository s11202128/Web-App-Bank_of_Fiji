const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StatementRequest = sequelize.define('StatementRequest', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  customerId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  accountId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  accountHolder: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  accountNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fromDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  toDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
  },
  adminNote: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reviewedBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'statement_requests',
  timestamps: true,
});

module.exports = StatementRequest;
