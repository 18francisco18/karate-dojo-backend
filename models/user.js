let mongoose = require("mongoose");
let Schema = mongoose.Schema;
let scopes = require("../data/users/scopes");
let MonthlyFee = require("./monthlyFee");
let MonthlyPlan = require("./monthlyPlan");
let Graduation = require("./graduation");

// Instructor schema (inherits base schema)
let instructorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  role: { type: String, enum: [scopes.Admin], required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
});

// Student schema (inherits base schema)
let studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  role: { type: String, enum: [scopes.Student], required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor" },
  belt: {
    type: String,
    enum: [
      "branco",
      "amarelo",
      "laranja",
      "verde",
      "azul",
      "roxo",
      "castanho",
      "preto",
    ],
    required: true,
  },
  monthlyFee: [{ type: mongoose.Schema.Types.ObjectId, ref: "MonthlyFee" }],
  monthlyPlan: [{ type: mongoose.Schema.Types.ObjectId, ref: "MonthlyPlan" }],
  graduation: [{ type: mongoose.Schema.Types.ObjectId, ref: "Graduation" }],
  suspended: { type: Boolean, default: false }, 
});

// Create models
let Instructor = mongoose.model("Instructor", instructorSchema);
let Student = mongoose.model("Student", studentSchema);
module.exports = { Instructor, Student };
