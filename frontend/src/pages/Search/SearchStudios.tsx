import {
  TextInput,
  Paper,
  Title,
  Text,
  Stack,
  Group,
  Button,
} from "@mantine/core";
import {
  IconSearch,
  IconLetterCase,
  IconStars,
  IconBulb,
  IconUsers,
} from "@tabler/icons";
import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import SearchStudiosResults from "./SearchStudiosResults";
import StudioFilters from "./StudioFilters";

function formatCommaSeparated(key: string, vals: string): string {
  const split = vals.split(",");
  const params = split.map((val) => {
    return `${key}=${val.trim()}&`;
  });
  return params.join("");
}

function SearchStudios() {
  const [setActive]: [setActive: (active: string) => void] = useOutletContext();
  useEffect(() => {
    setActive("Search");
  });

  const [filters, setFilters] = useState(["name"]);
  const [query, setQuery] = useState<string | null>(null);
  const [studioName, setStudioName] = useState("");
  const [amenities, setAmenities] = useState("");
  const [classNames, setClassNames] = useState("");
  const [coachNames, setCoachNames] = useState("");

  const handleSearch = () => {
    let name_query = "";
    let amenities_query = "";
    let classNames_query = "";
    let coachNames_query = "";
    if (filters.includes("name")) name_query = `name=${studioName}&`;
    if (filters.includes("amenities"))
      amenities_query = formatCommaSeparated("amenities", amenities);
    if (filters.includes("classNames"))
      classNames_query = formatCommaSeparated("classes", classNames);
    if (filters.includes("coachNames"))
      coachNames_query = formatCommaSeparated("coaches", classNames);
    setQuery(
      name_query + amenities_query + classNames_query + coachNames_query
    );
  };

  return (
    <Paper p="xl" maw={600}>
      <Title size="3rem" order={1}>
        Search Studios
      </Title>
      <Stack spacing={0} my="md">
        <Text mb="xs">Filter by the following fields:</Text>
        <StudioFilters filters={filters} setFilters={setFilters} />
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
                value={studioName}
                onChange={(event) => setStudioName(event.currentTarget.value)}
                placeholder="Search by studio name"
              />
            ) : (
              <></>
            )}
            {filters.includes("amenities") ? (
              <TextInput
                icon={<IconStars size="1rem" stroke={1.5} />}
                radius="xl"
                size="sm"
                value={amenities}
                onChange={(event) => setAmenities(event.currentTarget.value)}
                placeholder="Search by amenities (comma separated)"
              />
            ) : (
              <></>
            )}
            {filters.includes("classNames") ? (
              <TextInput
                icon={<IconBulb size="1rem" stroke={1.5} />}
                radius="xl"
                size="sm"
                value={classNames}
                onChange={(event) => setClassNames(event.currentTarget.value)}
                placeholder="Search by class names (comma separated)"
              />
            ) : (
              <></>
            )}
            {filters.includes("coachNames") ? (
              <TextInput
                icon={<IconUsers size="1rem" stroke={1.5} />}
                radius="xl"
                size="sm"
                value={coachNames}
                onChange={(event) => setCoachNames(event.currentTarget.value)}
                placeholder="Search by coach names (comma separated)"
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
          <SearchStudiosResults query={query} />
        </>
      )}
    </Paper>
  );
}

export default SearchStudios;
