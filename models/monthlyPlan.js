// models/monthlyPlans.js
let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let monthlyPlanSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["Basic", "Standard", "Premium"],
    required: true,
  },
  price: {
    type: Number,
    required: true,
    default: function () {
      switch (this.type) {
        case "Basic":
          return 50;
        case "Standard":
          return 100;
        case "Premium":
          return 150;
        default:
          return 0;
      }
    },
  },
}, {
  collection: 'monthly_plans'
});

module.exports = mongoose.model("MonthlyPlan", monthlyPlanSchema);
