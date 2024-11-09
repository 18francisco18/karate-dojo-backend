let mongoose = require("mongoose");
let Schema = mongoose.Schema;
let scopes = require("../data/users/scopes");
let MonthlyFee = require("./monthlyFee");
let MonthlyPlan = require("./monthlyPlan");
let Graduation = require("./graduation");

let RoleSchema = new Schema({
  name: { type: String, required: true },
  scope: [
    {
      type: String,
      enum: [scopes.Admin, scopes.Student],
    },
  ],
});

let userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  role: { type: RoleSchema, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  monthlyFee: [{ type: mongoose.Schema.Types.ObjectId, ref: "MonthlyFee" }],
  monthlyPlan: [{ type: mongoose.Schema.Types.ObjectId, ref: "MonthlyPlan" }],
  graduation: [{ type: mongoose.Schema.Types.ObjectId, ref: "Graduation" }],

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
});

// Função para aplicar projeção condicional
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  const scopes = user.role.scope || [];

  if (scopes.includes("Admin")) {
    delete user.monthlyFees;
    delete user.graduations;
  }

  if (scopes.includes("Student")) {
    delete user.instructor;
  }

  return user;
};

let User = mongoose.model("User", userSchema);
module.exports = User;
