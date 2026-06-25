import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../style/_mainPartyData.scss";
import { FaUserEdit, FaRegEdit } from "react-icons/fa";
import { GiPartyPopper } from "react-icons/gi";
import { MdDelete } from "react-icons/md";
import { MdRestore } from "react-icons/md";
import { RiUserSettingsLine } from "react-icons/ri";
import { MdBarcodeReader } from "react-icons/md";
import { FaHotel } from "react-icons/fa";
import { MdOutlineSecurity } from "react-icons/md";
import Footer from "../components/Footer";

export default function MainPartyData() {
  const [parties, setParties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);

  const [allParties, setAllParties] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editPartyName, setEditPartyName] = useState("");
  const [editPartyId, setEditPartyId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [deletePartyName, setDeletePartyName] = useState("");

  const [employees, setEmployees] = useState([]);
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const [addingIndex, setAddingIndex] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedPartyId, setSelectedPartyId] = useState(null);

  const baseUrl = "https://www.izemak.com/azimak/public/api/parties/lists";

  const fetchParties = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${baseUrl}?page=${page}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      const normalized = (data.data || []).map((p) => ({
        ...p,
        employees: Array.isArray(p.employee) ? p.employee : [],
      }));
      setParties(normalized);
      setLastPage(data.meta?.last_page || 1);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllParties = async () => {
    setLoading(true);
    try {
      let page = 1;
      let last = 1;
      let all = [];

      do {
        const token = localStorage.getItem("token");
        const res = await fetch(`${baseUrl}?page=${page}`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        all = [...all, ...(data.data || [])];
        last = data.meta?.last_page || 1;
        page++;
      } while (page <= last);

      setAllParties(all);
      return all;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(
        "https://www.izemak.com/azimak/public/api/employees",
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) throw new Error("no employees API");
      const data = await res.json();
      setEmployees(data?.data || data || []);
    } catch (err) {
      console.warn("Employees fetch failed — using fallback sample list.", err);
      setEmployees([
        { id: 1, name: "Ahmad Ali" },
        { id: 2, name: "Mona Hassan" },
        { id: 3, name: "Omar Mahmoud" },
      ]);
    }
  };

  useEffect(() => {
    fetchParties(currentPage);
    fetchEmployees();
  }, [currentPage]);

  const confirmDelete = (index) => {
    setDeleteIndex(index);
    setDeletePartyName(parties[index].name);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (deleteIndex === null) return;
    try {
      const deleteUrl =
        "https://www.izemak.com/azimak/public/api/deleteparty/" +
        parties[deleteIndex].id;
      await fetch(deleteUrl, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      setParties(parties.filter((_, i) => i !== deleteIndex));
      setShowModal(false);
      setDeleteIndex(null);
      setDeletePartyName("");
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const searchUrl = "https://www.izemak.com/azimak/public/api/searchparty";

  const handleSearch = async () => {
    const term = searchTerm.trim();

    if (!term) {
      setSearchPerformed(false);
      setCurrentPage(1);
      fetchParties(1);
      return;
    }

    setLoading(true);
    setSearchPerformed(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${searchUrl}/${encodeURIComponent(term)}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      const results = Array.isArray(data.data) ? data.data : data;

      setParties(results || []);
    } catch (error) {
      console.error("Search error:", error);
      setParties([]);
    } finally {
      setLoading(false);
    }
  };

  const goToNextPage = () => {
    if (currentPage < lastPage) setCurrentPage((prev) => prev + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const openEditModal = (party) => {
    setEditPartyName(party.name);
    setEditPartyId(party.id);
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editPartyId || !editPartyName.trim()) return;
    try {
      const response = await fetch(
        "https://www.izemak.com/azimak/public/api/update/party",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: editPartyId, name: editPartyName }),
        },
      );
      const data = await response.json();
      if (data.success || response.ok) {
        const updated = parties.map((p) =>
          p.id === editPartyId ? { ...p, name: editPartyName } : p,
        );
        setParties(updated);
        setShowEditModal(false);
      } else alert("error");
    } catch (error) {
      console.error("Edit error:", error);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
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
        </button>,
      );
    }
    return pages;
  };

  const toggleDropdown = (index, partyId) => {
    setOpenDropdownIndex((prev) => {
      const next = prev === index ? null : index;
      if (next === index) {
        setSelectedEmployees([]);
        setSelectedPartyId(partyId);
      } else {
        setSelectedEmployees([]);
        setSelectedPartyId(null);
      }
      return next;
    });
  };

  const toggleEmployeeSelection = (emp) => {
    setSelectedEmployees((prev) => {
      const exists = prev.find((e) => e.id === emp.id);
      if (exists) return prev.filter((e) => e.id !== emp.id);
      return [...prev, emp];
    });
  };

  const addEmployeesToParty = async (partyId, employees) => {
    const toAdd = Array.isArray(employees) ? employees : [employees];
    const party = parties.find((p) => p.id === partyId) || { employees: [] };
    const uniqueToAdd = toAdd.filter(
      (emp) => !(party.employee || []).some((e) => e.id === emp.id),
    );

    if (uniqueToAdd.length === 0) {
      setOpenDropdownIndex(null);
      setSelectedEmployees([]);
      return;
    }

    setAddingIndex(partyId);

    try {
      const url = "https://www.izemak.com/azimak/public/api/party/employees";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          party_id: partyId,
          employee_ids: uniqueToAdd.map((e) => e.id),
        }),
      });
      const data = await res.json();

      if (res.ok || data.success) {
        setParties((prev) =>
          prev.map((p) =>
            p.id === partyId
              ? { ...p, employee: [...(p.employees || []), ...uniqueToAdd] }
              : p,
          ),
        );

        setOpenDropdownIndex(null);
        setSelectedEmployees([]);
      } else {
        console.error("Add employee failed:", data);
        alert("Failed to add employee");
      }
    } catch (err) {
      console.error("Add employee error:", err);
      alert("Error");
    } finally {
      setAddingIndex(null);
    }
  };

  return (
    <main className="mainOfMainPartyData">
      <div className="addParty">
        <button className="Btn">
          <Link to="/giving_permissions">
            <MdOutlineSecurity />
            <p>Giving Permissions</p>
          </Link>
        </button>
        <button className="Btn">
          <Link to="/createnewparty">
            <GiPartyPopper />
            <p>new party</p>
          </Link>
        </button>
        <div className="search">
          <button className="Btn" onClick={handleSearch}>
            search
          </button>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), handleSearch())
            }
          />
        </div>
        <div>
          <button className="Btn">
            <Link to="/qr_code_scanner">
              <MdBarcodeReader />
              <p>Barcode</p>
            </Link>
          </button>
        </div>
        <div>
          <button className="Btn">
            <Link to="/deletedparties">
              <MdRestore />
              <p>deleted parties</p>
            </Link>
          </button>
        </div>

        <div>
          <button className="accessbtn">
            <Link to="/add_a_hotel">
              <FaHotel />
              <p>Hotels</p>
            </Link>
          </button>
        </div>

        <div>
          <button className="accessbtn">
            <Link to="/access_staff">
              <RiUserSettingsLine />
              <p>Staff</p>
            </Link>
          </button>
        </div>
        <div>
          <Link to="/">
            <img src="/free-demo.png" alt="logo" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="loadingSpinner">
          <div className="spinner"></div>
          <p>Loading</p>
        </div>
      ) : (
        <>
          {!searchPerformed && (
            <div className="pages">
              {currentPage > 5 && (
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
          )}

          <table className="partyTable">
            <thead>
              <tr>
                <th>Party name</th>
                <th>Party time</th>
                <th>Party address</th>
                <th>Add Employee</th>
                <th>procedures</th>
              </tr>
            </thead>
            <tbody>
              {parties.length > 0 ? (
                parties.map((party, index) => (
                  <tr key={party.id ?? index}>
                    <td>
                      {party.name}{" "}
                      <button
                        className="EditButton"
                        onClick={() => openEditModal(party)}
                      >
                        <FaRegEdit />
                      </button>
                    </td>
                    <td>{party.time}</td>
                    <td>{party.address}</td>

                    <td className="employeeCell">
                      <button
                        className="AddEmployee"
                        onClick={() => toggleDropdown(index, party.id)}
                      >
                        Add Employee
                      </button>

                      {party.employee && party.employee.length > 0 ? (
                        <div className="assignedList">
                          {party.employee.map((emp) => (
                            <div
                              key={emp.id ?? emp.name ?? emp}
                              className="assignedItem"
                            >
                              {emp.name ?? emp}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {openDropdownIndex === index && (
                        <div>
                          <ul role="listbox" className="employeeDropdown">
                            {employees.length > 0 ? (
                              employees.map((emp) => (
                                <li key={emp.id} className="employeeItem">
                                  <button
                                    type="button"
                                    onClick={() => toggleEmployeeSelection(emp)}
                                    className={`employeeBtn ${selectedEmployees.find((e) => e.id === emp.id) ? "selected" : ""}`}
                                    disabled={addingIndex === party.id}
                                  >
                                    {selectedEmployees.find(
                                      (e) => e.id === emp.id,
                                    )
                                      ? "✓ "
                                      : ""}
                                    {emp.name}
                                  </button>
                                </li>
                              ))
                            ) : (
                              <li className="employeeItem">No employees</li>
                            )}
                          </ul>

                          <div className="dropdownActions">
                            <button
                              className="confirmBtn"
                              onClick={() =>
                                addEmployeesToParty(party.id, selectedEmployees)
                              }
                              disabled={
                                addingIndex === party.id ||
                                selectedEmployees.length === 0
                              }
                            >
                              Add selected
                            </button>
                            <button
                              className="cancelBtn"
                              onClick={() => {
                                setOpenDropdownIndex(null);
                                setSelectedEmployees([]);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </td>

                    <td>
                      <button
                        className="deleteBtn"
                        onClick={() => confirmDelete(index)}
                      >
                        <MdDelete />
                      </button>
                      <button className="editBtn">
                        <Link
                          to={`/addinvitors/${party.id}`}
                          state={{ partyName: party.name, partyId: party.id }}
                        >
                          <FaUserEdit />
                        </Link>
                      </button>
                    </td>
                  </tr>
                ))
              ) : searchPerformed ? (
                <tr>
                  <td colSpan="5" className="empty">
                    No matching results found
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="5" className="empty">
                    There is no data in the table
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {!searchPerformed && (
            <div className="pages">
              {currentPage > 5 && (
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
          )}
        </>
      )}

      {showModal && (
        <div className="modalOverlay">
          <div className="modal">
            <h3> Are you sure you want to delete {deletePartyName} ؟</h3>
            <div className="modalActions">
              <button className="confirmBtn" onClick={handleDelete}>
                yes
              </button>
              <button className="cancelBtn" onClick={() => setShowModal(false)}>
                no
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Edit party name</h3>
            <input
              type="text"
              value={editPartyName}
              onChange={(e) => setEditPartyName(e.target.value)}
            />
            <div className="modalActions">
              <button className="confirmBtn" onClick={handleEditSubmit}>
                Save
              </button>
              <button
                className="cancelBtn"
                onClick={() => setShowEditModal(false)}
              >
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
