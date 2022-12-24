import { Menu, Text, Loader } from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons";
import axios from "../../utils/axios";
import React, { ReactNode, useEffect, useState } from "react";
import { showNotification } from "@mantine/notifications";

function EnrolledPopover({
  children,
  details,
  enrolled,
}: {
  children: ReactNode;
  details: string;
  enrolled?: boolean | null;
}) {
  const [instance, setInstance] = useState({
    id: -1,
    user_enrolled: false,
    class_name: "",
    date: "",
    start_time: "",
    end_time: "",
    cancelled: false,
    special: false,
    enrolled: 0,
    capacity: 0,
    parent: 0,
  });

  const [spaces, setSpaces] = useState(0);

  const handleEnrollment = () => {
    console.log(details);
    axios
      .patch(details)
      .then((res) => {
        const instance_copy = { ...instance };
        instance_copy.user_enrolled = res.data.user_enrolled;
        instance_copy.enrolled = res.data.enrolled;
        setInstance(instance_copy);
        setSpaces(res.data.capacity - res.data.enrolled);
      })
      .catch((err) => {
        if (400 <= err.response.status && err.response.status < 500) {
          showNotification({
            title: "Could not complete operation",
            message: err.response.data.detail,
            icon: <IconX />,
            color: "red",
            radius: "md",
          });
        } else {
          console.error(err);
        }
      });
  };

  useEffect(() => {
    axios.get(details).then((res) => {
      setInstance(res.data);
      setSpaces(res.data.capacity - res.data.enrolled);
    });
  }, [details, enrolled]);

  if (instance.id < 0) {
    return (
      <Menu shadow="md" width={200} position="right" withArrow offset={2}>
        <Menu.Target>{children}</Menu.Target>
        <Menu.Dropdown
          sx={{
            width: "auto !important",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            div: {
              height: "22px",
            },
          }}
        >
          <Loader size="sm"></Loader>
        </Menu.Dropdown>
      </Menu>
    );
  }

  return (
    <Menu
      shadow="md"
      width={200}
      position="right"
      withArrow
      offset={2}
      closeOnItemClick={false}
      radius="lg"
    >
      <Menu.Target>{children}</Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Instance Enrollment</Menu.Label>
        <Text size="xs" px="sm" pb="xs">
          There {spaces === 1 ? "is" : "are"} {spaces === 0 ? "no" : spaces}{" "}
          spot{spaces === 1 ? "" : "s"} available. You are currently{" "}
          <b>{instance.user_enrolled ? "enrolled" : "not enrolled"}</b>.
        </Text>
        <Menu.Divider />
        {instance.user_enrolled ? (
          <Menu.Item
            icon={<IconX size="1rem" />}
            color="red"
            onClick={handleEnrollment}
          >
            Unenroll
          </Menu.Item>
        ) : (
          <Menu.Item
            icon={<IconPlus size="1rem" />}
            disabled={spaces === 0}
            onClick={handleEnrollment}
          >
            Enroll
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}

export default EnrolledPopover;
