/*import { useState } from "react";

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    const email = localStorage.getItem("patient_email");

    if (!email) {
      setError("Session expired, please log in again");
      return;
    }

    if (password != confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    //const res = await fetch("/patient-login/set-password", {
    const res = await fetch("http://localhost:8000/patient-login/set-password", {
    method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await res.json();

    if (data.requires2FA) {
      localStorage.setItem("patient_email", email || "");
      window.location.href = "/patient/simulations";
    } else {
      alert("Error setting password");
    }
  };

  return (
    <div>
      <h2>Set New Password</h2>

      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        type="password"
        placeholder="Re-enter password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button onClick={handleSubmit}>Submit</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
  */

import { useState } from "react";

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    const email = localStorage.getItem("patient_email");

    if (!email) {
      setError("Session expired. Please log in again.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const res = await fetch("http://localhost:8000/patient-login/set-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.detail || "Failed to set password");
      return;
    }

    alert("Password updated successfully. Please log in.");

    localStorage.removeItem("patient_email");

    window.location.href = "/patient-login";
  };

  return (
    <div>
      <h2>Set New Password</h2>

      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        type="password"
        placeholder="Re-enter password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button onClick={handleSubmit}>Submit</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}