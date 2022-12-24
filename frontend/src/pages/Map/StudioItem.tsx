import { Badge, Button, Card, Group, Text, Title } from "@mantine/core";
import { IconArrowRampRight } from "@tabler/icons";
import React from "react";
import { Link } from "react-router-dom";

function StudioItem({
  studio,
  curFeature,
  setCurFeature,
}: {
  studio: GeoJSON.Feature;
  curFeature: GeoJSON.Feature | null;
  setCurFeature: (feature: GeoJSON.Feature | null) => void;
}) {
  return (
    <Card
      bg="transparent"
      p="xs"
      onClick={() => setCurFeature(studio)}
      withBorder={curFeature === studio}
      radius="lg"
    >
      <Group position="apart" mb={0}>
        <Title order={4} color={curFeature === studio ? "white" : ""}>
          {studio.properties?.name}
        </Title>
        {true ? (
          <Badge color="dark.2" variant="outline" sx={{ border: "none" }}>
            {studio.properties?.distance} km
          </Badge>
        ) : (
          ""
        )}
      </Group>
      <Text size="sm" color="dimmed">
        {studio.properties?.address}
      </Text>
      <Group position="left" mb={0} mt={5} spacing={5}>
        <Button
          component={Link}
          to={`/studio/${studio.properties?.id}`}
          radius="xl"
          size="xs"
          variant="light"
          compact
        >
          Details
        </Button>
        <Button
          component="a"
          href={studio.properties?.directions}
          target="_blank"
          radius="xl"
          size="xs"
          variant="light"
          rightIcon={<IconArrowRampRight size={12} />}
          compact
        >
          Directions
        </Button>
      </Group>
    </Card>
  );
}

export default StudioItem;
