import React, { useState } from "react";
import "../style/_updateinvitor.scss";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

export default function UpDateInvitor() {
  const location = useLocation();
  const navigate = useNavigate();
  let invitor = location.state;

  const [name, setName] = useState(invitor?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(invitor?.phoneNumber || "");
  const [readCount, setReadCount] = useState(invitor?.maxScan || 0);
  const [status, setStatus] = useState(invitor?.status || "Invited");

  const baseUrl = "https://www.izemak.com/azimak/public/api";

  const handleSubmit = async (e) => {
    e.preventDefault();
    invitor = {
      ...invitor,
      name: name,
      phoneNumber: phoneNumber,
      maxScan: readCount,
      status: status,
    };
    try {
      const response = await fetch(`${baseUrl}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invitor),
      });

      if (response.ok) {
        navigate(`/invitorspage/${invitor.Party_id}`, {
          state: { partyId: invitor.Party_id },
        });
      } else {
        console.error("error");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <main className="mainOfUpDateInvitor">
      <Link to="/invitorspage/:partyId" state={{ partyId: invitor?.Party_id }}>
        <img src="اعزمك-01.png" alt="" />
      </Link>

      <h1>Update data</h1>
      <form onSubmit={handleSubmit}>
        <div className="details">
          <label>name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="details">
          <label>Phone number</label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        <div className="details">
          <label>Number of scanning</label>
          <input
            type="number"
            value={readCount}
            onChange={(e) => setReadCount(e.target.value)}
          />
        </div>

        <label>status</label>
        <div className="condition">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Invited">Invited</option>
            <option value="Arrived">Arrived</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="submit">
          <button type="submit">update</button>
        </div>
      </form>
      <Footer />
    </main>
  );
}
