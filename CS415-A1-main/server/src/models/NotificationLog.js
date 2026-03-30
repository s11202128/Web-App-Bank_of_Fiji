const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationLog = sequelize.define('NotificationLog', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  notificationType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'SMS_ALERT',
  },
  deliveryStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
  },
  providerMessageId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'notification_logs',
  timestamps: true,
});

module.exports = NotificationLog;
