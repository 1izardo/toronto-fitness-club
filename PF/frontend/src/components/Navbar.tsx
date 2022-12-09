import {
  Navbar as NB,
  Burger,
  Title,
  Group,
  NavLink,
  ScrollArea,
} from "@mantine/core";
import { IconLogout, TablerIcon } from "@tabler/icons";
import React from "react";
import { Link } from "react-router-dom";

function Navbar({
  open,
  setOpen,
  active,
  setActive,
  locations,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  active: string;
  setActive: (active: string) => void;
  locations: {
    label: string;
    link: string;
    icon: TablerIcon;
  }[];
}) {
  const navItems = locations.map((item) => (
    <NavLink
      component={Link}
      label={open ? item.label : null}
      key={item.label}
      to={item.link}
      icon={<item.icon stroke={1.5} size="1.75rem" />}
      mb={5}
      sx={(theme) => {
        return {
          borderRadius: theme.radius.md,
          ".mantine-NavLink-icon": {
            margin: open ? "" : 0,
          },
          display: "flex",
          justifyContent: "center",
          width: open ? "" : "min-content",
          marginInline: "auto",
        };
      }}
      onClick={(e) => {
        setActive(item.label);
      }}
      active={item.label === active}
    />
  ));

  return (
    <NB
      hiddenBreakpoint="sm"
      hidden={!open}
      width={{ sm: open ? 325 : 100 }}
      sx={{ transition: "all 250ms" }}
      p="md"
    >
      <NB.Section
        sx={(theme) => ({
          marginBottom: theme.spacing.sm,
          borderBottom: `1px solid ${
            theme.colorScheme === "dark"
              ? theme.colors.dark[4]
              : theme.colors.gray[2]
          }`,
        })}
      >
        <Group spacing="xs" mb="sm" position={!open ? "center" : "left"} noWrap>
          <Burger
            opened={open}
            onClick={() => setOpen(!open)}
            title={open ? "Close sidebar" : "Open sidebar"}
            size="md"
          />
          {open && (
            <Title order={3} sx={{ whiteSpace: "nowrap", overflow: "hidden" }}>
              Toronto Fitness Club
            </Title>
          )}
        </Group>
      </NB.Section>

      <NB.Section
        grow
        component={ScrollArea}
        sx={() => ({
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        })}
      >
        {navItems}
      </NB.Section>

      <NB.Section
        sx={(theme) => ({
          paddingTop: theme.spacing.sm,
          borderTop: `1px solid ${
            theme.colorScheme === "dark"
              ? theme.colors.dark[4]
              : theme.colors.gray[2]
          }`,
        })}
      >
        <NavLink
          component={Link}
          label={open && "Logout"}
          to="/logout"
          icon={<IconLogout stroke={1.5} size="1.75rem" />}
          sx={(theme) => {
            return {
              borderRadius: theme.radius.md,
              ".mantine-NavLink-icon": {
                margin: open ? "" : 0,
              },
              display: "flex",
              justifyContent: "center",
              width: open ? "" : "min-content",
              marginInline: "auto",
            };
          }}
        />
      </NB.Section>
    </NB>
  );
}

export default Navbar;
