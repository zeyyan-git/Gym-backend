const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      // Format: MFG + 3-4 digit number, e.g. MFG001, MFG1024
      match: /^MFG\d{3,4}$/,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },
    monthlyFee: {
      type: Number,
      required: [true, "Monthly fee is required"],
      min: 0,
    },
    feeSubmissionDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Virtual: next fee due date = feeSubmissionDate + 1 month (fee is always monthly)
memberSchema.virtual("nextDueDate").get(function () {
  const due = new Date(this.feeSubmissionDate);
  due.setMonth(due.getMonth() + 1);
  return due;
});

// Virtual: fee status -> "Paid" if within the current month, "Overdue" otherwise
memberSchema.virtual("feeStatus").get(function () {
  const due = new Date(this.feeSubmissionDate);
  due.setMonth(due.getMonth() + 1);
  return due < new Date() ? "Overdue" : "Paid";
});

memberSchema.set("toJSON", { virtuals: true });
memberSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Member", memberSchema);
