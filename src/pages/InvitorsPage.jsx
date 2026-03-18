import React, { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import "../style/_invitorsPage.scss";
import { FaUserEdit, FaFileExcel, FaFilePdf, FaEdit } from "react-icons/fa";
import { MdDelete, MdOutlineDeleteSweep } from "react-icons/md";
import { ImCheckmark2 } from "react-icons/im";
import { IoMdPersonAdd } from "react-icons/io";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Footer from "../components/Footer";
import { IoIosSearch } from "react-icons/io";

export default function InvitorsPage() {
  const location = useLocation();
  const [invitors, setInvitors] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  const [showActionBtns, setShowActionBtns] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [selectedInvitor, setSelectedInvitor] = useState(null);

  const [showChangeStatusBox, setShowChangeStatusBox] = useState(false);
  const [newStatus, setNewStatus] = useState("Invited");
  const params = useParams();

  const baseUrl = "https://www.izemak.com/azimak/public/api";
  let partyId = location.state?.partyId;
  if (!partyId) partyId = params.partyId;

  const fetchInvitors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/party/${partyId}`);
      const data = await res.json();
      setInvitors(
        (data?.data?.members || []).map((item) => ({
          ...item,
          selected: false,
        }))
      );
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitors();
  }, [partyId]);

  const handleSearch = async () => {
    if (!search) return fetchInvitors();
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/searchinvitor/${partyId}/${search}`);
      const data = await res.json();
      setInvitors(data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (invitor) => {
    setSelectedInvitor(invitor);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedInvitor) return;
    try {
      await fetch(`${baseUrl}/deleteinvitor/${selectedInvitor.id}`, {
        method: "DELETE",
      });
      setInvitors((prev) => prev.filter((i) => i.id !== selectedInvitor.id));
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setShowConfirm(false);
      setSelectedInvitor(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirm(false);
    setSelectedInvitor(null);
  };

  const handleSelectAllClick = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setShowActionBtns(newSelectAll);

    setInvitors((prev) =>
      prev.map((item) =>
        filteredInvitors.some((f) => f.id === item.id)
          ? { ...item, selected: newSelectAll }
          : item
      )
    );
  };

  const handleCheckboxChange = (id) => {
    setInvitors((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      );

      const anySelected = updated.some((item) => item.selected);
      const allSelected =
        filteredInvitors.length > 0 &&
        filteredInvitors.every(
          (f) => updated.find((i) => i.id === f.id)?.selected
        );

      setShowActionBtns(anySelected);
      setSelectAll(allSelected);

      return updated;
    });
  };

  const handleBulkDelete = async () => {
    const invitorsToDeleteIds = invitors
      .filter((invitor) => invitor.selected)
      .map((i) => i.id);

    if (invitorsToDeleteIds.length === 0) return;

    try {
      await fetch(`${baseUrl}/invitors/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: invitorsToDeleteIds }),
      });
      setInvitors((prev) =>
        prev.filter((item) => !invitorsToDeleteIds.some((d) => d === item.id))
      );
    } catch (err) {
      console.error("Bulk delete error:", err);
    } finally {
      setShowBulkDeleteConfirm(false);
      setShowActionBtns(false);
      setSelectAll(false);
    }
  };

  const handleChangeStatus = async () => {
    const selectedInvitors = invitors.filter((item) => item.selected);

    if (selectedInvitors.length === 0) return;
    const ids = selectedInvitors.map((i) => i.id);
    try {
      await fetch(`${baseUrl}/invitors/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: ids,
          status: newStatus.toLowerCase(),
        }),
      });

      setInvitors((prev) =>
        prev.map((item) =>
          item.selected ? { ...item, status: newStatus.toLowerCase() } : item
        )
      );
    } catch (err) {
      console.error("Change status error:", err);
    } finally {
      setShowChangeStatusBox(false);
    }
  };

