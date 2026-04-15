const express = require("express");
const router = express.Router();
const Holiday = require("../models/Holiday");

function generatePublicHolidays(year) {
  return [
    { title: "New Year", date: `${year}-01-01`, type: "public" },
    { title: "Republic Day", date: `${year}-01-26`, type: "public" },
    { title: "Independence Day", date: `${year}-08-15`, type: "public" },
    { title: "Gandhi Jayanti", date: `${year}-10-02`, type: "public" },
    { title: "Christmas", date: `${year}-12-25`, type: "public" }
  ];
}

/* GET ALL HOLIDAYS */
router.get("/", async (req, res) => {
  try {
    const dbHolidays = await Holiday.find().sort({ date: 1 });

    const currentYear = new Date().getFullYear();
    const publicHolidays = [
      ...generatePublicHolidays(currentYear),
      ...generatePublicHolidays(currentYear + 1)
    ];

    const merged = [...publicHolidays, ...dbHolidays.map((h) => h.toObject())];

    const uniqueMap = new Map();
    for (const holiday of merged) {
      const key = `${holiday.date}-${holiday.title}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, holiday);
      }
    }

    const finalHolidays = Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    res.json(finalHolidays);
  } catch (error) {
    console.error("Get holidays error:", error);
    res.status(500).json({ message: "Failed to fetch holidays" });
  }
});

/* ADD HOLIDAY */
router.post("/", async (req, res) => {
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

    res.json({
      message: "Holiday added successfully",
      holiday: newHoliday
    });
  } catch (error) {
    console.error("Add holiday error:", error);
    res.status(500).json({ message: "Failed to add holiday" });
  }
});

/* DELETE HOLIDAY */
router.delete("/:id", async (req, res) => {
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

module.exports = router;