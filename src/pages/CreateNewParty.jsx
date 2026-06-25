import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../style/_createNewParty.scss";
import { FaCloudUploadAlt } from "react-icons/fa";
import Footer from "../components/Footer";

export default function CreateNewParty() {
  const navigate = useNavigate();

  const [partyName, setPartyName] = useState("");
  const [partyDate, setPartyDate] = useState("");
  const [partyPlace, setPartyPlace] = useState("");
  const [invitation, setInvitation] = useState("both");
  const [invitationText, setInvitationText] = useState("");
  const [file, setFile] = useState(null);
  const [hotelId, setHotelId] = useState("");
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLink, setLocationLink] = useState("");

  useEffect(() => {
    fetch("https://www.izemak.com/azimak/public/api/hotels")
      .then((res) => res.json())
      .then((data) => setHotels(data.data || []))
      .catch(() => setHotels([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("name", partyName);
    formData.append("address", partyPlace);
    formData.append("location", invitation === "location" ? locationLink : "");
    formData.append("time", partyDate);
    formData.append("partyInvitationText", invitationText);
    formData.append("party_condition", invitation);

    if (hotelId) {
      formData.append("hotel_id", hotelId);
    }

    if (file) {
      formData.append("invititon", file);
    }

    try {
      const res = await fetch(
        "https://www.izemak.com/azimak/public/api/addparty",
        {
          method: "POST",
          body: formData,
        },
      );

      if (res.ok) {
        navigate("/mainpartydata");
      } else {
        alert("Failed to add party");
      }
    } catch {
      alert("Server connection problem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mainOfCreateNewParty">
      <Link to="/mainpartydata">
        <img src="/اعزمك-01.png" alt="logo" />
      </Link>

      <h1>Add a new party</h1>

      <form className="formContainer" onSubmit={handleSubmit}>
        <select
          value={invitation}
          onChange={(e) => setInvitation(e.target.value)}
          required
        >
          <option value="invitation">ارسال الدعوة فقط</option>
          <option value="invitationWithQuestion">
            ارسال الدعوة مع السؤال بدون رمز دخول
          </option>
          <option value="both">ارسال الدعوة ورمز الدخول مع السؤال</option>
          <option value="bothwithoutQuestion">
            ارسال الدعوة مع رمز الدخول بدون سؤال
          </option>
          <option value="location">ارسال الموقع</option>
          <option value="qr">ارسال رمز الدخول فقط</option>
          <option value="withoutMax">ارسال دعوات بدون عدد دعوات محدد</option>
          <option value="publicWithQr">دعوة عامة مع رمز دخول</option>
          <option value="publicWithoutQr">دعوة عامة بدون رمز دخول</option>
        </select>

        <input
          type="text"
          placeholder="Party Name"
          value={partyName}
          onChange={(e) => setPartyName(e.target.value)}
          required
        />


        <input
          type="date"
          value={partyDate}
          onChange={(e) => setPartyDate(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Party Address"
          value={partyPlace}
          onChange={(e) => setPartyPlace(e.target.value)}
          required
        />

        <select value={hotelId} onChange={(e) => setHotelId(e.target.value)}>
          <option value="">Choose hotel</option>
          {hotels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>

        {invitation === "location" && (
          <input
            type="text"
            placeholder="Enter location link"
            value={locationLink}
            onChange={(e) => setLocationLink(e.target.value)}
            required
          />
        )}

        <textarea
          placeholder="Invitation Text"
          value={invitationText}
          onChange={(e) => setInvitationText(e.target.value)}
          className="invitationText"
        />

        <label className="uploadBtn">
          Upload <FaCloudUploadAlt />
          <input
            type="file"
            hidden
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>

        <button type="submit" disabled={loading}>
          {"Add Party"}
        </button>
      </form>

      <Footer />
    </main>
  );
}
