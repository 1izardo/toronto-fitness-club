import {
  ActionIcon,
  Center,
  Paper,
  ScrollArea,
  Text,
  TextInput,
} from "@mantine/core";
import { IconArrowRight, IconCurrentLocation, IconSearch } from "@tabler/icons";
import { useState } from "react";
import StudioItem from "./StudioItem";

function MapUI({
  fetchLocation,
  geocode,
  curFeature,
  setCurFeature,
  studios,
}: {
  fetchLocation: () => void;
  geocode: (postalCode: string) => void;
  curFeature: GeoJSON.Feature | null;
  setCurFeature: (feature: GeoJSON.Feature | null) => void;
  studios: GeoJSON.FeatureCollection;
}) {
  const [query, setQuery] = useState("");

  return (
    <div className="map-ui-container">
      <div className="map-input-area">
        <ActionIcon
          size={40}
          radius="xl"
          variant="filled"
          color="primary"
          mt="lg"
          mb="sm"
          onClick={fetchLocation}
          sx={{ boxShadow: "0px 0px 5px 1px rgba(0, 0, 0, 0.5);" }}
        >
          <IconCurrentLocation size={18} stroke={2} />
        </ActionIcon>
        <TextInput
          icon={<IconSearch size={18} stroke={2} />}
          radius="xl"
          m="lg"
          ml="sm"
          mb="sm"
          size="md"
          autoFocus
          rightSection={
            <ActionIcon
              size={32}
              radius="xl"
              color="primary"
              variant="light"
              onClick={() => {
                geocode(query);
              }}
            >
              <IconArrowRight size={18} stroke={2} />
            </ActionIcon>
          }
          placeholder="Search by location"
          autoComplete="off"
          rightSectionWidth={42}
          maw={400}
          w="100%"
          value={query}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              geocode(query);
            }
          }}
          onChange={(event) => setQuery(event.currentTarget.value)}
          sx={(theme) => ({
            borderRadius: theme.radius.xl,
            boxShadow: "0px 0px 5px 1px rgba(0, 0, 0, 0.5);",
          })}
        />
      </div>
      <div className="map-results-area">
        <Paper
          component={ScrollArea}
          maw={400}
          w="100%"
          m="lg"
          mt={0}
          p="sm"
          radius="xl"
          type="auto"
          sx={(theme) => ({
            boxShadow: "0px 0px 5px 1px rgba(0, 0, 0, 0.5)",
            ".mantine-ScrollArea-scrollbar": {
              top: "25px !important",
              bottom: "25px !important",
            },
          })}
        >
          {studios.features.length > 0 ? (
            studios.features.map((studio) => {
              return (
                <StudioItem
                  studio={studio}
                  curFeature={curFeature}
                  setCurFeature={setCurFeature}
                  key={studio.properties?.id}
                />
              );
            })
          ) : (
            <Center>
              <Text c="dimmed">No studios found.</Text>
            </Center>
          )}
        </Paper>
      </div>
    </div>
  );
}

export default MapUI;
