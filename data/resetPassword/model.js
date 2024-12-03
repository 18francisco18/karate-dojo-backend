const mongoose = require('mongoose');

const ResetPasswordSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  resetCode: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Documento expira após 1 hora
  }
});

const ResetPasswordModel = mongoose.model('ResetPassword', ResetPasswordSchema);

module.exports = ResetPasswordModel;
