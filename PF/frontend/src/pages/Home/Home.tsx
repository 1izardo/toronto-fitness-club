import { Paper, Title, Stack, SegmentedControl } from "@mantine/core";
import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "../../utils/axios";
import { getCookie } from "../../utils/cookies";
import UserSchedule from "./UserSchedule";

function Home() {
  const [select, setSelect] = useState("schedule");
  const [ongoing, setOngoing] = useState([]);

  const [setActive]: [setActive: (active: string) => void] = useOutletContext();

  useEffect(() => {
    setActive("Home");
  });

  useEffect(() => {
    axios
      .get("/accounts/ongoing/", {
        headers: {
          Authorization: `Bearer ${getCookie("_auth")}`,
        },
      })
      .then((res) => {
        setOngoing(res.data.results);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <Paper p="xl">
      <Title size="3rem" order={1}>
        Home
      </Title>
      {ongoing.length > 0 ? (
        <Stack spacing={0} my="md" maw={500}>
          <Title order={3}>Ongoing Classes</Title>
          <UserSchedule when={"ongoing"} />
        </Stack>
      ) : (
        <></>
      )}
      <Stack spacing={0} my="md" maw={500}>
        <Title order={2} mb="sm">
          Schedule
        </Title>
        <Paper p="xs" withBorder>
          <SegmentedControl
            fullWidth
            value={select}
            onChange={setSelect}
            mb="lg"
            data={[
              { label: "Upcoming", value: "schedule" },
              { label: "History", value: "history" },
            ]}
          />
          <UserSchedule when={select} />
        </Paper>
      </Stack>
    </Paper>
  );
}

export default Home;
