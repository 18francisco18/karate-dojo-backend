const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const monthlyFeeSchema = new Schema({
  student: { 
    type: Schema.Types.ObjectId, 
    ref: "Student", 
    required: true 
  },
  plan: { 
    type: Schema.Types.ObjectId, 
    ref: "MonthlyPlan", 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0 
  },
  dueDate: {
    type: Date,
    required: true
  },
  paymentDate: { 
    type: Date 
  },
  status: {
    type: String,
    enum: ["pending", "paid", "late", "cancelled"],
    default: "pending"
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "card", "transfer"],
    required: function() {
      return this.status === "paid";
    }
  },
  transactionId: { 
    type: String 
  },
  notes: { 
    type: String 
  },
  receiptPath: {
    type: String,
    default: null,
    get: function(value) {
      console.log('Getting receiptPath:', value); // Para debug
      return value;
    },
    set: function(value) {
      console.log('Setting receiptPath:', value); // Para debug
      return value;
    }
  }
}, {
  timestamps: true,
  collection: "monthly_fees"
});

// Middleware para atualizar status para "late" se passou da data de vencimento
monthlyFeeSchema.pre("save", function(next) {
  if (this.status === "pending" && this.dueDate < new Date()) {
    this.status = "late";
  }
  next();
});

const MonthlyFee = mongoose.model("MonthlyFee", monthlyFeeSchema);
module.exports = MonthlyFee;
