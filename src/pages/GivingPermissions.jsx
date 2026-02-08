import React from "react";
import "../style/_givingPermissions.scss";
import { Link } from "react-router";

export default function GivingPermissions() {
  return (
    <main className="mainOfGivingPermissions">
      <Link to="/mainpartydata">
        <div className="logo">
          <img src="اعزمك-01.png" alt="" className="" />
        </div>
      </Link>
      <h1>Giving Permissions</h1>
    </main>
  );
}
