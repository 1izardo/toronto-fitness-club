import { Chip } from "@mantine/core";
import React from "react";

function StudioFilters({
  filters,
  setFilters,
}: {
  filters: string[];
  setFilters: (filters: string[]) => void;
}) {
  return (
    <Chip.Group value={filters} onChange={setFilters} multiple>
      <Chip value="name">Studio Name</Chip>
      <Chip value="amenities">Amenities</Chip>
      <Chip value="classNames">Class Names</Chip>
      <Chip value="coachNames">Coach Names</Chip>
    </Chip.Group>
  );
}

export default StudioFilters;
