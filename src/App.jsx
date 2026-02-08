import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import CreateNewParty from "./pages/CreateNewParty";
import MainPartyData from "./pages/MainPartyData";
import AddInvitors from "./pages/AddInvitors";
import InvitorsPage from "./pages/InvitorsPage";
import UpDateInvitor from "./pages/UpDateInvitor";
import QRCodeScanner from "./pages/QRCodeScanner";
import DeletedParties from "./pages/DeletedParties";
import AccessSttaf from "./pages/AccessStaff";
import CreateEmployee from "./pages/CreateEmployee";
import GivingPermissions from "./pages/GivingPermissions";
import AddAHotel from "./pages/AddAHotel";
import HotelDetalies from "./pages/HotelDetalies";

export default function App() {
  return (
    <main>
      <Router>
        <Routes>
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/createnewparty" element={<CreateNewParty />} />
          <Route path="/mainpartydata" element={<MainPartyData />} />
          <Route path="/deletedparties" element={<DeletedParties />} />
          <Route path="/addinvitors/:partyId" element={<AddInvitors />} />
          <Route path="/invitorspage/:partyId" element={<InvitorsPage />} />
          <Route path="/updateinvitor" element={<UpDateInvitor />} />
          <Route path="/qr_code_scanner" element={<QRCodeScanner />} />
          <Route path="/ar_qr_code_scanner" element={<QRCodeScanner />} />
          <Route path="/access_staff" element={<AccessSttaf />} />
          <Route path="/create_employee" element={<CreateEmployee />} />
          <Route path="/giving_permissions" element={<GivingPermissions />} />
          <Route path="/add_a_hotel" element={<AddAHotel />} />
          <Route path="/hotel_detalies" element={<HotelDetalies />} />
        </Routes>
      </Router>
    </main>
  );
}
