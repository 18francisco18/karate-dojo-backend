const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const scopes = require("../data/users/scopes");
const MonthlyFee = require("./monthlyFee");
const MonthlyPlan = require("./monthlyPlan");
const Graduation = require("./graduation");

// Função de validação de email
const validateEmail = function(email) {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

// Função de validação de senha
const validatePassword = function(password) {
  return password.length >= 8;
};

// Schema base com campos comuns
const baseSchema = {
  name: { 
    type: String, 
    required: [true, 'Nome é obrigatório'],
    trim: true,
    minlength: [2, 'Nome deve ter pelo menos 2 caracteres']
  },
  email: { 
    type: String, 
    required: [true, 'Email é obrigatório'],
    validate: [validateEmail, 'Email inválido'],
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: [true, 'Senha é obrigatória'],
    validate: [validatePassword, 'Senha deve ter pelo menos 8 caracteres']
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true
  }
};

// Instructor schema
const instructorSchema = new Schema({
  ...baseSchema,
  role: {
    type: String,
    default: scopes.Admin,
    required: true
  },
  students: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Student" 
  }]
}, {
  timestamps: true,
  collection: 'instructors'
});

// Student schema
const studentSchema = new Schema({
  ...baseSchema,
  role: {
    type: String,
    default: scopes.Student,
    required: true
  },
  instructor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Instructor",
    required: false
  },
  belt: {
    type: String,
    enum: [
      "branco",
      "amarelo",
      "azul",
      "laranja",
      "verde",
      "roxo",
      "castanho",
      "preto"
    ],
    required: [true, 'Faixa é obrigatória'],
    default: "branco"
  },
  monthlyFee: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "MonthlyFee" 
  }],
  monthlyPlan: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "MonthlyPlan" 
  },
  graduation: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Graduation" 
  }],
  suspended: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true,
  collection: 'students'
});

// Add unique email indexes
instructorSchema.index({ email: 1 }, { unique: true });
studentSchema.index({ email: 1 }, { unique: true });

// Create models
const Instructor = mongoose.model('Instructor', instructorSchema);
const Student = mongoose.model('Student', studentSchema);

module.exports = { Instructor, Student };
