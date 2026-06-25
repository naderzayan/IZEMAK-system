import React, { useState } from "react";
import "../style/_addHotel.scss";
import Footer from "../components/Footer";
import { Link, useNavigate } from "react-router-dom";

export default function AddAHotel() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      alert("All data is required");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);

    setSubmitting(true);

    try {
      const res = await fetch(
        "https://www.izemak.com/azimak/public/api/add/hotel",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || " error adding hotel");
        return;
      }
      navigate("/access_hotels");
    } catch (error) {
      console.error(error);
      alert("error connecting to the server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mainOfAddAHotel">
      <Link to="/mainpartydata">
        <img src="/اعزمك-01.png" alt="logo" />
      </Link>

      <div>
        <h1>Create Hotel</h1>
      </div>

      <div className="addAHotel">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Hotel Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Saving" : "Submit"}
          </button>
        </form>
      </div>

      <Footer />
    </div>
  );
}
