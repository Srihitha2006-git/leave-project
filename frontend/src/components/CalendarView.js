import React from "react";

function CalendarView({ currentDate, setCurrentDate, holidays }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthTitle = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric"
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="day empty"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const localDate = new Date(year, month, day);
    const yyyy = localDate.getFullYear();
    const mm = String(localDate.getMonth() + 1).padStart(2, "0");
    const dd = String(localDate.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const holiday = holidays.find((h) => h.date === dateStr);

    if (holiday) {
      cells.push(
        <div key={dateStr} className="day holiday" title={holiday.title}>
          <span>{day}</span>
          <small>{holiday.title}</small>
        </div>
      );
    } else {
      cells.push(
        <div key={dateStr} className="day">
          <span>{day}</span>
        </div>
      );
    }
  }

  return (
    <>
      <div className="calendar-header">
        <button
          className="mini-btn"
          onClick={() => {
            const d = new Date(currentDate);
            d.setMonth(d.getMonth() - 1);
            setCurrentDate(d);
          }}
        >
          ◀
        </button>

        <h3>{monthTitle}</h3>

        <button
          className="mini-btn"
          onClick={() => {
            const d = new Date(currentDate);
            d.setMonth(d.getMonth() + 1);
            setCurrentDate(d);
          }}
        >
          ▶
        </button>
      </div>

      <div className="weekdays">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      <div className="calendar-grid">{cells}</div>
      <div className="holiday-legend">Holiday dates are highlighted in red</div>
    </>
  );
}

export default CalendarView;