const mongoose = require("mongoose");
const Holiday = require("./models/Holiday");

mongoose
  .connect("mongodb://127.0.0.1:27017/leave_management_system")
  .then(() => console.log("MongoDB connected for seeding"))
  .catch((err) => console.error(err));

function generatePublicHolidays(year) {
  return [
    { title: "New Year", date: `${year}-01-01`, type: "public" },
    { title: "Republic Day", date: `${year}-01-26`, type: "public" },
    { title: "Independence Day", date: `${year}-08-15`, type: "public" },
    { title: "Gandhi Jayanti", date: `${year}-10-02`, type: "public" },
    { title: "Christmas", date: `${year}-12-25`, type: "public" }
  ];
}

async function seed() {
  try {
    const year = new Date().getFullYear();

    const holidays = [
      ...generatePublicHolidays(year),
      ...generatePublicHolidays(year + 1)
    ];

    for (const h of holidays) {
      const exists = await Holiday.findOne({
        title: h.title,
        date: h.date
      });

      if (!exists) {
        await Holiday.create(h);
        console.log("Inserted:", h.title, h.date);
      } else {
        console.log("Already exists:", h.title, h.date);
      }
    }

    console.log("Seeding completed");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();