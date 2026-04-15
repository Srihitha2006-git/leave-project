const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    total: {
      type: Number,
      default: 20
    },
    used: {
      type: Number,
      default: 0
    },
    remaining: {
      type: Number,
      default: 20
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeaveBalance", leaveBalanceSchema);