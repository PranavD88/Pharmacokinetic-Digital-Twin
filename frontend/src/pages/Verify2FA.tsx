import { useState } from "react";

export default function Verify2FA() {
  const [code, setCode] = useState("");

  const handleVerify = async () => {
    const email = localStorage.getItem("patient_email");

    //const res = await fetch("/patient-login/verify-2fa", {
    const res = await fetch("http://localhost:8000/patient-login/verify-2fa", {
    method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password: code
      })
    });

    const data = await res.json();

    if (data.access_token) {
      localStorage.setItem("patient_token", data.access_token);

      window.location.href = "/patient-login/set-password";
    } else {
      alert(data.detail || "Invalid code");
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
    </div>
  );
}