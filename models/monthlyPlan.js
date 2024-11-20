// models/monthlyPlans.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const monthlyPlanSchema = new Schema(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: "Student",
      required: false // Agora é opcional para permitir planos template
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    graduationScopes: {
      type: [String],
      enum: ["internal", "regional", "national"],
      required: true,
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: "Pelo menos um escopo de graduação deve ser especificado"
      }
    }
  },
  {
    timestamps: true,
    collection: "monthly_plans", // Corrigido para monthly_plans
  }
);

const MonthlyPlan = mongoose.model("MonthlyPlan", monthlyPlanSchema);
module.exports = MonthlyPlan;
