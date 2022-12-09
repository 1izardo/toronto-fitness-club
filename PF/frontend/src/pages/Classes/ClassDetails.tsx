import {
  Button,
  Paper,
  Title,
  Text,
  Stack,
  List,
  Tooltip,
  Group,
  Badge,
} from "@mantine/core";
import axios from "../../utils/axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LoadingPage from "../../components/LoadingPage";
import Schedule from "../Studios/Schedule";
import { showNotification } from "@mantine/notifications";
import { IconX } from "@tabler/icons";

function ClassDetails() {
  const { studio_id, class_id } = useParams();
  const [cclass, setCclass] = useState({
    name: "",
    description: "",
    keywords: [""],
    studio: "",
    coach: "",
    capacity: 0,
    enrolled: 0,
    user_enrolled: false,
    start_time: "",
    end_time: "",
    schedule: [""],
  });

  const handleEnrollment = () => {
    axios
      .patch(`/studios/${studio_id}/classes/${class_id}/`)
      .then((res) => {
        const cclass_copy = { ...cclass };
        cclass_copy.user_enrolled = res.data.user_enrolled;
        cclass_copy.enrolled = res.data.enrolled;
        setCclass(cclass_copy);
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
    axios.get(`/studios/${studio_id}/classes/${class_id}/`).then((res) => {
      setCclass(res.data);
    });
  }, [studio_id, class_id]);

  if (cclass.name === "") {
    return <LoadingPage />;
  }

  return (
    <Paper p="xl">
      <Title size="3rem" order={1} pb="sm">
        {cclass.name}
      </Title>
      {cclass.user_enrolled ? (
        <Tooltip
          label="This will unenroll you from all future instances."
          position="bottom-start"
          radius="xl"
        >
          <Button
            size="md"
            variant="light"
            color="red"
            radius="xl"
            onClick={handleEnrollment}
          >
            Unenroll
          </Button>
        </Tooltip>
      ) : (
        <Tooltip
          label="This will enroll you in all future instances."
          position="bottom-start"
          radius="xl"
        >
          <Button
            size="md"
            variant="light"
            radius="xl"
            onClick={handleEnrollment}
          >
            Enroll in class
          </Button>
        </Tooltip>
      )}
      <Stack spacing="xs" mt="md">
        <Title order={2} size="h3">
          Description
        </Title>
        <Text>{cclass.description}</Text>
      </Stack>
      {cclass.keywords.length > 0 ? (
        <Stack spacing="xs" mt="md">
          <Title order={2} size="h3">
            Keywords
          </Title>
          <Group spacing="xs">
            {cclass.keywords.map((keyword: string, index: number) => {
              return (
                <Badge size="lg" color="gray">
                  {keyword}
                </Badge>
              );
            })}
          </Group>
        </Stack>
      ) : (
        <></>
      )}
      <Stack spacing="xs" mt="md">
        <Title order={2} size="h3">
          Schedule
        </Title>
        <List>
          <List.Item>
            Usually takes place from {cclass.start_time.slice(0, -3)} to{" "}
            {cclass.end_time.slice(0, -3)}
          </List.Item>
          {cclass.schedule.map((rule, index) => {
            return (
              <List.Item key={index}>
                {rule.charAt(0).toUpperCase() + rule.slice(1)}
              </List.Item>
            );
          })}
        </List>
      </Stack>
      <Stack spacing="xs" mt="md">
        <Title order={2} size="h3" w="auto">
          Upcoming Classes
        </Title>
        <Schedule
          path={`/studios/${studio_id}/classes/${class_id}/list`}
          studio_id={studio_id}
          class_id={class_id}
          enrolled={cclass.user_enrolled}
        />
      </Stack>
    </Paper>
  );
}

export default ClassDetails;
