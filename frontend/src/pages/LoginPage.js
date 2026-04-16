import React, { useState } from "react";
import "../App.css";

const API_URL = "https://leave-project.onrender.com/api";

export default function LoginPage({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  /* ================= LOGIN ================= */
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || "Invalid username or password");
        return;
      }

      localStorage.setItem("loggedInUser", JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      setErrorMessage("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= FORGOT PASSWORD ================= */
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (!forgotUsername || !newPassword || !confirmPassword) {
      setForgotError("Fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users`);
      const users = await res.json();

      const foundUser = users.find(
        (u) => u.username === forgotUsername
      );

      if (!foundUser) {
        setForgotError("User not found");
        return;
      }

      await fetch(`${API_URL}/users/${foundUser.id}/reset-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword })
      });

      setForgotSuccess("Password updated successfully");
    } catch {
      setForgotError("Error resetting password");
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">

        {/* LEFT SIDE */}
        <div className="login-left-panel">

          <div className="login-brand-block">
            <div className="login-logo">SL</div>
            <div className="login-brand-text">
              <h1>Smart Leave</h1>
              <p>Role-Based Leave Management System</p>
            </div>
          </div>

          <div className="login-left-content">
            <div className="login-left-inner">
              <h2>Welcome back</h2>
              <p>
                Login as Admin, Manager, or Employee and continue to your
                role-based dashboard with leave tracking, approvals, and holiday management.
              </p>

              <div className="login-feature-list">
                <div className="login-feature-item">Admin manages users and holidays</div>
                <div className="login-feature-item">Manager approves leave requests</div>
                <div className="login-feature-item">Employee applies and tracks leave</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="login-right-panel">
          <div className="login-card-pro">

            <div className="login-card-header">
              <h2>Login</h2>
              <p>Enter your credentials</p>
            </div>

            <form onSubmit={handleLogin} className="login-form-pro">

              <div className="input-group-pro">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="input-group-pro">
                <label>Password</label>
                <div className="password-wrap-pro">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="login-options-row">
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => setShowForgotModal(true)}
                >
                  Forgot Password?
                </button>
              </div>

              {errorMessage && (
                <div className="login-error-box">{errorMessage}</div>
              )}

              <button
                type="submit"
                className="login-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="forgot-modal-overlay">
          <div className="forgot-modal-card">

            <div className="forgot-modal-header">
              <h3>Reset Password</h3>
              <button onClick={() => setShowForgotModal(false)}>×</button>
            </div>

            <form onSubmit={handleForgotPassword} className="forgot-form">

              <label>Username</label>
              <input
                value={forgotUsername}
                onChange={(e) => setForgotUsername(e.target.value)}
              />

              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              {forgotError && <div className="forgot-error-box">{forgotError}</div>}
              {forgotSuccess && <div className="forgot-message-box">{forgotSuccess}</div>}

              <div className="forgot-actions">
                <button className="primary-btn">Update</button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowForgotModal(false)}
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