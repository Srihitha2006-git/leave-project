const express = require("express");
const LeaveBalance = require("../models/LeaveBalance");
const LeaveRequest = require("../models/LeaveRequest");
const Holiday = require("../models/Holiday");
const User = require("../models/User");
const { requireRole } = require("../middleware/roleMiddleware");
const { calculateLeaveDays } = require("../utils/leaveCalculator");

const router = express.Router();

router.get("/balance/:userId", requireRole("employee", "manager", "admin"), async (req, res) => {
  try {
    const balance = await LeaveBalance.findOne({ userId: req.params.userId });

    if (!balance) {
      return res.status(404).json({ message: "Balance not found" });
    }

    res.json(balance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/manager/:userId", requireRole("employee", "admin", "manager"), async (req, res) => {
  try {
    const employee = await User.findById(req.params.userId).populate("managerId", "name email");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee.managerId || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/leaves/preview", requireRole("employee"), async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }

    const holidays = await Holiday.find();
    const result = calculateLeaveDays(startDate, endDate, holidays);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/leaves/apply", requireRole("employee"), async (req, res) => {
  try {
    const { userId, leaveType, startDate, endDate, description } = req.body;

    if (!userId || !leaveType || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const employee = await User.findById(userId);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (!employee.managerId) {
      return res.status(400).json({ message: "No manager assigned to this employee" });
    }

    const holidays = await Holiday.find();
    const result = calculateLeaveDays(startDate, endDate, holidays);

    const newRequest = await LeaveRequest.create({
      userId,
      managerId: employee.managerId,
      leaveType,
      startDate,
      endDate,
      description: description || "",
      totalSelectedDays: result.totalSelectedDays,
      finalLeaveDays: result.finalLeaveDays,
      excludedHolidays: result.excludedHolidays,
      status: "Pending"
    });

    res.json(newRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/leaves/user/:userId", requireRole("employee", "manager", "admin"), async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;