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
      "azul",
      "laranja",
      "verde",
      "roxo",
      "castanho",
      "preto"
    ],
    required: true,
  },
  scope: {
    type: String,
    enum: ["internal", "regional", "national"],
    required: true,
  },
  date: { type: Date, default: Date.now },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor" },
  location: { type: String },
  availableSlots: { type: Number, required: true },
  enrolledStudents: [{ type: Schema.Types.ObjectId, ref: "Student" }],
  studentEvaluations: [{
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    score: { type: Number, min: 0, max: 100 },
    comments: { type: String },
    evaluatedBy: { type: Schema.Types.ObjectId, ref: "Instructor" },
    evaluationDate: { type: Date },
    diplomaPath: { type: String }
  }]
}, {
  collection: 'graduations'
});

let Graduation = mongoose.model("Graduation", graduationSchema);
module.exports = Graduation;
