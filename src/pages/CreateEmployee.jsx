import React, { useState } from "react";
import "../style/_createemployee.scss";
import Footer from "../components/Footer";
import { Link, useNavigate } from "react-router-dom";

export default function CreateEmployee() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const addEmployeeUrl =
    "https://www.izemak.com/azimak/public/api/employees/add";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password || !tel.trim()) {
      alert("Please fill all fields.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        password: password,
        tel: tel.trim(),
      };

      const res = await fetch(addEmployeeUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok || data.success) {
        navigate("/access_staff");
      } else {
        console.error("Add employee failed:", data);

        if (data?.message?.toLowerCase().includes("email")) {
          setErrorMsg("The email has already been taken.");
        } else {
          setErrorMsg("The email has been taken");
        }
      }
    } catch (err) {
      console.error("Add employee error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mainOfCreateEmployee">
      <div className="imgContainer">
        <Link to="/access_staff">
          <img src="اعزمك-01.png" alt="logo" className="img" />
        </Link>
      </div>

      <h1>Create Employee</h1>

      <form className="createEmployee" onSubmit={handleSubmit}>
        <div className="form">
          <div className="inputs">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="inputs">
            <label>Phone Number</label>
            <input
              type="tel"
              value={tel}
              onChange={(e) => setTel(e.target.value)}
            />
          </div>

          <div className="inputs">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="inputs">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="btnContainer">
            <button type="submit" disabled={submitting}>
              Submit
            </button>
          </div>
        </div>
      </form>

      {errorMsg && (
        <div className="popup-overlay">
          <div className="popup">
            <p>{errorMsg}</p>
            <button onClick={() => setErrorMsg("")}>OK</button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
