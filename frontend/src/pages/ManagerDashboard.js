import React, { useEffect, useMemo, useState } from "react";
import "../App.css";

const API_URL = "https://leave-project.onrender.com/api";

export default function ManagerDashboard({ user, setUser }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!loggedInUser || loggedInUser.role !== "manager") {
      localStorage.removeItem("loggedInUser");
      setUser(null);
      return;
    }

    loadAllData(loggedInUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUser]);

  const logout = () => {
    localStorage.removeItem("loggedInUser");
    setUser(null);
  };

  const loadAllData = async (loggedInUser = user) => {
    await Promise.all([
      loadEmployees(loggedInUser),
      loadHolidays()
    ]);
  };

  const loadEmployees = async (loggedInUser = user) => {
    try {
      const res = await fetch(`${API_URL}/users`);
      const data = await res.json();

      if (!res.ok) {
        console.error(data.message || "Failed to load users");
        return;
      }

      const allUsers = Array.isArray(data) ? data : [];

      const managerEmployees = allUsers.filter(
        (u) =>
          u.role === "employee" &&
          String(u.managerId) === String(loggedInUser.id)
      );

      setEmployees(managerEmployees);
      loadLeaveRequests(managerEmployees);
    } catch (error) {
      console.error("Failed to load employees", error);
    }
  };

  const loadLeaveRequests = async (managerEmployees = employees) => {
    try {
      const res = await fetch(`${API_URL}/manager/leave-requests?managerId=${user.id}`);
      const data = await res.json();

      if (!res.ok) {
        console.error(data.message || "Failed to load leave requests");
        return;
      }

      const requests = Array.isArray(data) ? data : [];
      const employeeIds = managerEmployees.map((emp) => String(emp.id));

      const filtered = requests.filter((req) =>
        employeeIds.includes(String(req.userId))
      );

      setLeaveRequests(filtered);
    } catch (error) {
      console.error("Failed to load leave requests", error);
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

  const handleStatusUpdate = async (requestId, status) => {
    try {
      const res = await fetch(`${API_URL}/manager/leave-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || `Failed to ${status} request`);
        return;
      }

      alert(data.message || `Request ${status} successfully`);
      loadEmployees();
    } catch (error) {
      console.error(`Failed to ${status} request`, error);
      alert(`Failed to ${status} request`);
    }
  };

  const getEmployeeName = (userId) => {
    const employee = employees.find((emp) => String(emp.id) === String(userId));
    return employee ? employee.name : "Unknown Employee";
  };

  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return leaveRequests;

    return leaveRequests.filter((request) => {
      const employeeName = String(getEmployeeName(request.userId)).toLowerCase();
      const status = String(request.status || "").toLowerCase();
      const leaveType = String(request.leaveType || "").toLowerCase();
      const reason = String(request.reason || "").toLowerCase();

      return (
        employeeName.includes(term) ||
        status.includes(term) ||
        leaveType.includes(term) ||
        reason.includes(term)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveRequests, searchTerm, employees]);

  const pendingCount = leaveRequests.filter((r) => r.status === "pending").length;
  const approvedCount = leaveRequests.filter((r) => r.status === "approved").length;
  const rejectedCount = leaveRequests.filter((r) => r.status === "rejected").length;

  const upcomingHolidays = [...holidays]
    .filter((h) => new Date(h.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const recentRequests = [...leaveRequests]
    .sort((a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0))
    .slice(0, 5);

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <h2>Manager Panel</h2>

          <div className="sidebar-nav">
            <button
              className={`nav-btn ${activeSection === "overview" ? "active" : ""}`}
              onClick={() => setActiveSection("overview")}
              type="button"
            >
              Overview
            </button>

            <button
              className={`nav-btn ${activeSection === "requests" ? "active" : ""}`}
              onClick={() => setActiveSection("requests")}
              type="button"
            >
              Leave Requests
            </button>

            <button
              className={`nav-btn ${activeSection === "employees" ? "active" : ""}`}
              onClick={() => setActiveSection("employees")}
              type="button"
            >
              Team Members
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
                <h1>Manager Dashboard</h1>
                <p className="admin-subtitle">
                  Review team leave activity and manage approvals
                </p>
              </div>
            </div>

            <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              <div className="admin-stat-card">
                <span className="admin-stat-label">Team Members</span>
                <h3>{employees.length}</h3>
                <p>Employees assigned to you</p>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-label">Pending Requests</span>
                <h3>{pendingCount}</h3>
                <p>Awaiting approval</p>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-label">Approved</span>
                <h3>{approvedCount}</h3>
                <p>Approved leave requests</p>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-label">Rejected</span>
                <h3>{rejectedCount}</h3>
                <p>Rejected leave requests</p>
              </div>
            </div>

            <div className="admin-two-column">
              <div className="admin-panel-card">
                <div className="admin-card-head">
                  <h2>Recent Requests</h2>
                  <span className="admin-chip">Latest</span>
                </div>

                <div className="admin-list">
                  {recentRequests.length > 0 ? (
                    recentRequests.map((request) => (
                      <div className="admin-list-row" key={request.id}>
                        <div>
                          <strong>{getEmployeeName(request.userId)}</strong>
                          <p>
                            {request.leaveType || "General"} | {request.startDate} to {request.endDate}
                          </p>
                        </div>
                        <span
                          className={`role-pill ${
                            request.status === "approved"
                              ? "role-manager"
                              : request.status === "rejected"
                              ? "role-public"
                              : "role-corporate"
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="admin-empty-state">No leave requests found</div>
                  )}
                </div>
              </div>

              <div className="admin-panel-card">
                <div className="admin-card-head">
                  <h2>Upcoming Holidays</h2>
                  <span className="admin-chip">Calendar</span>
                </div>

                <div className="admin-list">
                  {upcomingHolidays.length > 0 ? (
                    upcomingHolidays.map((holiday) => (
                      <div className="admin-list-row" key={holiday.id}>
                        <div>
                          <strong>{holiday.title}</strong>
                          <p>{holiday.date}</p>
                        </div>
                        <span
                          className={`role-pill ${
                            holiday.type === "public"
                              ? "role-public"
                              : "role-corporate"
                          }`}
                        >
                          {holiday.type}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="admin-empty-state">No upcoming holidays</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection === "requests" && (
          <>
            <div className="admin-page-header">
              <div>
                <h1>Leave Requests</h1>
                <p className="admin-subtitle">
                  Approve or reject employee leave requests
                </p>
              </div>
            </div>

            <div className="admin-search-bar" style={{ gridTemplateColumns: "1fr 160px" }}>
              <input
                type="text"
                placeholder="Search by employee, leave type, reason, or status"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                className="secondary-btn"
                type="button"
                onClick={() => setSearchTerm("")}
              >
                Clear Search
              </button>
            </div>

            <div className="admin-panel-card admin-table-card">
              <div className="admin-card-head">
                <h2>All Requests</h2>
                <span className="admin-chip">{filteredRequests.length} shown</span>
              </div>

              {filteredRequests.length > 0 ? (
                <div className="table-card">
                  <table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Leave Type</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((request) => (
                        <tr key={request.id}>
                          <td>{getEmployeeName(request.userId)}</td>
                          <td>{request.leaveType || "General"}</td>
                          <td>{request.startDate}</td>
                          <td>{request.endDate}</td>
                          <td>{request.reason}</td>
                          <td>
                            <span
                              className={`role-pill ${
                                request.status === "approved"
                                  ? "role-manager"
                                  : request.status === "rejected"
                                  ? "role-public"
                                  : "role-corporate"
                              }`}
                            >
                              {request.status}
                            </span>
                          </td>
                          <td>
                            {request.status === "pending" ? (
                              <div className="admin-action-row">
                                <button
                                  className="edit-btn admin-flex-btn"
                                  type="button"
                                  onClick={() => handleStatusUpdate(request.id, "approved")}
                                >
                                  Approve
                                </button>
                                <button
                                  className="danger-btn admin-flex-btn"
                                  type="button"
                                  onClick={() => handleStatusUpdate(request.id, "rejected")}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-empty-state">No matching leave requests found</div>
              )}
            </div>
          </>
        )}

        {activeSection === "employees" && (
          <>
            <div className="admin-page-header">
              <div>
                <h1>Team Members</h1>
                <p className="admin-subtitle">
                  Employees currently assigned to you
                </p>
              </div>
            </div>

            <div className="admin-panel-card admin-table-card">
              <div className="admin-card-head">
                <h2>Employee List</h2>
                <span className="admin-chip">{employees.length} total</span>
              </div>

              {employees.length > 0 ? (
                <div className="table-card">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Manager</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((employee) => (
                        <tr key={employee.id}>
                          <td>{employee.name}</td>
                          <td>{employee.username}</td>
                          <td>
                            <span className="role-pill role-employee">
                              {employee.role}
                            </span>
                          </td>
                          <td>{user.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-empty-state">No employees assigned to you</div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}