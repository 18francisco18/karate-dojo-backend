let mongoose = require("mongoose");
let Schema = mongoose.Schema;
let scopes = require("./scopes");

let RoleSchema = new Schema({
  name: { type: String, required: true },
  scope: [
    {
      type: String,
      enum: [scopes.Admin, scopes.Student],
    },
  ],
});

let userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  role: { type: RoleSchema, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  monthlyFees: [{ date: Date, status: String }],
  graduations: [{ level: String, date: Date }],

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

let User = mongoose.model("User", userSchema);
module.exports = User;
