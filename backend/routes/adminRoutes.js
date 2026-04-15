const express = require("express");
const router = express.Router();
const User = require("../models/User");

/* =========================
   GET ALL USERS
========================= */
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/* =========================
   CREATE USER
========================= */
router.post("/", async (req, res) => {
  try {
    const { name, username, password, role, managerId } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const existingUser = await User.findOne({ username: username.trim() });

    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const newUser = new User({
      name: name.trim(),
      username: username.trim(),
      password,
      role,
      managerId: role === "employee" ? managerId || null : null
    });

    await newUser.save();

    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
});

/* =========================
   UPDATE USER
========================= */
router.put("/:id", async (req, res) => {
  try {
    const { name, username, password, role, managerId } = req.body;

    const existingUser = await User.findById(req.params.id);

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const usernameOwner = await User.findOne({
      username: username.trim(),
      _id: { $ne: req.params.id }
    });

    if (usernameOwner) {
      return res.status(400).json({ message: "Username already exists" });
    }

    existingUser.name = name?.trim() || existingUser.name;
    existingUser.username = username?.trim() || existingUser.username;
    existingUser.role = role || existingUser.role;
    existingUser.managerId =
      (role || existingUser.role) === "employee" ? managerId || null : null;

    if (password && password.trim() !== "") {
      existingUser.password = password;
    }

    await existingUser.save();

    res.json({ message: "User updated successfully", user: existingUser });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});

/* =========================
   RESET PASSWORD
========================= */
router.put("/:id/reset-password", async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.trim() === "") {
      return res.status(400).json({ message: "New password is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { password: password.trim() },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

/* =========================
   DELETE USER
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

module.exports = router;