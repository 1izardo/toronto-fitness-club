import { AppShell } from "@mantine/core";
import {
  IconCash,
  IconHome,
  IconMap,
  IconReceipt2,
  IconSearch,
  IconUserCircle,
} from "@tabler/icons";
import Header from "./Header";
import Navbar from "./Navbar";
import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import axios from "../utils/axios";
import { getCookie } from "../utils/cookies";

// List of locations for sidebar
const locations = [
  { link: "/", label: "Home", icon: IconHome },
  { link: "/browse", label: "Browse", icon: IconMap },
  { link: "/search", label: "Search", icon: IconSearch },
  { link: "/subscriptions", label: "Subscriptions", icon: IconCash },
  { link: "/payments", label: "Payments", icon: IconReceipt2 },
  { link: "/profile", label: "Profile", icon: IconUserCircle },
];

function Shell() {
  const [active, setActive] = useState("Home");
  const [open, setOpen] = useState(false);

  // This fixes map weirdness when collapsing the sidebar
  useEffect(() => {
    window.dispatchEvent(new Event("resize"));
  }, [open]);

  useEffect(() => {
    axios.defaults.headers.common["Authorization"] = `Bearer ${getCookie(
      "_auth"
    )}`;
  });

  return (
    <AppShell
      layout="alt"
      padding={0}
      header={<Header open={open} setOpen={setOpen} />}
      navbar={
        <Navbar
          open={open}
          setOpen={setOpen}
          active={active}
          setActive={setActive}
          locations={locations}
        />
      }
    >
      <Outlet context={[setActive]} />
    </AppShell>
  );
}

export default Shell;
