const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["public", "corporate"],
      default: "corporate"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Holiday", holidaySchema);