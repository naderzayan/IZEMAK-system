import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../style/_accessStaff.scss";
import { MdDelete } from "react-icons/md";
import Footer from "../components/Footer";
import { IoPersonAddSharp } from "react-icons/io5";

export default function AccessStaff() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const employeesUrl = "https://www.izemak.com/azimak/public/api/employees";

  const fetchEmployees = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${employeesUrl}?page=${page}`, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmployees(data);
        setLastPage(1);
      } else if (Array.isArray(data.data)) {
        setEmployees(data.data);
        setLastPage(data.meta?.last_page || 1);
      } else {
        setEmployees([]);
        setLastPage(1);
      }
    } catch (err) {
      console.error("Fetch employees error:", err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(currentPage);
  }, [currentPage]);

  const goToNextPage = () => {
    if (currentPage < lastPage) setCurrentPage((p) => p + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
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
        </button>
      );
    }
    return pages;
  };

  const openConfirm = (emp) => {
    setEmployeeToDelete(emp);
    setShowConfirm(true);
  };

  const closeConfirm = () => {
    setEmployeeToDelete(null);
    setShowConfirm(false);
  };

  const deleteEmployee = async (id) => {
    if (!id) {
      closeConfirm();
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`${employeesUrl}/delete`, {
        method: "post",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: id.toString() }),
      });

      if (!res.ok) {
        console.warn("Delete request failed or endpoint not implemented, status:", res.status);
      }

      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Delete employee error:", err);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeleting(false);
      closeConfirm();
    }
  };

  return (
    <main className="mainOfAccessStaff">
      <div className="addEmployee">
        <button className="Btn">
          <Link to="/create_employee">
          Add employee
          </Link>
          <IoPersonAddSharp />
        </button>
        <div>
          <Link to="/mainpartydata">
            <img src="/اعزمك-01.png" alt="logo" />
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
          <table className="accessTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {employees && employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp.id ?? emp.email ?? Math.random()}>
                    <td>{emp.name || "-"}</td>
                    <td>{emp.phone_number || "-"}</td>
                    <td>{emp.email || "-"}</td>
                    <td>
                      <button
                        className="deleteBtn"
                        title="Delete"
                        onClick={() => openConfirm(emp)}
                      >
                        <MdDelete />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty">
                    There is no data in the table
                  </td>
                </tr>
              )}
            </tbody>
          </table>

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
        </>
      )}

      {showConfirm && (
        <div className="confirmOverlay" role="dialog" aria-modal="true">
          <div className="confirmBox">
            <p className="confirmText">Are you sure you want to delete the employee?</p>
            <p className="confirmName">{employeeToDelete?.name || ""}</p>

            <div className="confirmButtons">
              <button
                className="confirmBtn_yes"
                onClick={() => deleteEmployee(employeeToDelete?.id)}
                disabled={deleting}
              >
                yes
              </button>
              <button
                className="confirmBtn_no"
                onClick={closeConfirm}
                disabled={deleting}
              >
                no
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
