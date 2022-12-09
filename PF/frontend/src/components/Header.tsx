import { MediaQuery, Header as H, Burger, Title } from "@mantine/core";
import React from "react";

function Header({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <MediaQuery largerThan="sm" styles={{ display: "none" }}>
      <H height={{ base: 50, sm: 0 }} p="md">
        <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Burger
            opened={open}
            onClick={() => setOpen(!open)}
            size="sm"
            mr="xl"
          />
          <Title order={3}>Toronto Fitness Club</Title>
        </div>
      </H>
    </MediaQuery>
  );
}

export default Header;
