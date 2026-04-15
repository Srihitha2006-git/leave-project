const getDatesBetween = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

const calculateLeaveDays = (startDate, endDate, holidays) => {
  const allDates = getDatesBetween(startDate, endDate);
  let countedDays = 0;
  const excludedHolidays = [];

  for (const dateStr of allDates) {
    const dateObj = new Date(dateStr);
    const day = dateObj.getDay();
    const isWeekend = day === 0 || day === 6;
    const holiday = holidays.find((h) => h.date === dateStr);

    if (holiday) {
      excludedHolidays.push({ date: holiday.date, title: holiday.title });
      continue;
    }

    if (isWeekend) {
      continue;
    }

    countedDays++;
  }

  return {
    totalSelectedDays: allDates.length,
    finalLeaveDays: countedDays,
    excludedHolidays
  };
};

module.exports = { calculateLeaveDays };