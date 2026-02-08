import React, { useState, useRef, useEffect } from "react";
import "../style/_qrcodescanner.scss";
import { BsQrCodeScan } from "react-icons/bs";
import { MdOutlineImageSearch } from "react-icons/md";
import axios from "axios";
import jsQR from "jsqr";
import { Link } from "react-router";
import QrScanner from "../components/QrScanner";

export default function QRCodeScanner() {
  const [open, setOpen] = useState(false);
  const [selectedParties, setSelectedParty] = useState([]);
  const [showImageScan, setShowImageScan] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [error, setError] = useState("");
  const [scannedText, setScannedText] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [parties, setParties] = useState([]);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const capturedPreviewRef = useRef(null);
  const baseUrl = "https://www.izemak.com/azimak/public/api";
  const fetchParties = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${baseUrl}/parties/scan`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      const normalized = (data.data || []).map((p) => ({
        id: p.id,
        name: p.name,
      }));
      setParties(normalized);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };
  useEffect(() => {
    fetchParties();
    console.log(parties);
    (async () => {
      try {
        const list = await navigator.mediaDevices?.enumerateDevices?.();
        if (list) {
          setDevices(list.filter((d) => d.kind === "videoinput"));
        }
      } catch (e) {}
    })();

    return () => {
      stopCamera();
      if (selectedImage) {
        try {
          URL.revokeObjectURL(selectedImage);
        } catch (e) {}
      }
    };
  }, []);

  function tryDecodeFromCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) return code.data;
    } catch (e) {
      console.warn("decode error", e);
    }
    return null;
  }

  async function callScanApi(scanned) {
    setError("");
    try {
      const res = await fetch(
        `${baseUrl}/scan/${encodeURIComponent(scanned)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedParties }),
        },
      );

      if (res.status === 200) {
        const data = await res.json();
        const apiData = data.data || {};
        const scanCount = parseInt(apiData.scan ?? apiData.scans ?? 0, 10);
        const maxScan = parseInt(
          apiData.maxScan ?? apiData.max_scan ?? apiData.max ?? 0,
          10,
        );

        setScanData({
          name: apiData.name ?? "Not found",
          phone: apiData.phoneNumber ?? apiData.phone ?? "Not found",
          scan: scanCount,
          maxScan: maxScan,
          raw: apiData,
        });

        if (
          data.msg == "Max scan limit reached" &&
          !Number.isNaN(maxScan) &&
          !Number.isNaN(scanCount) &&
          scanCount >= maxScan
        ) {
          setScanSuccess(false);
          setError("you reached max scan limit");
          return;
        }

        setScanSuccess(true);
      } else {
        setError("API returned unexpected response");
      }
    } catch (err) {
      console.error("Scan failed", err);
      const serverMsg =
        err?.response?.data?.message || err?.response?.data?.msg || null;
      setError(serverMsg || "Scan failed (API). Please try again");
    }
  }

  const handleFileSelect = (event) => {
    setError("");
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    stopCamera();
    const imageURL = URL.createObjectURL(file);
    if (selectedImage) {
      try {
        URL.revokeObjectURL(selectedImage);
      } catch (e) {}
    }
    setSelectedImage(imageURL);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const decoded = tryDecodeFromCanvas();
      if (decoded) {
        setScannedText(decoded);
        callScanApi(decoded);
      } else {
        setError("No QR code found in image");
      }
    };
    img.onerror = () => {
      setError("Failed to read image file");
      try {
        URL.revokeObjectURL(imageURL);
      } catch (e) {}
      setSelectedImage(null);
    };
    img.src = imageURL;
  };

  const handleChooseImageClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleRescan = () => {
    setScanSuccess(false);
    if (selectedImage) {
      try {
        URL.revokeObjectURL(selectedImage);
      } catch (e) {}
    }
    setSelectedImage(null);
    setShowImageScan(false);
    setScannedText("");
    setScanData(null);
    setError("");
    capturedPreviewRef.current = null;
  };

  async function startCamera() {
    setError("");
    setScanSuccess(false);
    setCameraActive(true);
    if (selectedImage) {
      try {
        URL.revokeObjectURL(selectedImage);
      } catch (e) {}
    }
    setSelectedImage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(
        "Your browser does not support camera access (navigator.mediaDevices missing)",
      );
      console.error("navigator.mediaDevices missing");
      return;
    }

    try {
      let deviceList = [];
      try {
        deviceList = await navigator.mediaDevices.enumerateDevices();
        setDevices(deviceList.filter((d) => d.kind === "videoinput"));
      } catch (enumErr) {}

      const videoConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: selectedDeviceId ? undefined : { ideal: "environment" },
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
      };

      const constraints = {
        video: videoConstraints,
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.muted = true;
        videoRef.current.srcObject = stream;

        const playPromise = new Promise((resolve, reject) => {
          const vd = videoRef.current;
          const onLoaded = () => {
            vd.removeEventListener("loadedmetadata", onLoaded);
            resolve();
          };
          const onError = (e) => {
            vd.removeEventListener("error", onError);
            reject(e);
          };
          vd.addEventListener("loadedmetadata", onLoaded);
          vd.addEventListener("error", onError);
          setTimeout(() => resolve(), 500);
        });

        try {
          await playPromise;
          await videoRef.current.play();
          setCameraActive(true);
          rafRef.current = requestAnimationFrame(scanVideoFrame);
        } catch (playErr) {
          console.error("Video play error", playErr);
          setError(
            "Unable to start video playback. Check browser autoplay/permission settings and allow camera access for this site.",
          );
        }
      }
    } catch (err) {
      console.error("Camera error (getUserMedia failed):", err);
      if (err && err.name) {
        switch (err.name) {
          case "NotAllowedError":
          case "SecurityError":
          case "PermissionDeniedError":
            setError(
              "Camera access denied. Please allow camera access in your browser settings for this site",
            );
            break;
          case "NotFoundError":
          case "OverconstrainedError":
          case "DevicesNotFoundError":
            setError("No compatible camera found on this device");
            break;
          case "NotReadableError":
          case "TrackStartError":
            setError("Camera is already in use by another application");
            break;
          default:
            setError("Camera access failed: " + (err.message || err.name));
        }
      } else {
        if (
          window.location.protocol !== "https:" &&
          window.location.hostname !== "localhost"
        ) {
          setError("Camera requires HTTPS or localhost to work");
        } else {
          setError("Camera access denied or not available");
        }
      }
    }
  }

  function stopCamera() {
    setCameraActive(false);
    if (rafRef.current) {
      try {
        cancelAnimationFrame(rafRef.current);
      } catch (e) {}
      rafRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        try {
          videoRef.current.srcObject = null;
        } catch (e) {}
      } catch (e) {}
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch (e) {}
      streamRef.current = null;
    }
  }
  function partiesChange(value) {
    console.log(selectedParties);
    let parties = [...selectedParties, value];
    setSelectedParty(parties);
    console.log(selectedParties);
  }
  function scanVideoFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      rafRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (vw === 0 || vh === 0) {
      setTimeout(() => {
        rafRef.current = requestAnimationFrame(scanVideoFrame);
      }, 100);
      return;
    }

    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, vw, vh);

    const decoded = tryDecodeFromCanvas();
    if (decoded) {
      setScannedText(decoded);
      stopCamera();
      callScanApi(decoded);
      return;
    }

    rafRef.current = requestAnimationFrame(scanVideoFrame);
  }

  const capturePhoto = () => {
    setError("");
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      setError("Camera not ready");
      return;
    }

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, vw, vh);

    try {
      const dataUrl = canvas.toDataURL("image/png");
      capturedPreviewRef.current = dataUrl;
      setSelectedImage(dataUrl);
    } catch (e) {
      console.warn("toDataURL failed", e);
    }

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        setScannedText(code.data);
        callScanApi(code.data);
        return;
      } else {
        setError("No QR code found in captured photo");
      }
    } catch (e) {
      console.warn("capture/scan error", e);
      setError("Failed to capture/scan image");
    }
  };
  const toggleOption = (id) => {
    setSelectedParty((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };
  return (
    <main className="mainOfQRCodeScanner">
      <div className="logo">
        <Link to="/mainpartydata">
          <img src="/اعزمك-01.png" alt="logo" />
        </Link>
      </div>
      {!scanSuccess && (
        <div className="dropdown_container">
          <div className="dropdown_header" onClick={() => setOpen(!open)}>
            {selectedParties.length > 0
              ? `${selectedParties.length} selected`
              : "Select parties"}
          </div>

          {open && (
            <div className="dropdown-menu">
              {parties.map((party) => (
                <label key={party.id} className="dropdown-item">
                  <input
                    type="checkbox"
                    checked={selectedParties.includes(party.id)}
                    onChange={() => toggleOption(party.id)}
                  />
                  {party.name}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {!scanSuccess ? (
        <div className="scannerContainer">
          <QrScanner
            disabled={scanSuccess}
            onSubmit={async (code) => {
              setScannedText(code);
              return await callScanApi(code);
            }}
          />
          {cameraActive && (
            <div style={{ marginTop: 12 }}>
              <div className="cameraPreview">
                <video
                  ref={videoRef}
                  style={{
                    width: "100%",
                    maxHeight: 360,
                    borderRadius: 12,
                    background: "#000",
                  }}
                  playsInline
                  muted
                  autoPlay
                />
                <p>Camera active — point at a QR code</p>

                <div>
                  <button
                    onClick={() => {
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      const ctx = canvas.getContext("2d");
                      if (!ctx) return;
                      try {
                        const vw = videoRef.current.videoWidth || 640;
                        const vh = videoRef.current.videoHeight || 480;
                        canvas.width = vw;
                        canvas.height = vh;
                        ctx.drawImage(videoRef.current, 0, 0, vw, vh);
                        const decoded = tryDecodeFromCanvas();
                        if (decoded) {
                          setScannedText(decoded);
                          callScanApi(decoded);
                        } else {
                          setError("No QR code found in captured frame");
                        }
                      } catch (e) {
                        setError("Capture failed");
                      }
                    }}
                  >
                    Scan Current Frame
                  </button>

                  {selectedImage && (
                    <img
                      src={selectedImage}
                      alt="captured preview"
                      style={{
                        width: 80,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
          {showImageScan && (
            <div className="scanCard centerCard">
              <MdOutlineImageSearch />
              <div
                className={`drop-zone ${isDragging ? "dragging" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileSelect({ target: { files: e.dataTransfer.files } });
                }}
              >
                {!selectedImage ? (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                    />
                    <button onClick={handleChooseImageClick}>
                      Choose Image
                    </button>
                    <p>Or drop an image to scan</p>
                  </div>
                ) : (
                  <div className="preview">
                    <p>Image ready to scan</p>
                    <div>
                      <button
                        onClick={() => {
                          try {
                            if (
                              selectedImage &&
                              selectedImage.startsWith("blob:")
                            ) {
                              URL.revokeObjectURL(selectedImage);
                            }
                          } catch (e) {}
                          setSelectedImage(null);
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setShowImageScan(false)}>
                Back to Camera
              </button>
            </div>
          )}
          {!showImageScan && (
            <div className="scanCard">
              <BsQrCodeScan />
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {devices.length > 1 && (
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    style={{ marginBottom: 8 }}
                  >
                    <option value="">Use default / environment</option>
                    {devices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${d.deviceId}`}
                      </option>
                    ))}
                  </select>
                )}

                {!cameraActive ? (
                  <button onClick={startCamera}>Start Camera Scan</button>
                ) : (
                  <button onClick={stopCamera}>Stop Camera</button>
                )}
                <button
                  onClick={() => {
                    setShowImageScan(true);
                    setCameraActive(false);
                  }}
                >
                  Scan an Image File
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: "none" }} />

          {error && (
            <div className="error" style={{ marginTop: 8, color: "red" }}>
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="successfully">
          <h1>Scan successfully</h1>
          <table className="info-table">
            <tbody>
              <tr>
                <td>{scanData?.name}</td>
                <th>Name</th>
              </tr>
              <tr>
                <td>{scanData?.phone}</td>
                <th>Phone Number</th>
              </tr>
              <tr>
                <td>{scanData?.scan}</td>
                <th>Scan</th>
              </tr>
              <tr>
                <td>{scanData?.maxScan}</td>
                <th>Max Scan</th>
              </tr>
            </tbody>
          </table>
          <button onClick={handleRescan}>Rescan</button>
        </div>
      )}
    </main>
  );
}