const handleExportExcel = () => {
  const dataForExcel = invitors.map((item) => ({
    Name: item.name,
    "Phone Number": item.phoneNumber,
    "Max Scan": item.maxScan ? Number(item.maxScan) : 0,
    Status: item.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataForExcel);

  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const cellAddress = XLSX.utils.encode_cell({ r: R, c: 2 });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].t = "n"; 
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Invitors");

  const fileName = `${partyId || "party"}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("قائمة المدعوين", 14, 15);

    const tableColumn = ["اسم المدعو", "رقم الهاتف", "الحالة"];
    const tableRows = invitors.map((item) => [
      item.name,
      item.phoneNumber,
      item.status,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
    });

    const fileName = `${partyId || "party"}.pdf`;
    doc.save(fileName);
  };

  const filteredInvitors = invitors.filter((invitor) =>
    statusFilter === "All"
      ? true
      : invitor.status === statusFilter.toLowerCase()
  );

  return (
    <main className="invitorsPage">
      <header className="pageHeader">
        <div className="actions">
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All</option>
              <option>Invited</option>
              <option>Arrived</option>
              <option>Accepted</option>
              <option>Rejected</option>
              <option>Faild</option>
            </select>
          </div>
          <div className="search">
            <button onClick={handleSearch}>search</button>
            <IoIosSearch />
            <input
              type="text"
              placeholder="Enter the invitee's name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div>
            <Link to="/mainpartydata">
              <img src="/اعزمك-01.png" alt="" className="logo" />
            </Link>
          </div>
        </div>
      </header>

      {loading ? (
        <p className="loading">loading</p>
      ) : (
        <table className="invitorsTable">
          <thead>
            <tr>
              <th>Name of invitee</th>
              <th>phone number</th>
              <th>status</th>
              <th>Operations</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvitors.length > 0 ? (
              filteredInvitors.map((invitor, num) => (
                <tr key={num}>
                  <td>{num+1} - {invitor.name}</td>
                  <td>{invitor.phoneNumber}</td>
                  <td>{invitor.status}</td>
                  <td>
                    <div className="icons">
                      <div>
                        <button
                          className="deleteBtn"
                          onClick={() => handleDeleteClick(invitor)}
                        >
                          <MdDelete />
                        </button>
                      </div>
                      <div>
                        <button className="editBtn">
                          <Link to="/updateinvitor" state={invitor}>
                            <FaUserEdit />
                          </Link>
                        </button>
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          className="box"
                          checked={invitor.selected}
                          onChange={() => handleCheckboxChange(invitor.id)}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="emptyRow">
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showConfirm && (
        <div className="confirmOverlay">
          <div className="confirmBox">
            <p> {selectedInvitor?.name} Are you sure to delete ؟</p>
            <div className="confirmBtns">
              <button onClick={confirmDelete}>yes</button>
              <button onClick={cancelDelete}>no</button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteConfirm && (
        <div className="confirmOverlay">
          <div className="confirmBox">
            <p>
              Are you sure to delete{" "}
              {invitors.filter((invitor) => invitor.selected).length} invitor
              {invitors.filter((invitor) => invitor.selected).length !== 1
                ? ""
                : ""}
              ؟
            </p>
            <div className="confirmBtns">
              <button onClick={handleBulkDelete}>yes</button>
              <button onClick={() => setShowBulkDeleteConfirm(false)}>
                no
              </button>
            </div>
          </div>
        </div>
      )}

      {showChangeStatusBox && (
        <div className="confirmOverlay">
          <div className="confirmBox">
            <p>Change status</p>
            <div className="changeStatus">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option>Invited</option>
                <option>Arrived</option>
                <option>Accepted</option>
                <option>Rejected</option>
                <option>Faild</option>
              </select>
            </div>
            <div className="confirmBtns">
              <button onClick={handleChangeStatus}>update</button>
              <button onClick={() => setShowChangeStatusBox(false)}>
                cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bottomActions">
        {showActionBtns && (
          <>
            <button
              className="exportExcelBtn"
              onClick={() => setShowChangeStatusBox(true)}
            >
              <FaEdit />
            </button>
            <button
              className="exportExcelBtn"
              onClick={() => setShowBulkDeleteConfirm(true)}
            >
              <MdOutlineDeleteSweep />
            </button>
          </>
        )}
        <button className="exportExcelBtn" onClick={handleExportExcel}>
          <FaFileExcel />
        </button>
        <button className="exportPdfBtn" onClick={handleExportPDF}>
          <FaFilePdf />
        </button>
        <button className="selectAllBtn" onClick={handleSelectAllClick}>
          <ImCheckmark2 />
        </button>
        <button className="addInvitorBtn">
          <Link to={`/addinvitors/${partyId}`} state={{ partyId }}>
            <IoMdPersonAdd />
          </Link>
        </button>
      </div>
      <Footer />
    </main>
  );
}
