import { Chip } from "@mantine/core";
import React from "react";

function ClassFilters({
  filters,
  setFilters,
}: {
  filters: string[];
  setFilters: (filters: string[]) => void;
}) {
  return (
    <Chip.Group value={filters} onChange={setFilters} multiple>
      <Chip value="name">Class Name</Chip>
      <Chip value="coach">Coach Name</Chip>
      <Chip value="timeRange">Scheduled Time</Chip>
    </Chip.Group>
  );
}

export default ClassFilters;
