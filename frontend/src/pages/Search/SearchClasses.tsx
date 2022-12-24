import {
  Paper,
  Title,
  Stack,
  TextInput,
  Group,
  Button,
  Text,
} from "@mantine/core";
import { TimeRangeInput } from "@mantine/dates";
import { showNotification } from "@mantine/notifications";
import {
  IconLetterCase,
  IconSearch,
  IconUser,
  IconClock,
  IconX,
} from "@tabler/icons";
import React, { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import axios from "../../utils/axios";
import ClassFilters from "./ClassFilters";
import SearchClassesResults from "./SearchClassesResults";

function SearchClasses() {
  const [setActive]: [setActive: (active: string) => void] = useOutletContext();
  useEffect(() => {
    setActive("Search");
  });
  const { studio_id } = useParams();

  const [filters, setFilters] = useState(["name"]);
  const [query, setQuery] = useState<string | null>(null);
  const [studioName, setStudioName] = useState("");
  const [className, setClassName] = useState("");
  const [coachName, setCoachName] = useState("");
  const [timeRange, setTimeRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const shortTime = new Intl.DateTimeFormat("en-GB", {
    timeStyle: "short",
  });

  useEffect(() => {
    axios
      .get(`/studios/${studio_id}/details/`)
      .then((res) => {
        setStudioName(res.data.name);
      })
      .catch((err) => {
        setStudioName("Unknown");
        if (400 <= err.response.status && err.response.status < 500) {
          showNotification({
            title: "Could not get studio details",
            message: err.response.data.detail,
            icon: <IconX />,
            color: "red",
            radius: "md",
          });
        } else {
          console.log(err);
          showNotification({
            title: "Server error",
            message: err.response.data.detail,
            icon: <IconX />,
            color: "red",
            radius: "md",
          });
        }
      });
  }, [studio_id]);

  const handleSearch = () => {
    let name_query = "";
    let coachName_query = "";
    let timeRange_query = "";
    if (filters.includes("name")) name_query = `name=${className}&`;
    if (filters.includes("coach")) coachName_query = `coach=${coachName}&`;
    if (filters.includes("timeRange")) {
      if (timeRange[0] !== null) {
        timeRange_query += `after=${shortTime.format(timeRange[0])}&`;
      }
      if (timeRange[1] !== null) {
        timeRange_query = `before=${shortTime.format(timeRange[1])}&`;
      }
    }
    setQuery(name_query + coachName_query + timeRange_query);
  };

  return (
    <Paper p="xl" maw={600}>
      <Title size="3rem" order={1}>
        Search Classes
      </Title>
      <Title order={2} pt="sm">
        Studio: {studioName}
      </Title>
      <Stack spacing={0} my="md">
        <Text mb="xs">Filter by the following fields:</Text>
        <ClassFilters filters={filters} setFilters={setFilters} />
      </Stack>
      <Stack spacing="sm" my="md">
        {filters.length > 0 ? (
          <>
            <Text>Specify filter values:</Text>
            {filters.includes("name") ? (
              <TextInput
                icon={<IconLetterCase size="1rem" stroke={1.5} />}
                radius="xl"
                size="sm"
                value={className}
                onChange={(event) => setClassName(event.currentTarget.value)}
                placeholder="Search by class name"
              />
            ) : (
              <></>
            )}
            {filters.includes("coach") ? (
              <TextInput
                icon={<IconUser size="1rem" stroke={1.5} />}
                radius="xl"
                size="sm"
                value={coachName}
                onChange={(event) => setCoachName(event.currentTarget.value)}
                placeholder="Search by coach name"
              />
            ) : (
              <></>
            )}
            {filters.includes("timeRange") ? (
              <TimeRangeInput
                icon={<IconClock size="1rem" stroke={1.5} />}
                value={timeRange}
                onChange={setTimeRange}
                radius="xl"
                clearable
              />
            ) : (
              <></>
            )}
            <Group position="center">
              <Button
                rightIcon={<IconSearch size="1rem" />}
                radius="xl"
                onClick={handleSearch}
              >
                Search
              </Button>
            </Group>
          </>
        ) : (
          <Text color="red">Please select at least one filter field</Text>
        )}
      </Stack>
      {query === null ? (
        <></>
      ) : (
        <>
          <Title order={2} pb="sm">
            Results
          </Title>
          <SearchClassesResults query={query} studio={studio_id as string} />
        </>
      )}
    </Paper>
  );
}

export default SearchClasses;
