import { useEffect, useState } from "react";
import Footer from "../components/Footer";
import { Link } from "react-router";
import "../style/_hotelDetalies.scss";

export default function HotelDetalies() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || user.type !== "hotel") {
      window.location.href = "/login";
      return;
    }

    fetchHotelParties(user.hotel_id);
  }, []);

  const fetchHotelParties = async (hotelId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "https://www.izemak.com/azimak/public/api/parties",
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();

      const filtered = (data.data || []).filter(
        (party) => party.hotel_id === hotelId
      );

      setParties(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="hotelDetails">
      <div className="header">
        <div>
          <Link to="/">
            <button>Log Out</button>
          </Link>
        </div>
        <div>
          <img src="/اعزمك-01.png" alt="logo" />
        </div>
      </div>

      {loading ? (
        <p>Loading</p>
      ) : parties.length === 0 ? (
        <p>There are no parties for this hotel</p>
      ) : (
        <table className="partyTable">
          <thead>
            <tr>
              <th>Party name</th>
              <th>Date</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {parties.map((party) => (
              <tr key={party.id}>
                <td>{party.name}</td>
                <td>{party.time}</td>
                <td>{party.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Footer />
    </main>
  );
}
