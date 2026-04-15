const express = require("express");
const LeaveRequest = require("../models/LeaveRequest");
const LeaveBalance = require("../models/LeaveBalance");
const User = require("../models/User");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/employees", requireRole("manager"), async (req, res) => {
  try {
    const employees = await User.find({
      role: "employee",
      managerId: req.currentUser._id
    })
      .select("_id name email managerId")
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/leaves", requireRole("manager", "admin"), async (req, res) => {
  try {
    let query = {};

    if (req.currentUser.role === "manager") {
      query.managerId = req.currentUser._id;
    }

    const leaves = await LeaveRequest.find(query)
      .populate("userId", "name email role managerId")
      .populate("managerId", "name email")
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/leaves/:id/status", requireRole("manager", "admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (req.currentUser.role === "manager" && leave.managerId.toString() !== req.currentUser._id.toString()) {
      return res.status(403).json({ message: "You can only manage your assigned employees' requests" });
    }

    leave.status = status;
    await leave.save();

    if (status === "Approved") {
      const balance = await LeaveBalance.findOne({ userId: leave.userId });

      if (balance) {
        if (leave.leaveType === "Earned Leave") balance.earnedLeave -= leave.finalLeaveDays;
        else if (leave.leaveType === "Sick Leave") balance.sickLeave -= leave.finalLeaveDays;
        else if (leave.leaveType === "Volunteering Leave") balance.volunteeringLeave -= leave.finalLeaveDays;
        else if (leave.leaveType === "Relocation Leave") balance.relocationLeave -= leave.finalLeaveDays;
        else if (leave.leaveType === "Compensatory Off (Public Holiday)") balance.compOffPublicHoliday -= leave.finalLeaveDays;
        else if (leave.leaveType === "Compensatory Off (Weekly Off/Back to Back Shifts)") balance.compOffWeeklyOff -= leave.finalLeaveDays;

        await balance.save();
      }
    }

    res.json({ message: `Leave ${status.toLowerCase()} successfully`, leave });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;