import React, { useEffect } from "react";
import { useSignOut } from "react-auth-kit";
import { useNavigate } from "react-router-dom";

function Logout() {
  const signOut = useSignOut();
  const navigate = useNavigate();

  useEffect(() => {
    signOut();
    navigate("/login");
  });

  return <></>;
}

export default Logout;
