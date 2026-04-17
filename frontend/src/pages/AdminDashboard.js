import React, { useEffect, useMemo, useState } from "react";
import "../App.css";

const API_URL = "https://leave-project.onrender.com/api";

export default function AdminDashboard({ user, setUser }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [users, setUsers] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [userForm, setUserForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "employee",
    managerId: ""
  });

  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    username: "",
    password: "",
    role: "employee",
    managerId: ""
  });

  const [holidayForm, setHolidayForm] = useState({
    title: "",
    date: "",
    type: "corporate",
    recurringAnnual: false
  });

  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!loggedInUser || loggedInUser.role !== "admin") {
      localStorage.removeItem("loggedInUser");
      setUser(null);
      return;
    }

    loadUsers();
    loadHolidays();
  }, [setUser]);

  const logout = () => {
    localStorage.removeItem("loggedInUser");
    setUser(null);
  };

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      const data = await res.json();

      if (!res.ok) {
        console.error(data.message || "Failed to load users");
        return;
      }

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load users", error);
    }
  };

  const loadHolidays = async () => {
    try {
      const res = await fetch(`${API_URL}/holidays`);
      const data = await res.json();

      if (!res.ok) {
        console.error(data.message || "Failed to load holidays");
        return;
      }

      setHolidays(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load holidays", error);
    }
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;

    setUserForm((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "role" && value !== "employee") {
        updated.managerId = "";
      }

      return updated;
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "role" && value !== "employee") {
        updated.managerId = "";
      }

      return updated;
    });
  };

  const handleHolidayChange = (e) => {
    const { name, value, type, checked } = e.target;

    setHolidayForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(searchTerm.trim());
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setAppliedSearch("");
  };

  const managers = useMemo(
    () => users.filter((u) => u.role === "manager"),
    [users]
  );

  const getManagerName = (managerId) => {
    if (!managerId) return "Not Assigned";

    const manager = users.find(
      (u) => String(u.id) === String(managerId)
    );

    return manager ? manager.name : "Not Assigned";
  };

  const filteredUsers = useMemo(() => {
    const term = String(appliedSearch || "").trim().toLowerCase();

    if (!term) return users;

    return users.filter((userItem) => {
      const name = String(userItem.name || "").toLowerCase();
      const username = String(userItem.username || "").toLowerCase();
      const role = String(userItem.role || "").toLowerCase();
      const managerName = String(getManagerName(userItem.managerId) || "").toLowerCase();

      return (
        name.includes(term) ||
        username.includes(term) ||
        role.includes(term) ||
        managerName.includes(term)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, appliedSearch]);

  const createUser = async (e) => {
    e.preventDefault();

    if (userForm.role === "employee" && !userForm.managerId) {
      alert("Please select a manager for employee");
      return;
    }

    try {
      const payload = {
        name: userForm.name.trim(),
        username: userForm.username.trim(),
        password: userForm.password,
        role: userForm.role,
        managerId: userForm.role === "employee" ? userForm.managerId : null
      };

      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to create user");
        return;
      }

      alert(data.message || "User created successfully");

      setUserForm({
        name: "",
        username: "",
        password: "",
        role: "employee",
        managerId: ""
      });

      loadUsers();
    } catch (error) {
      console.error("Create user error", error);
      alert("Failed to create user");
    }
  };

  const openEditUser = (userItem) => {
    setEditForm({
      id: userItem.id,
      name: userItem.name || "",
      username: userItem.username || "",
      password: "",
      role: userItem.role || "employee",
      managerId: userItem.managerId ? String(userItem.managerId) : ""
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditForm({
      id: "",
      name: "",
      username: "",
      password: "",
      role: "employee",
      managerId: ""
    });
    setIsEditModalOpen(false);
  };

  const updateUser = async (e) => {
    e.preventDefault();

    if (editForm.role === "employee" && !editForm.managerId) {
      alert("Please select a manager for employee");
      return;
    }

    try {
      const payload = {
        name: editForm.name.trim(),
        username: editForm.username.trim(),
        password: editForm.password,
        role: editForm.role,
        managerId: editForm.role === "employee" ? editForm.managerId : null
      };

      const res = await fetch(`${API_URL}/users/${editForm.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to update user");
        return;
      }

      alert(data.message || "User updated successfully");
      closeEditModal();
      loadUsers();
    } catch (error) {
      console.error("Update user error", error);
      alert("Failed to update user");
    }
  };

  const deleteUser = async (id) => {
    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to delete user");
        return;
      }

      alert(data.message || "User deleted successfully");
      loadUsers();
    } catch (error) {
      console.error("Delete user error", error);
      alert("Failed to delete user");
    }
  };

  const addHoliday = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        title: holidayForm.title.trim(),
        date: holidayForm.date,
        type: holidayForm.type,
        recurringAnnual: holidayForm.recurringAnnual
      };

      const res = await fetch(`${API_URL}/holidays`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to add holiday");
        return;
      }

      alert(data.message || "Holiday added successfully");

      setHolidayForm({
        title: "",
        date: "",
        type: "corporate",
        recurringAnnual: false
      });

      loadHolidays();
    } catch (error) {
      console.error("Add holiday error", error);
      alert("Failed to add holiday");
    }
  };

  const deleteHoliday = async (id, type) => {
    if (type === "public") {
      alert("Public holidays are auto-generated and cannot be deleted");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/holidays/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to delete holiday");
        return;
      }

      alert(data.message || "Holiday deleted successfully");
      loadHolidays();
    } catch (error) {
      console.error("Delete holiday error", error);
      alert("Failed to delete holiday");
    }
  };

  const employeesCount = users.filter((u) => u.role === "employee").length;
  const managersCount = users.filter((u) => u.role === "manager").length;
  const adminsCount = users.filter((u) => u.role === "admin").length;

  const recentUsers = [...users].slice(-5).reverse();

  const getUserInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const monthName = calendarDate.toLocaleString("default", { month: "long" });
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const holidayMap = useMemo(() => {
    const map = {};

    holidays.forEach((holiday) => {
      const d = new Date(holiday.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        if (!map[d.getDate()]) {
          map[d.getDate()] = [];
        }
        map[d.getDate()].push(holiday);
      }
    });

    return map;
  }, [holidays, year, month]);

  const calendarCells = [];
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  const goToPrevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <h2>Admin Panel</h2>

          <div className="sidebar-nav">
            <button
              className={`nav-btn ${activeSection === "overview" ? "active" : ""}`}
              onClick={() => setActiveSection("overview")}
              type="button"
            >
              Overview
            </button>

            <button
              className={`nav-btn ${activeSection === "users" ? "active" : ""}`}
              onClick={() => setActiveSection("users")}
              type="button"
            >
              Users
            </button>

            <button
              className={`nav-btn ${activeSection === "holidays" ? "active" : ""}`}
              onClick={() => setActiveSection("holidays")}
              type="button"
            >
              Holidays
            </button>
          </div>
        </div>

        <button className="logout-btn" onClick={logout} type="button">
          Logout
        </button>
      </aside>

      <main className="main-content">
        {activeSection === "overview" && (
          <>
            <div className="admin-page-header">
              <div>
                <h1>Admin Dashboard</h1>
                <p className="admin-subtitle">
                  Manage users, holidays, and team structure
                </p>
              </div>
            </div>

            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <span className="admin-stat-label">Total Users</span>
                <h3>{users.length}</h3>
                <p>All registered accounts</p>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-label">Managers</span>
                <h3>{managersCount}</h3>
                <p>Users with approval access</p>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-label">Employees</span>
                <h3>{employeesCount}</h3>
                <p>Active employee accounts</p>
              </div>
            </div>

            <div className="admin-overview-grid">
              <div className="admin-panel-card">
                <div className="admin-card-head">
                  <h2>System Summary</h2>
                  <span className="admin-chip">Live Data</span>
                </div>

                <div className="admin-overview-mini-grid">
                  <div className="admin-mini-box">
                    <h4>Admins</h4>
                    <p>{adminsCount}</p>
                  </div>
                  <div className="admin-mini-box">
                    <h4>Managers</h4>
                    <p>{managersCount}</p>
                  </div>
                  <div className="admin-mini-box">
                    <h4>Employees</h4>
                    <p>{employeesCount}</p>
                  </div>
                  <div className="admin-mini-box">
                    <h4>Holidays</h4>
                    <p>{holidays.length}</p>
                  </div>
                </div>

                <div className="admin-note-box">
                  <strong>Note</strong>
                  <p>
                    Employees require a manager assignment during create and
                    edit. Holidays are shown in the overview calendar.
                  </p>
                </div>
              </div>

              <div className="admin-panel-card">
                <div className="admin-card-head calendar-head">
                  <h2>Holiday Calendar</h2>
                  <div className="calendar-controls">
                    <button
                      type="button"
                      className="calendar-nav-btn"
                      onClick={goToPrevMonth}
                    >
                      ‹
                    </button>
                    <span className="admin-chip">
                      {monthName} {year}
                    </span>
                    <button
                      type="button"
                      className="calendar-nav-btn"
                      onClick={goToNextMonth}
                    >
                      ›
                    </button>
                  </div>
                </div>

                <div className="overview-calendar">
                  <div className="calendar-weekdays">
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                    <div>Sun</div>
                  </div>

                  <div className="calendar-grid">
                    {calendarCells.map((day, index) => {
                      const dayHolidays = day ? holidayMap[day] || [] : [];
                      const hasHoliday = dayHolidays.length > 0;

                      return (
                        <div
                          key={index}
                          className={`calendar-cell ${day ? "" : "empty"} ${hasHoliday ? "holiday-cell" : ""}`}
                          title={
                            hasHoliday
                              ? dayHolidays.map((h) => `${h.title} (${h.type})`).join(", ")
                              : ""
                          }
                        >
                          {day && (
                            <>
                              <span className="calendar-day-number">{day}</span>
                              {hasHoliday &&
                                dayHolidays.slice(0, 2).map((holiday, idx) => (
                                  <div className="calendar-holiday-tag" key={idx}>
                                    {holiday.title}
                                  </div>
                                ))}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="calendar-legend">
                  <span className="legend-item">
                    <span className="legend-color red"></span>
                    Holiday
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection === "users" && (
          <>
            <div className="admin-page-header">
              <div>
                <h1>Manage Users</h1>
                <p className="admin-subtitle">
                  Create, edit, search, and organize users
                </p>
              </div>
            </div>

            <form className="admin-search-bar" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search by name, username, role, or manager"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="primary-btn" type="submit">
                Search
              </button>
              <button
                className="secondary-btn"
                onClick={handleClearSearch}
                type="button"
              >
                Clear Search
              </button>
            </form>

            <div className="admin-three-column">
              <div className="admin-panel-card admin-form-card">
                <div className="admin-card-head">
                  <h2>Create User</h2>
                  <span className="admin-chip">Form</span>
                </div>

                <form onSubmit={createUser}>
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={userForm.name}
                    onChange={handleUserChange}
                    required
                  />

                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={userForm.username}
                    onChange={handleUserChange}
                    required
                  />

                  <label>Password</label>
                  <input
                    type="text"
                    name="password"
                    value={userForm.password}
                    onChange={handleUserChange}
                    required
                  />

                  <label>Role</label>
                  <select
                    name="role"
                    value={userForm.role}
                    onChange={handleUserChange}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>

                  {userForm.role === "employee" && (
                    <>
                      <label>Assign Manager</label>
                      <select
                        name="managerId"
                        value={userForm.managerId}
                        onChange={handleUserChange}
                        required
                      >
                        <option value="">Select Manager</option>
                        {managers.map((manager) => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name}
                          </option>
                        ))}
                      </select>
                    </>
                  )}

                  <button type="submit" className="primary-btn admin-full-btn">
                    Create User
                  </button>
                </form>
              </div>

              <div className="admin-panel-card">
                <div className="admin-card-head">
                  <h2>User Summary</h2>
                  <span className="admin-chip">Stats</span>
                </div>

                <div className="admin-summary-stack">
                  <div className="admin-summary-row">
                    <span>Total Users</span>
                    <strong>{users.length}</strong>
                  </div>
                  <div className="admin-summary-row">
                    <span>Managers</span>
                    <strong>{managersCount}</strong>
                  </div>
                  <div className="admin-summary-row">
                    <span>Employees</span>
                    <strong>{employeesCount}</strong>
                  </div>
                  <div className="admin-summary-row">
                    <span>Filtered Results</span>
                    <strong>{filteredUsers.length}</strong>
                  </div>
                </div>

                <div className="admin-note-box">
                  <strong>Tip</strong>
                  <p>
                    Type a name and press Enter or click Search. The list below
                    will show matching users.
                  </p>
                </div>
              </div>

              <div className="admin-panel-card">
                <div className="admin-card-head">
                  <h2>Recent Users</h2>
                  <span className="admin-chip">Latest</span>
                </div>

                <div className="admin-list user-list-professional">
                  {recentUsers.length > 0 ? (
                    recentUsers.map((userItem) => (
                      <div className="admin-user-card" key={userItem.id}>
                        <div className="admin-user-avatar">
                          {getUserInitials(userItem.name)}
                        </div>
                        <div className="admin-user-info">
                          <strong>{userItem.name}</strong>
                          <p>{userItem.username}</p>
                        </div>
                        <span
                          className={`role-pill ${
                            userItem.role === "admin"
                              ? "role-admin"
                              : userItem.role === "manager"
                              ? "role-manager"
                              : "role-employee"
                          }`}
                        >
                          {userItem.role}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="admin-empty-state">No users available</div>
                  )}
                </div>
              </div>
            </div>

            <div className="admin-panel-card admin-table-card">
              <div className="admin-card-head">
                <h2>List of Users</h2>
                <span className="admin-chip">{filteredUsers.length} shown</span>
              </div>

              {filteredUsers.length > 0 ? (
                <div className="table-card">
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Assigned Manager</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((userItem) => (
                        <tr key={userItem.id}>
                          <td>
                            <div className="user-table-cell">
                              <div className="admin-user-avatar small">
                                {getUserInitials(userItem.name)}
                              </div>
                              <span>{userItem.name}</span>
                            </div>
                          </td>
                          <td>{userItem.username}</td>
                          <td>
                            <span
                              className={`role-pill ${
                                userItem.role === "admin"
                                  ? "role-admin"
                                  : userItem.role === "manager"
                                  ? "role-manager"
                                  : "role-employee"
                              }`}
                            >
                              {userItem.role}
                            </span>
                          </td>
                          <td>
                            {userItem.role === "employee"
                              ? getManagerName(userItem.managerId)
                              : "-"}
                          </td>
                          <td>
                            <div className="admin-action-row">
                              <button
                                className="edit-btn admin-flex-btn"
                                onClick={() => openEditUser(userItem)}
                                type="button"
                              >
                                Edit
                              </button>
                              <button
                                className="danger-btn admin-flex-btn"
                                onClick={() => deleteUser(userItem.id)}
                                type="button"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-empty-state">No users found</div>
              )}
            </div>
          </>
        )}

        {activeSection === "holidays" && (
          <>
            <div className="admin-page-header">
              <div>
                <h1>Manage Holidays</h1>
                <p className="admin-subtitle">
                  Add corporate or public holidays and review all holidays
                </p>
              </div>
            </div>

            <div className="admin-two-column">
              <div className="admin-panel-card admin-form-card">
                <div className="admin-card-head">
                  <h2>Add Holiday</h2>
                  <span className="admin-chip">Form</span>
                </div>

                <form onSubmit={addHoliday}>
                  <label>Holiday Title</label>
                  <input
                    type="text"
                    name="title"
                    value={holidayForm.title}
                    onChange={handleHolidayChange}
                    required
                  />

                  <label>Date</label>
                  <input
                    type="date"
                    name="date"
                    value={holidayForm.date}
                    onChange={handleHolidayChange}
                    required
                  />

                  <label>Type</label>
                  <select
                    name="type"
                    value={holidayForm.type}
                    onChange={handleHolidayChange}
                  >
                    <option value="corporate">Corporate</option>
                    <option value="public">Public</option>
                  </select>

                  {holidayForm.type === "public" && (
                    <div style={{ marginTop: "6px", marginBottom: "4px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          type="checkbox"
                          name="recurringAnnual"
                          checked={holidayForm.recurringAnnual}
                          onChange={handleHolidayChange}
                          style={{ width: "auto" }}
                        />
                        Repeat every year
                      </label>
                    </div>
                  )}

                  <button type="submit" className="primary-btn admin-full-btn">
                    Add Holiday
                  </button>
                </form>
              </div>

              <div className="admin-panel-card">
                <div className="admin-card-head">
                  <h2>Holiday Summary</h2>
                  <span className="admin-chip">Overview</span>
                </div>

                <div className="admin-summary-stack">
                  <div className="admin-summary-row">
                    <span>Total Holidays</span>
                    <strong>{holidays.length}</strong>
                  </div>
                  <div className="admin-summary-row">
                    <span>Public Holidays</span>
                    <strong>
                      {holidays.filter((h) => h.type === "public").length}
                    </strong>
                  </div>
                  <div className="admin-summary-row">
                    <span>Corporate Holidays</span>
                    <strong>
                      {holidays.filter((h) => h.type === "corporate").length}
                    </strong>
                  </div>
                </div>

                <div className="admin-note-box">
                  <strong>Important</strong>
                  <p>
                    Public holidays are system style holidays and are not meant
                    to be deleted manually. Corporate holidays can be managed here.
                  </p>
                </div>
              </div>
            </div>

            <div className="admin-panel-card admin-table-card">
              <div className="admin-card-head">
                <h2>List of Holidays</h2>
                <span className="admin-chip">{holidays.length} total</span>
              </div>

              {holidays.length > 0 ? (
                <div className="table-card">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holidays.map((holiday) => (
                        <tr key={holiday.id}>
                          <td>{holiday.title}</td>
                          <td>{formatDate(holiday.date)}</td>
                          <td>{holiday.type}</td>
                          <td>
                            <button
                              className="danger-btn"
                              onClick={() => deleteHoliday(holiday._id, holiday.type)}
                              type="button"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-empty-state">No holidays found</div>
              )}
            </div>
          </>
        )}
      </main>

      {isEditModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit User</h2>
              <button className="close-btn" onClick={closeEditModal} type="button">
                ×
              </button>
            </div>

            <form onSubmit={updateUser}>
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                required
              />

              <label>Username</label>
              <input
                type="text"
                name="username"
                value={editForm.username}
                onChange={handleEditChange}
                required
              />

              <label>Password</label>
              <input
                type="text"
                name="password"
                value={editForm.password}
                onChange={handleEditChange}
                placeholder="Leave blank to keep current password"
              />

              <label>Role</label>
              <select
                name="role"
                value={editForm.role}
                onChange={handleEditChange}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>

              {editForm.role === "employee" && (
                <>
                  <label>Assign Manager</label>
                  <select
                    name="managerId"
                    value={editForm.managerId}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="">Select Manager</option>
                    {managers
                      .filter((manager) => Number(manager.id) !== Number(editForm.id))
                      .map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.name}
                        </option>
                      ))}
                  </select>
                </>
              )}

              <div className="modal-actions">
                <button type="submit" className="primary-btn">
                  Update User
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}