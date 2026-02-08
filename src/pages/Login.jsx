import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/_login.scss";
import Footer from "../components/Footer";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const res = await fetch(
        "https://www.izemak.com/azimak/public/api/login",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError("login data is incorrect");
        return;
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user?.type === "hotel") {
        navigate("/hotel_detalies");
      } else {
        navigate("/mainpartydata");
      }
    } catch (err) {
      setError("Error occurred connecting to server");
    }
  };

  return (
    <main className="mainOfLogin">
      <div className="form">
        <form className="loginBox" onSubmit={handleSubmit}>
          <img src="/اعزمك-01.png" alt="" className="logo" />

          <div className="input">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input passwordInput">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="eyeIcon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>


          {error && <p className="error">{error}</p>}

          <button type="submit" className="loginBtn">
            Login
          </button>
        </form>
      </div>
      <Footer />
    </main>
  );
}
