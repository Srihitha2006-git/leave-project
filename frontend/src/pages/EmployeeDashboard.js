import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../App.css";

function EmployeeDashboard({ user, setUser }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [allHolidays, setAllHolidays] = useState([]);
  const [futureHolidays, setFutureHolidays] = useState([]);
  const [currentHolidayIndex, setCurrentHolidayIndex] = useState(0);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "Casual Leave",
    startDate: "",
    endDate: "",
    reason: ""
  });
  const [leavePreview, setLeavePreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [managerName, setManagerName] = useState("Loading...");

  const today = new Date();
  const [calendarDate, setCalendarDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  useEffect(() => {
    if (!user || user.role !== "employee") return;

    loadLeaveBalance();
    loadHolidays();
    loadLeaveHistory();
    loadManager();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const logout = () => {
    localStorage.removeItem("loggedInUser");
    setUser(null);
  };

  const loadLeaveBalance = async () => {
    try {
      const res = await api.get(`/leave-balance/${user.id}`);
      setLeaveBalance(res.data || null);
    } catch (error) {
      console.error("Failed to load leave balance", error);
      setLeaveBalance(null);
    }
  };

  const loadHolidays = async () => {
    try {
      const res = await api.get("/holidays");
      const holidays = Array.isArray(res.data) ? res.data : [];
      setAllHolidays(holidays);

      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const upcoming = holidays.filter((holiday) => {
        const holidayDate = new Date(holiday.date);
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate >= todayDate;
      });

      setFutureHolidays(upcoming);
      setCurrentHolidayIndex(0);
    } catch (error) {
      console.error("Failed to load holidays", error);
      setAllHolidays([]);
      setFutureHolidays([]);
    }
  };

  const loadLeaveHistory = async () => {
    try {
      const res = await api.get(`/leave-history/${user.id}`);
      setLeaveHistory(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load leave history", error);
      setLeaveHistory([]);
    }
  };

  const loadManager = async () => {
    try {
      const res = await api.get("/users");
      const users = Array.isArray(res.data) ? res.data : [];

      const currentUser = users.find(
        (u) => Number(u.id) === Number(user.id)
      );

      if (!currentUser || !currentUser.managerId) {
        setManagerName("Not Assigned");
        return;
      }

      const manager = users.find(
        (u) => Number(u.id) === Number(currentUser.managerId)
      );

      setManagerName(manager?.name || "Not Assigned");
    } catch (error) {
      console.error("Failed to load manager", error);
      setManagerName("Not Available");
    }
  };

  const previewLeave = async (startDate, endDate) => {
    if (!startDate || !endDate) {
      setLeavePreview(null);
      return;
    }

    try {
      const res = await api.post("/leave-preview", {
        userId: user.id,
        startDate,
        endDate
      });
      setLeavePreview(res.data || null);
    } catch (error) {
      console.error("Failed to preview leave", error);
      setLeavePreview(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const updatedForm = {
      ...leaveForm,
      [name]: value
    };

    setLeaveForm(updatedForm);

    if (updatedForm.startDate && updatedForm.endDate) {
      previewLeave(updatedForm.startDate, updatedForm.endDate);
    } else {
      setLeavePreview(null);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/leave-request", {
        userId: user.id,
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason
      });

      alert(res.data.message || "Leave submitted successfully");

      setLeaveForm({
        leaveType: "Casual Leave",
        startDate: "",
        endDate: "",
        reason: ""
      });

      setLeavePreview(null);
      loadLeaveBalance();
      loadLeaveHistory();
      setActiveSection("history");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit leave");
    }
  };

  const showNextHoliday = () => {
    if (!futureHolidays.length) return;
    setCurrentHolidayIndex((prev) => (prev + 1) % futureHolidays.length);
  };

  const showPrevHoliday = () => {
    if (!futureHolidays.length) return;
    setCurrentHolidayIndex((prev) =>
      prev === 0 ? futureHolidays.length - 1 : prev - 1
    );
  };

  const currentHoliday =
    futureHolidays.length > 0 ? futureHolidays[currentHolidayIndex] : null;

  const approvedLeaves = leaveHistory.filter((item) => item.status === "approved");
  const pendingLeaves = leaveHistory.filter((item) => item.status === "pending");
  const rejectedLeaves = leaveHistory.filter((item) => item.status === "rejected");

  const totalApprovedDays = useMemo(() => {
    return approvedLeaves.reduce(
      (sum, item) => sum + Number(item.requestedDays || 0),
      0
    );
  }, [approvedLeaves]);

  const upcomingApprovedLeaves = useMemo(() => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    return approvedLeaves
      .filter((item) => {
        const endDate = new Date(item.endDate);
        endDate.setHours(0, 0, 0, 0);
        return endDate >= todayDate;
      })
      .slice(0, 5);
  }, [approvedLeaves]);

  const filteredHistory = leaveHistory.filter((item) => {
    const text =
      `${item.startDate} ${item.endDate} ${item.leaveType} ${item.reason} ${item.status}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  const holidayMap = useMemo(() => {
    const map = {};
    allHolidays.forEach((holiday) => {
      map[holiday.date] = holiday;
    });
    return map;
  }, [allHolidays]);

  const monthName = calendarDate.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric"
  });

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];

    for (let i = 0; i < startWeekday; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(year, month, day));
    }

    return cells;
  }, [calendarDate]);

  const prevMonth = () => {
    setCalendarDate(
      new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCalendarDate(
      new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1)
    );
  };

  const isToday = (dateObj) => {
    if (!dateObj) return false;
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  };

  const formatDateKey = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <h2>Employee Panel</h2>

        <button
          className={`nav-btn ${activeSection === "overview" ? "active" : ""}`}
          onClick={() => setActiveSection("overview")}
        >
          Overview
        </button>

        <button
          className={`nav-btn ${activeSection === "applyLeave" ? "active" : ""}`}
          onClick={() => setActiveSection("applyLeave")}
        >
          Apply Leave
        </button>

        <button
          className={`nav-btn ${activeSection === "history" ? "active" : ""}`}
          onClick={() => setActiveSection("history")}
        >
          Leave History
        </button>

        <button className="nav-btn logout-btn" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        <div className="admin-page-header">
          <div>
            <h1>Welcome, {user?.name || "Employee"}</h1>
            <p className="admin-subtitle">
              This is your leave portal. You can track balance, apply for leave, and view request history.
            </p>
          </div>
        </div>

        {activeSection === "overview" && (
          <>
            <div className="employee-top-banner">
              <div className="employee-banner-card">
                <span className="employee-banner-label">Employee Name</span>
                <h3>{user?.name || "Employee"}</h3>
                <p>{user?.username || "-"}</p>
              </div>

              <div className="employee-banner-card">
                <span className="employee-banner-label">Reporting Manager</span>
                <h3>{managerName}</h3>
                <p>Your assigned manager</p>
              </div>
            </div>

            <div className="manager-hero-grid">
              <div className="manager-hero-card">
                <div className="manager-card-head">
                  <button className="slider-arrow light" onClick={showPrevHoliday}>
                    &#10094;
                  </button>
                  <h2>Next Holiday</h2>
                  <button className="slider-arrow" onClick={showNextHoliday}>
                    &#10095;
                  </button>
                </div>

                <div className="manager-holiday-body">
                  {currentHoliday ? (
                    <>
                      <h3>{currentHoliday.title}</h3>
                      <p>
                        {new Date(currentHoliday.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          weekday: "short"
                        })}
                      </p>
                      <span className={`role-pill role-${currentHoliday.type}`}>
                        {currentHoliday.type}
                      </span>
                    </>
                  ) : (
                    <p className="muted-text">No upcoming holidays</p>
                  )}
                </div>
              </div>

              <div className="manager-hero-card">
                <div className="manager-card-head simple">
                  <h2>Upcoming Approved Leave</h2>
                  <span className="admin-chip">{upcomingApprovedLeaves.length} records</span>
                </div>

                <div className="manager-timeoff-list">
                  {upcomingApprovedLeaves.length > 0 ? (
                    upcomingApprovedLeaves.map((item) => (
                      <div key={item.id} className="manager-timeoff-row">
                        <div>
                          <strong>
                            {item.startDate} to {item.endDate}
                          </strong>
                          <p>{item.leaveType} · {item.reason}</p>
                        </div>
                        <div className="manager-timeoff-days">
                          {item.requestedDays} day{Number(item.requestedDays) > 1 ? "s" : ""}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="muted-text">No upcoming approved leave.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <span className="admin-stat-label">Total Leave</span>
                <h3>{leaveBalance ? leaveBalance.total : 0}</h3>
                <p>Your total leave allocation</p>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-label">Remaining Leave</span>
                <h3>{leaveBalance ? leaveBalance.remaining : 0}</h3>
                <p>Available to use</p>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-label">Used Leave</span>
                <h3>{leaveBalance ? leaveBalance.used : 0}</h3>
                <p>Already consumed</p>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-label">Pending Requests</span>
                <h3>{pendingLeaves.length}</h3>
                <p>Awaiting manager approval</p>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-label">Approved Requests</span>
                <h3>{approvedLeaves.length}</h3>
                <p>Accepted leave applications</p>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-label">Approved Leave Days</span>
                <h3>{totalApprovedDays}</h3>
                <p>Total approved days off</p>
              </div>
            </div>

            <div className="admin-two-column">
              <div className="admin-panel-card">
                <div className="admin-card-head">
                  <h2>Your Leave Summary</h2>
                  <span className="admin-chip">Live Balance</span>
                </div>

                <div className="admin-summary-stack">
                  <div className="admin-summary-row">
                    <span>Total Leave</span>
                    <strong>{leaveBalance ? leaveBalance.total : 0}</strong>
                  </div>
                  <div className="admin-summary-row">
                    <span>Used Leave</span>
                    <strong>{leaveBalance ? leaveBalance.used : 0}</strong>
                  </div>
                  <div className="admin-summary-row">
                    <span>Remaining Leave</span>
                    <strong>{leaveBalance ? leaveBalance.remaining : 0}</strong>
                  </div>
                  <div className="admin-summary-row">
                    <span>Pending Requests</span>
                    <strong>{pendingLeaves.length}</strong>
                  </div>
                  <div className="admin-summary-row">
                    <span>Rejected Requests</span>
                    <strong>{rejectedLeaves.length}</strong>
                  </div>
                </div>

                <div className="admin-note-box">
                  <strong>Employee Note:</strong>
                  <p>
                    Leave previews automatically exclude Sundays, public holidays, and corporate holidays from deduction.
                  </p>
                </div>
              </div>

              <div className="admin-panel-card">
                <div className="admin-card-head">
                  <h2>Holiday Calendar</h2>
                  <div className="calendar-nav">
                    <button className="calendar-nav-btn" onClick={prevMonth}>
                      &#10094;
                    </button>
                    <span className="calendar-month-title">{monthName}</span>
                    <button className="calendar-nav-btn" onClick={nextMonth}>
                      &#10095;
                    </button>
                  </div>
                </div>

                <div className="holiday-month-calendar">
                  <div className="calendar-weekdays">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>

                  <div className="calendar-grid">
                    {calendarDays.map((dateObj, idx) => {
                      if (!dateObj) {
                        return <div key={`empty-${idx}`} className="calendar-cell empty"></div>;
                      }

                      const dateKey = formatDateKey(dateObj);
                      const holiday = holidayMap[dateKey];
                      const todayFlag = isToday(dateObj);

                      return (
                        <div
                          key={dateKey}
                          className={`calendar-cell ${holiday ? "holiday" : ""} ${
                            todayFlag ? "today" : ""
                          }`}
                        >
                          <div className="calendar-date-number">{dateObj.getDate()}</div>
                          {holiday && (
                            <div className="calendar-holiday-title" title={holiday.title}>
                              {holiday.title}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection === "applyLeave" && (
          <div className="employee-apply-layout">
            <div className="admin-panel-card employee-apply-main-card">
              <div className="admin-card-head">
                <h2>Apply For Leave</h2>
                <span className="admin-chip">Request Form</span>
              </div>

              <form onSubmit={handleLeaveSubmit} className="employee-pro-form">
                <div className="employee-pro-grid">
                  <div>
                    <label>Leave Type</label>
                    <select
                      name="leaveType"
                      value={leaveForm.leaveType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Earned Leave">Earned Leave</option>
                      <option value="Comp Off">Comp Off</option>
                      <option value="Work From Home">Work From Home</option>
                      <option value="Loss of Pay">Loss of Pay</option>
                    </select>
                  </div>

                  <div>
                    <label>Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={leaveForm.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <label>End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={leaveForm.endDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="employee-pro-full">
                    <label>Reason</label>
                    <textarea
                      name="reason"
                      rows="5"
                      value={leaveForm.reason}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="employee-form-actions">
                  <button type="submit" className="primary-btn">
                    Submit Leave Request
                  </button>
                </div>
              </form>
            </div>

            <div className="employee-apply-side-panel">
              <div className="admin-panel-card">
                <div className="admin-card-head">
                  <h2>Leave Preview</h2>
                  <span className="admin-chip">Auto Calculation</span>
                </div>

                {leavePreview ? (
                  <div className="admin-summary-stack">
                    <div className="admin-summary-row">
                      <span>Leave Type</span>
                      <strong>{leaveForm.leaveType}</strong>
                    </div>
                    <div className="admin-summary-row">
                      <span>Requested Days</span>
                      <strong>{leavePreview.requestedDays}</strong>
                    </div>
                    <div className="admin-summary-row">
                      <span>Current Remaining</span>
                      <strong>{leavePreview.currentRemaining}</strong>
                    </div>
                    <div className="admin-summary-row">
                      <span>Remaining After Leave</span>
                      <strong>{leavePreview.previewRemaining}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="muted-text">
                    Select dates to preview leave deduction.
                  </p>
                )}
              </div>

              <div className="admin-panel-card">
                <div className="admin-card-head">
                  <h2>Reporting Manager</h2>
                  <span className="admin-chip">Assigned</span>
                </div>

                <div className="employee-manager-box">
                  <h3>{managerName}</h3>
                  <p>Your direct reporting manager for leave approvals.</p>
                </div>
              </div>

              <div className="admin-panel-card">
                <div className="admin-card-head">
                  <h2>Available Leave Types</h2>
                  <span className="admin-chip">Policy View</span>
                </div>

                <div className="employee-type-list">
                  <div className="employee-type-item">
                    <strong>Casual Leave</strong>
                    <p>Short personal or urgent leave.</p>
                  </div>
                  <div className="employee-type-item">
                    <strong>Sick Leave</strong>
                    <p>Health-related absence or recovery.</p>
                  </div>
                  <div className="employee-type-item">
                    <strong>Earned Leave</strong>
                    <p>Planned leave for vacation or longer breaks.</p>
                  </div>
                  <div className="employee-type-item">
                    <strong>Comp Off</strong>
                    <p>Leave in exchange for extra duty worked.</p>
                  </div>
                  <div className="employee-type-item">
                    <strong>Work From Home</strong>
                    <p>Remote work request tracked separately.</p>
                  </div>
                  <div className="employee-type-item">
                    <strong>Loss of Pay</strong>
                    <p>Unpaid leave when paid balance is exhausted.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "history" && (
          <>
            <div className="admin-search-bar">
              <input
                type="text"
                placeholder="Search by type, reason, date, or status"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="manager-search-info">
                {filteredHistory.length} records shown
              </div>
            </div>

            <div className="employee-history-strip">
              <div className="employee-history-mini-card">
                <span>Pending</span>
                <strong>{pendingLeaves.length}</strong>
              </div>
              <div className="employee-history-mini-card">
                <span>Approved</span>
                <strong>{approvedLeaves.length}</strong>
              </div>
              <div className="employee-history-mini-card">
                <span>Rejected</span>
                <strong>{rejectedLeaves.length}</strong>
              </div>
              <div className="employee-history-mini-card">
                <span>Approved Days</span>
                <strong>{totalApprovedDays}</strong>
              </div>
            </div>

            <div className="table-card admin-table-card">
              <div className="admin-card-head">
                <h2>Leave History</h2>
                <span className="admin-chip">{filteredHistory.length} records</span>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Start</th>
                    <th>End</th>
                    <th>Days</th>
                    <th>Type</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                      <tr key={item.id}>
                        <td>{item.startDate}</td>
                        <td>{item.endDate}</td>
                        <td>{item.requestedDays}</td>
                        <td>{item.leaveType}</td>
                        <td>{item.reason}</td>
                        <td>
                          <span className={`role-pill role-${item.status}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6">No leave history found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default EmployeeDashboard;