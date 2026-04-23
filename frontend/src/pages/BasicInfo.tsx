import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../api";
import Navbar from "../pages/Navbar";

export default function BasicInfo() {
  const nav = useNavigate();
  const [full_name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const isExisting = localStorage.getItem("existing") === "true";

  // Prefill
  async function tryPrefill() {
    if (!isExisting || !email) return;
    try {
      const p = await api.getPatientByEmail(email);
      if (p?.name) setName(p.name);
      if (p?.number) setPhone(p.number);
      if (!p?.name && p?.full_name) setName(p.full_name);
      if (!p?.number && p?.phone) setPhone(p.phone);
    } catch {
      return;
    }
  }

  async function onNext() {
    setErr("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErr("Email is required.");
      return;
    }
    localStorage.setItem("patient_email", normalizedEmail);

    try {
      if (isExisting) {
        // Update basic fields if provided
        if (full_name || phone) {
          try {
            await api.updatePatientBody(normalizedEmail, {
              name: full_name || undefined,
              number: phone || undefined,
            });
          } catch {
            return;
          }
        }
      } else {
        // Create new patient with backend
        await api.createPatientBasic({
          name: full_name,
          number: phone,
          email: normalizedEmail,
        });
      }
      nav("/info");
    } catch (e: unknown) {
      setErr(String(e));
    }
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="card">
          <h1>Digital Twin</h1>
          <h2>Basic Patient Information</h2>

          <input
            placeholder="Full Name"
            value={full_name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={tryPrefill}
          />

          <button onClick={onNext}>Next</button>
          {err && <p style={{ color: "red" }}>{err}</p>}
        </div>
      </div>
    </>
  );
}
