import React, { useState, useEffect, useMemo } from "react";
import "../style/_addInvitors.scss";
import { Link, useParams, useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import * as XLSX from "xlsx";

export default function AddInvitors() {
  const location = useLocation();
  const [guests, setGuests] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [invites, setInvites] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [duplicatePayload, setDuplicatePayload] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [showExcelConfirm, setShowExcelConfirm] = useState(false);
  const [showExcelCount, setShowExcelCount] = useState(false);
  const [excelCount, setExcelCount] = useState(null);
  const [showDuplicatesPopup, setShowDuplicatesPopup] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [partyName, setPartyName] = useState("");

  const params = useParams();
  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  let partyId = location.state?.partyId ?? query.get("partyId");
  if (!partyId) partyId = params.partyId;
  useEffect(() => {
    if (!partyId) return;
    let cancelled = false;

    const fetchGuests = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://www.izemak.com/azimak/public/api/party/${partyId}`,
        );
        if (!res.ok) throw new Error("No Data Added");
        const data = await res.json();
        const arr = data?.data.members ?? [];
        setPartyName(data?.data.name);
        if (!cancelled) setGuests(arr);
      } catch (err) {
        if (!cancelled) setError(err.message || "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchGuests();
    return () => {
      cancelled = true;
    };
  }, [partyId]);

  const handleAddGuest = async () => {
    if (!partyId) return alert("error ?partyId=ID");
    if (!name || !phone || !invites) return;

    const isDuplicate = guests.some((guest) => guest.phoneNumber === phone);
    const formData = new FormData();
    formData.append("Party_id", partyId);
    formData.append("name", name);
    formData.append("phoneNumber", phone);
    formData.append("maxScan", invites);

    if (isDuplicate) {
      setDuplicatePayload(formData);
      setShowDuplicateConfirm(true);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        "https://www.izemak.com/azimak/public/api/addinvitor",
        {
          method: "POST",
          body: formData,
        },
      );
      if (!res.ok) throw new Error("error not added");
      window.location.reload();
    } catch (err) {
      setError(err.message || "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResendDuplicate = async () => {
    if (!duplicatePayload) return;
    setSaving(true);
    try {
      const res = await fetch(
        "https://www.izemak.com/azimak/public/api/addinvitor/confirm",
        {
          method: "POST",
          body: duplicatePayload,
        },
      );
      if (!res.ok) throw new Error("error on confirm");
      window.location.reload();
    } catch (err) {
      setError(err.message || "error");
    } finally {
      setSaving(false);
      setDuplicatePayload(null);
      setShowDuplicateConfirm(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const excelData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      });

      const formattedData = excelData.map((row) => ({
        name: row[0],
        phoneNumber: row[1],
        maxScan: row[2],
      }));

      const existingPhones = new Set(guests.map((g) => g.phoneNumber));

      const duplicatesList = formattedData.filter((p) =>
        existingPhones.has(p.phoneNumber),
      );

      setDuplicates(duplicatesList);
      setExcelCount(formattedData.length);
    };

    if (file) {
      reader.readAsArrayBuffer(file);
      setExcelFile(file);
      setShowExcelConfirm(true);
    }
  };

  const handleExcelUpload = async () => {
    if (!excelFile || !partyId) return;

    if (duplicates.length > 0) {
      setShowDuplicatesPopup(true);
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append("Party_id", partyId);
    formData.append("file", excelFile);

    try {
      const res = await fetch(
        "https://www.izemak.com/azimak/public/api/addexcel",
        {
          method: "POST",
          body: formData,
        },
      );
    } catch (err) {
      setError(err.message || "error uploading file");
    } finally {
      setSaving(false);
      setShowExcelConfirm(false);
      setTimeout(() => {
        setShowSuccessPopup(false);
        window.location.reload();
      }, 3000);
    }
  };

  const handleExcelConfirm = async () => {
    if (!excelFile || !partyId) return;

    setSaving(true);

    const duplicatesList = duplicates.map((d) => ({
      Party_id: partyId,
      name: d.name,
      phoneNumber: d.phoneNumber,
      maxScan: d.maxScan,
    }));
    console.log(JSON.stringify({ data: duplicatesList }));
    try {
      const confirmRes = await fetch(
        "https://www.izemak.com/azimak/public/api/addexcel/confirm",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ data: duplicatesList }),
        },
      );
      const confirmData = await confirmRes.json();
      setShowExcelCount(false);
      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
        window.location.reload();
      }, 3000);
    } catch (err) {
      setError(err.message || "error confirming file");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mainOfAddInvitors">
      {showDuplicateConfirm && (
        <div className="overlay">
          <div className="warningBox">
            <p>The number is duplicated. Do you want to add it?</p>
            <div className="warningActions">
              <button
                onClick={handleResendDuplicate}
                disabled={saving}
                className="confirmBtn"
              >
                send
              </button>
              <button
                onClick={() => {
                  setShowDuplicateConfirm(false);
                  setDuplicatePayload(null);
                }}
                className="cancelBtn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showExcelConfirm && (
        <div className="overlay">
          <div className="warningBox">
            <p>Are you sure</p>
            <div className="warningActions">
              <button
                onClick={() => setShowExcelCount(true)}
                disabled={saving}
                className="confirmBtn"
              >
                send
              </button>
              <button
                onClick={() => setShowExcelConfirm(false)}
                className="cancelBtn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showExcelCount && (
        <div className="overlay">
          <div className="warningBox">
            <p>Number of invitees : {excelCount ?? "0"}</p>
            <div className="warningActions">
              <button
                onClick={handleExcelUpload}
                disabled={saving}
                className="confirmBtn"
              >
                send
              </button>
              <button
                onClick={() => setShowExcelCount(false)}
                className="cancelBtn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDuplicatesPopup && (
        <div className="overlay">
          <div className="warningBox">
            <p>There are duplicate numbers:</p>
            <ul>
              {duplicates.map((d, idx) => (
                <li key={idx}>
                  {d.name} - {d.phoneNumber}
                </li>
              ))}
            </ul>
            <div className="warningActions">
              <button
                type="button"
                onClick={async () => {
                  setSaving(true);
                  try {
                    handleExcelConfirm();
                  } catch (err) {
                    setError(err.message || "error");
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="confirmBtn"
              >
                send
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDuplicatesPopup(false);
                  setDuplicates([]);
                  setExcelFile(null);
                }}
                className="cancelBtn"
              >
                cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div className="overlay">
          <div className="warningBox successBox">
            <p> Your work has been saved successfully</p>
          </div>
        </div>
      )}

      <div className="sideBar">
        <Link to={`/invitorspage/${partyId}`} state={{ partyId }}>
          <h1>List of invitees</h1>
        </Link>
        <ul>
          {loading ? (
            <p className="loading">Loading</p>
          ) : !Array.isArray(guests) || guests.length === 0 ? (
            <p>No data yet</p>
          ) : (
            guests.map((guest, num) => (
              <li key={num}>
                <span>{num+1} - {guest.name}</span>
                <span>{guest.status ?? ""}</span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="addDetailis">
        <Link to="/mainpartydata">
          <img src="/اعزمك-01.png" alt="" />
        </Link>
        {error && <p className="error">{error}</p>}
        <h2>{partyName}</h2>

        <div className="name">
          <label>name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="phoneNum">
          <label>phone number</label>
          <input
            type="number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="numOfInvitations">
          <label>Number of invitations</label>
          <input
            type="number"
            value={invites}
            onChange={(e) => setInvites(e.target.value)}
          />
        </div>

        <div className="buttons">
          <div className="addButton">
            <button onClick={handleAddGuest} disabled={saving}>
              Add
            </button>
          </div>
          <div className="addButton">
            <label htmlFor="fileUpload" className="uploadBtn">
              Upload a file
            </label>
            <input
              type="file"
              id="fileUpload"
              accept=".xlsx,.xls"
              className="inputUpload"
              onChange={handleFileChange}
            />
          </div>
        </div>
        <Footer />
      </div>
    </main>
  );
}
