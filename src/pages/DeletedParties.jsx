import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../style/_mainPartyData.scss";
import { MdRestore } from "react-icons/md";
import Footer from "../components/Footer";

const BASE_URL = "https://www.izemak.com/azimak/public/api";

export default function DeletedParties() {
  const [deleted, setDeleted] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [selectedParty, setSelectedParty] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const axiosInstance = axios.create({
    baseURL: BASE_URL,
  });

  useEffect(() => {
    fetchDeleted(currentPage);
  }, [currentPage]);

  const getId = (party) =>
    party.id ?? party.party_id ?? party.partyId ?? party.id_party ?? null;

  const fetchDeleted = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/parties/deleted?page=${page}`);
      const list = res.data?.data ?? [];
      setDeleted(Array.isArray(list) ? list : []);
      setLastPage(res.data?.meta?.last_page || 1);
    } catch (err) {
      console.error("Failed to load deleted parties:", err);
      setDeleted([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreClick = (party) => {
    setSelectedParty(party);
    setShowModal(true);
  };

  const handleConfirmRestore = async () => {
    if (!selectedParty) return;
    const id = getId(selectedParty);
    if (!id) return;

    try {
      await axiosInstance.get(`/party/restore/${id}`);
      fetchDeleted(currentPage);
    } catch (err) {
      console.error("Restore error:", err);
    } finally {
      setShowModal(false);
      setSelectedParty(null);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedParty(null);
  };


  const goToNextPage = () => {
    if (currentPage < lastPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(
      1,
      currentPage - Math.floor(maxPagesToShow / 2)
    );
    let endPage = Math.min(lastPage, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`pageNumber ${i === currentPage ? "active" : ""}`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <main className="mainOfMainPartyData">
      <div className="addParty">
        <div>
          <Link to="/mainpartydata">
            <img src="/اعزمك-01.png" alt="logo" />
          </Link>
        </div>
      </div>

      <table className="partyTable">
        <thead>
          <tr>
            <th>Party name</th>
            <th>Party time</th>
            <th>Party address</th>
            <th>Restoration</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="4" className="empty">Loading</td>
            </tr>
          ) : deleted.length > 0 ? (
            deleted.map((party, idx) => (
              <tr key={idx}>
                <td>{party.name ?? party.title ?? "-"}</td>
                <td>{party.time ?? "-"}</td>
                <td>{party.address ?? party.location ?? "-"}</td>
                <td>
                  <button
                    className="editBtn"
                    onClick={() => handleRestoreClick(party)}
                  >
                    <MdRestore />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="empty">No data yet</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="pages">
        {currentPage > 1 && (
          <button className="prev" onClick={goToPrevPage}>
            Previous
          </button>
        )}

        {renderPageNumbers()}

        <button
          className="next"
          onClick={goToNextPage}
          disabled={currentPage === lastPage}
        >
          Next
        </button>
      </div>

      {showModal && (
        <div className="modalOverlay">
          <div className="modalBox">
            <p>Do you want to retrieve this party?</p>
            <div className="modalActions">
              <button className="confirmBtn" onClick={handleConfirmRestore}>
                Restore
              </button>
              <button className="cancelBtn" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
