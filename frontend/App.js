import React, { useState } from "react";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";

function App() {
  const [user, setUser] = useState(
    localStorage.getItem("loggedInUser")
      ? JSON.parse(localStorage.getItem("loggedInUser"))
      : null
  );

  if (!user) {
    return <LoginPage setUser={setUser} />;
  }

  if (user.role === "admin") {
    return <AdminDashboard user={user} setUser={setUser} />;
  }

  if (user.role === "manager") {
    return <ManagerDashboard user={user} setUser={setUser} />;
  }

  return <EmployeeDashboard user={user} setUser={setUser} />;
}

export default App;