// models/TempUser.js
const mongoose = require('mongoose');

const tempUserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  signupIP: String,
  verificationCode: String,
  expiresAt: { type: Date, default: () => Date.now() + 10 * 60 * 1000 } // 10 min
});

module.exports = mongoose.model('TempUser', tempUserSchema);