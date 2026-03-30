const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  nationalId: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '',
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active',
  },
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lockedUntil: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  tin: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  residencyStatus: {
    type: DataTypes.STRING,
    defaultValue: 'resident',
  },
  identityVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  registrationStatus: {
    type: DataTypes.STRING,
    defaultValue: 'approved',
  },
}, {
  tableName: 'customers',
  timestamps: true,
});

module.exports = Customer;
