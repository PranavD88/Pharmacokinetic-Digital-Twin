import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Verify2FA() {
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleVerify = async () => {
    setError("");
    const email = localStorage.getItem("patient_email");
    if (!email) {
      setError("Session expired. Please log in again.");
      return;
    }

    try {
      const data = await api.verifyPatient2FA(email, code);
      localStorage.setItem("patient_token", data.access_token);
      nav("/patient-login/set-password");
    } catch (e: unknown) {
      setError(String(e));
    }
  };

  return (
    <div>
      <h2>Enter SMS Code</h2>
      <input
        type="text"
        placeholder="6-digit code"
        onChange={(e) => setCode(e.target.value)}
      />
      <button onClick={handleVerify}>Verify</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
