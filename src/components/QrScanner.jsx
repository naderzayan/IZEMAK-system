import React, { useState, useRef } from "react";
import "../style/components/_qrScanner.scss";

export default function QrScanner({ onSubmit, selectedParty }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const scannedSetRef = useRef(new Set());

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && value.trim()) {
      const success = await onSubmit(value.trim());
      if (success !== false) setValue("");
    }
  };

  return (
    <div className="inputs">
      {selectedParty !== "0" && (
        <>
          <input
            type="text"
            placeholder="Write QR Code here"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {error && <p className="error">{error}</p>}
        </>
      )}
    </div>
  );
}
