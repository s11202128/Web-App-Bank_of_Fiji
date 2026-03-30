const sequelize = require('../config/database');
const Customer = require('./Customer');
const Account = require('./Account');
const Transaction = require('./Transaction');
const Bill = require('./Bill');
const Investment = require('./Investment');
const Loan = require('./Loan');
const OtpVerification = require('./OtpVerification');
const Registration = require('./Registration');
const Admin = require('./Admin');
const LoginLog = require('./LoginLog');
const NotificationLog = require('./NotificationLog');
const StatementRequest = require('./StatementRequest');

// Define associations
Customer.hasMany(Account, { foreignKey: 'customerId' });
Account.belongsTo(Customer, { foreignKey: 'customerId' });

Account.hasMany(Transaction, { foreignKey: 'accountNumber', sourceKey: 'accountNumber', constraints: false });
Transaction.belongsTo(Account, { foreignKey: 'accountNumber', targetKey: 'accountNumber', constraints: false });

Customer.hasMany(Bill, { foreignKey: 'customerId' });
Bill.belongsTo(Customer, { foreignKey: 'customerId' });

Customer.hasMany(Investment, { foreignKey: 'customerId' });
Investment.belongsTo(Customer, { foreignKey: 'customerId' });

Customer.hasMany(Loan, { foreignKey: 'customerId' });
Loan.belongsTo(Customer, { foreignKey: 'customerId' });

Customer.hasMany(OtpVerification, { foreignKey: 'customerId' });
OtpVerification.belongsTo(Customer, { foreignKey: 'customerId' });

Customer.hasMany(NotificationLog, { foreignKey: 'userId' });
NotificationLog.belongsTo(Customer, { foreignKey: 'userId' });

Customer.hasMany(StatementRequest, { foreignKey: 'customerId' });
StatementRequest.belongsTo(Customer, { foreignKey: 'customerId' });

Account.hasMany(StatementRequest, { foreignKey: 'accountNumber', sourceKey: 'accountNumber', constraints: false });
StatementRequest.belongsTo(Account, { foreignKey: 'accountNumber', targetKey: 'accountNumber', constraints: false });

Customer.hasMany(LoginLog, { foreignKey: 'userId', constraints: false, scope: { userType: 'customer' } });
Admin.hasMany(LoginLog, { foreignKey: 'userId', constraints: false, scope: { userType: 'admin' } });

module.exports = {
  sequelize,
  Customer,
  Account,
  Transaction,
  Bill,
  Investment,
  Loan,
  OtpVerification,
  Registration,
  Admin,
  LoginLog,
  NotificationLog,
  StatementRequest,
};
