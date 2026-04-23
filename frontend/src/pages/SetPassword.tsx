import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function SetPassword() {
  const nav = useNavigate();
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

    try {
      await api.setPatientPassword(email, password);
    } catch (e: unknown) {
      setError(String(e));
      return;
    }

    alert("Password updated successfully. Please log in.");

    localStorage.removeItem("patient_email");
    nav("/patient-login");
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
