// models/graduations.js
let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let graduationSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: "Student" },
  level: {
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
  date: { type: Date, default: Date.now },
  score: { type: Number, min: 0, max: 100 },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor" },
  location: { type: String },
  comments: { type: String },
  certificateUrl: { type: String },
  availableSlots: { type: Number, required: true },
  enrolledStudents: [{ type: Schema.Types.ObjectId, ref: "Student" }],
});

let Graduation = mongoose.model("Graduation", graduationSchema);
module.exports = Graduation;
