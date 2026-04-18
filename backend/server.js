require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Holiday = require("./models/Holiday");

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const usersFile = path.join(dataDir, "users.json");
const leaveRequestsFile = path.join(dataDir, "leaveRequests.json");
const leaveBalancesFile = path.join(dataDir, "leaveBalances.json");

function ensureFile(filePath, defaultData) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}

ensureFile(usersFile, [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    role: "admin",
    name: "Admin",
    managerId: null
  },
  {
    id: 2,
    username: "manager1",
    password: "manager123",
    role: "manager",
    name: "Manager One",
    managerId: null
  },
  {
    id: 3,
    username: "employee1",
    password: "employee123",
    role: "employee",
    name: "Employee One",
    managerId: 2
  }
]);

ensureFile(leaveRequestsFile, []);
ensureFile(leaveBalancesFile, [
  { userId: 3, total: 20, used: 0, remaining: 20 }
]);

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function formatDate(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function generatePublicHolidays(year) {
  return [
    { id: `pub-${year}-01`, title: "New Year", date: `${year}-01-01`, type: "public" },
    { id: `pub-${year}-02`, title: "Republic Day", date: `${year}-01-26`, type: "public" },
    { id: `pub-${year}-03`, title: "Independence Day", date: `${year}-08-15`, type: "public" },
    { id: `pub-${year}-04`, title: "Gandhi Jayanti", date: `${year}-10-02`, type: "public" },
    { id: `pub-${year}-05`, title: "Christmas", date: `${year}-12-25`, type: "public" }
  ];
}

async function getAllHolidays() {
  const dbHolidays = await Holiday.find().sort({ date: 1 }).lean();

  const currentYear = new Date().getFullYear();

  const publicHolidays = [
    ...generatePublicHolidays(currentYear),
    ...generatePublicHolidays(currentYear + 1)
  ];

  const merged = [...publicHolidays, ...dbHolidays];

  const uniqueMap = new Map();
  for (const holiday of merged) {
    const key = `${holiday.date}-${holiday.title}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, {
        ...holiday,
        type: holiday.type || "corporate"
      });
    }
  }

  return Array.from(uniqueMap.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
}

function getDatesBetween(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

async function calculateLeaveDays(startDate, endDate) {
  const allHolidays = await getAllHolidays();
  const holidayDates = new Set(allHolidays.map((h) => h.date));
  const dates = getDatesBetween(startDate, endDate);

  let leaveDays = 0;
  for (const d of dates) {
    const day = new Date(d).getDay();
    const isSunday = day === 0;
    const isHoliday = holidayDates.has(d);

    if (!isSunday && !isHoliday) {
      leaveDays += 1;
    }
  }

  return leaveDays;
}

/* LOGIN */
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const users = readJSON(usersFile);

  const user = users.find(
    (u) =>
      String(u.username).trim() === String(username).trim() &&
      String(u.password) === String(password)
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({
    message: "Login successful",
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      managerId: user.managerId || null
    }
  });
});

/* USERS */
app.get("/api/users", (req, res) => {
  const users = readJSON(usersFile);
  res.json(users);
});

app.post("/api/users", (req, res) => {
  const { username, password, role, name, managerId } = req.body;
  const users = readJSON(usersFile);
  const leaveBalances = readJSON(leaveBalancesFile);

  if (!username || !password || !role || !name) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const exists = users.find(
    (u) => u.username.toLowerCase() === String(username).trim().toLowerCase()
  );

  if (exists) {
    return res.status(400).json({ message: "Username already exists" });
  }

  let finalManagerId = null;

  if (role === "employee") {
    if (!managerId) {
      return res.status(400).json({ message: "Manager is required for employee" });
    }

    const managerExists = users.find(
      (u) => Number(u.id) === Number(managerId) && u.role === "manager"
    );

    if (!managerExists) {
      return res.status(400).json({ message: "Invalid manager selected" });
    }

    finalManagerId = Number(managerId);
  }

  const newUser = {
    id: Date.now(),
    username: String(username).trim(),
    password,
    role,
    name: String(name).trim(),
    managerId: finalManagerId
  };

  users.push(newUser);
  writeJSON(usersFile, users);

  if (role === "employee") {
    leaveBalances.push({
      userId: newUser.id,
      total: 20,
      used: 0,
      remaining: 20
    });
    writeJSON(leaveBalancesFile, leaveBalances);
  }

  res.json({ message: "User created successfully", user: newUser });
});

app.put("/api/users/:id", (req, res) => {
  const id = Number(req.params.id);
  const { name, username, password, role, managerId } = req.body;

  const users = readJSON(usersFile);
  let leaveBalances = readJSON(leaveBalancesFile);

  const userIndex = users.findIndex((u) => Number(u.id) === id);
  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  const currentUser = users[userIndex];

  if (!name || !username || !role) {
    return res.status(400).json({ message: "Name, username and role are required" });
  }

  const duplicate = users.find(
    (u) =>
      Number(u.id) !== id &&
      u.username.toLowerCase() === String(username).trim().toLowerCase()
  );

  if (duplicate) {
    return res.status(400).json({ message: "Username already exists" });
  }

  let finalManagerId = null;

  if (role === "employee") {
    if (!managerId) {
      return res.status(400).json({ message: "Manager is required for employee" });
    }

    const managerExists = users.find(
      (u) => Number(u.id) === Number(managerId) && u.role === "manager"
    );

    if (!managerExists) {
      return res.status(400).json({ message: "Invalid manager selected" });
    }

    if (Number(managerId) === id) {
      return res.status(400).json({ message: "Employee cannot be their own manager" });
    }

    finalManagerId = Number(managerId);
  }

  users[userIndex] = {
    ...currentUser,
    name: String(name).trim(),
    username: String(username).trim(),
    password: password ? password : currentUser.password,
    role,
    managerId: finalManagerId
  };

  if (role === "employee") {
    const hasBalance = leaveBalances.some((b) => Number(b.userId) === id);
    if (!hasBalance) {
      leaveBalances.push({
        userId: id,
        total: 20,
        used: 0,
        remaining: 20
      });
    }
  } else {
    leaveBalances = leaveBalances.filter((b) => Number(b.userId) !== id);
  }

  writeJSON(usersFile, users);
  writeJSON(leaveBalancesFile, leaveBalances);

  res.json({
    message: "User updated successfully",
    user: users[userIndex]
  });
});

/* RESET PASSWORD */
app.put("/api/users/:id/reset-password", (req, res) => {
  const id = Number(req.params.id);
  const { password } = req.body;

  const users = readJSON(usersFile);
  const userIndex = users.findIndex((u) => Number(u.id) === id);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!password || String(password).trim() === "") {
    return res.status(400).json({ message: "New password is required" });
  }

  users[userIndex].password = String(password).trim();
  writeJSON(usersFile, users);

  res.json({ message: "Password reset successful" });
});

app.delete("/api/users/:id", (req, res) => {
  const id = Number(req.params.id);
  let users = readJSON(usersFile);
  let leaveBalances = readJSON(leaveBalancesFile);
  let leaveRequests = readJSON(leaveRequestsFile);

  const userToDelete = users.find((u) => u.id === id);

  if (!userToDelete) {
    return res.status(404).json({ message: "User not found" });
  }

  users = users.filter((u) => u.id !== id);

  if (userToDelete.role === "manager") {
    users = users.map((u) => {
      if (Number(u.managerId) === id) {
        return { ...u, managerId: null };
      }
      return u;
    });
  }

  if (userToDelete.role === "employee") {
    leaveBalances = leaveBalances.filter((b) => b.userId !== id);
    leaveRequests = leaveRequests.filter((r) => r.userId !== id);
  }

  writeJSON(usersFile, users);
  writeJSON(leaveBalancesFile, leaveBalances);
  writeJSON(leaveRequestsFile, leaveRequests);

  res.json({ message: "User deleted successfully" });
});

/* HOLIDAYS - NOW FROM MONGODB */
app.get("/api/holidays", async (req, res) => {
  try {
    const holidays = await getAllHolidays();
    res.json(holidays);
  } catch (error) {
    console.error("HOLIDAYS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch holidays" });
  }
});

app.post("/api/holidays", async (req, res) => {
  try {
    const { title, date, type } = req.body;

    if (!title || !date) {
      return res.status(400).json({ message: "Title and date are required" });
    }

    const finalType = type === "public" ? "public" : "corporate";

    const exists = await Holiday.findOne({
      title: String(title).trim(),
      date
    });

    if (exists) {
      return res.status(400).json({ message: "Holiday already exists" });
    }

    const newHoliday = await Holiday.create({
      title: String(title).trim(),
      date,
      type: finalType
    });

    res.json({ message: "Holiday added successfully", holiday: newHoliday });
  } catch (error) {
    console.error("Add holiday error:", error);
    res.status(500).json({ message: "Failed to add holiday" });
  }
});

app.delete("/api/holidays/:id", async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    if (holiday.type === "public") {
      return res.status(400).json({ message: "Public holidays cannot be deleted" });
    }

    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ message: "Holiday deleted successfully" });
  } catch (error) {
    console.error("Delete holiday error:", error);
    res.status(500).json({ message: "Failed to delete holiday" });
  }
});

/* LEAVE BALANCE */
app.get("/api/leave-balance/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  const balances = readJSON(leaveBalancesFile);
  const balance = balances.find((b) => b.userId === userId);

  if (!balance) {
    return res.status(404).json({ message: "Leave balance not found" });
  }

  res.json(balance);
});

/* LEAVE PREVIEW */
app.post("/api/leave-preview", async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.body;
    const balances = readJSON(leaveBalancesFile);
    const balance = balances.find((b) => b.userId === Number(userId));

    if (!balance) {
      return res.status(404).json({ message: "Leave balance not found" });
    }

    const requestedDays = await calculateLeaveDays(startDate, endDate);
    const previewRemaining = balance.remaining - requestedDays;

    res.json({
      requestedDays,
      currentRemaining: balance.remaining,
      previewRemaining
    });
  } catch (error) {
    console.error("Leave preview error:", error);
    res.status(500).json({ message: "Failed to preview leave" });
  }
});

/* APPLY LEAVE */
app.post("/api/leave-request", async (req, res) => {
  try {
    const { userId, startDate, endDate, reason, leaveType } = req.body;
    const leaveRequests = readJSON(leaveRequestsFile);

    const requestedDays = await calculateLeaveDays(startDate, endDate);

    const newRequest = {
      id: Date.now(),
      userId: Number(userId),
      startDate,
      endDate,
      reason,
      leaveType: leaveType || "General",
      requestedDays,
      status: "pending",
      appliedAt: new Date().toISOString()
    };

    leaveRequests.push(newRequest);
    writeJSON(leaveRequestsFile, leaveRequests);

    res.json({ message: "Leave request submitted", request: newRequest });
  } catch (error) {
    console.error("Apply leave error:", error);
    res.status(500).json({ message: "Failed to submit leave request" });
  }
});

/* EMPLOYEE LEAVE HISTORY */
app.get("/api/leave-history/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  const leaveRequests = readJSON(leaveRequestsFile);
  const history = leaveRequests.filter((r) => r.userId === userId);
  res.json(history);
});

/* GENERAL REQUESTS */
app.get("/api/leave-requests", (req, res) => {
  const leaveRequests = readJSON(leaveRequestsFile);
  res.json(leaveRequests);
});

/* MANAGER - ALL REQUESTS */
app.get("/api/manager/leave-requests", (req, res) => {
  const managerId = Number(req.query.managerId);
  const leaveRequests = readJSON(leaveRequestsFile);
  const users = readJSON(usersFile);

  let result = leaveRequests.map((r) => {
    const user = users.find((u) => u.id === r.userId);
    return {
      ...r,
      employeeName: user ? user.name : "Unknown Employee",
      managerId: user ? user.managerId || null : null
    };
  });

  if (managerId) {
    result = result.filter((r) => Number(r.managerId) === managerId);
  }

  res.json(result);
});

/* MANAGER APPROVE / REJECT */
app.put("/api/manager/leave-requests/:id", (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  const leaveRequests = readJSON(leaveRequestsFile);
  const balances = readJSON(leaveBalancesFile);

  const request = leaveRequests.find((r) => r.id === id);
  if (!request) {
    return res.status(404).json({ message: "Leave request not found" });
  }

  if (request.status !== "pending") {
    return res.status(400).json({ message: "Request already processed" });
  }

  request.status = status;

  if (status === "approved") {
    const balance = balances.find((b) => b.userId === request.userId);
    if (balance) {
      balance.used += request.requestedDays;
      balance.remaining -= request.requestedDays;
    }
    writeJSON(leaveBalancesFile, balances);
  }

  writeJSON(leaveRequestsFile, leaveRequests);
  res.json({ message: `Leave request ${status}` });
});

/* OPTIONAL ALTERNATE ROUTE */
app.put("/api/leave-requests/:id", (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  const leaveRequests = readJSON(leaveRequestsFile);
  const balances = readJSON(leaveBalancesFile);

  const request = leaveRequests.find((r) => r.id === id);
  if (!request) {
    return res.status(404).json({ message: "Leave request not found" });
  }

  if (request.status !== "pending") {
    return res.status(400).json({ message: "Request already processed" });
  }

  request.status = status;

  if (status === "approved") {
    const balance = balances.find((b) => b.userId === request.userId);
    if (balance) {
      balance.used += request.requestedDays;
      balance.remaining -= request.requestedDays;
    }
    writeJSON(leaveBalancesFile, balances);
  }

  writeJSON(leaveRequestsFile, leaveRequests);
  res.json({ message: `Leave request ${status}` });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  })
  .catch((err) => {
    console.error("MongoDB error:", err);
  });

