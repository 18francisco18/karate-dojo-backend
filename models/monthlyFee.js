let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let monthlyFeeSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  amount: { type: Number, required: true },
  startDate: { type: Date, default: Date.now }, // Data de início (data atual)
  dueDate: {
    type: Date,
    required: true,
    default: function () {
      // Define a data limite como 30 dias após o início
      let today = new Date();
      today.setMonth(today.getMonth() + 1); // Um mês depois
      return today;
    },
  },
  status: {
    type: String,
    enum: ["Pago", "Pendente", "Atrasado"],
    default: "Pendente", // Status por padrão é "Pendente"
  },
  method: {
    type: String,
    enum: ["Dinheiro", "Cartão", "Transferência"],
    default: "Dinheiro",
  },
  transactionId: { type: String },
  notes: { type: String },
});

module.exports = mongoose.model("MonthlyFee", monthlyFeeSchema);
