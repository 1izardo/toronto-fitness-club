import { Paper, Loader } from "@mantine/core";
import React from "react";

function LoadingPage() {
  return (
    <Paper
      sx={{
        display: "flex",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <Loader />
    </Paper>
  );
}

export default LoadingPage;
