import React from "react";
import { Backdrop, CircularProgress } from "@mui/material";
const LoadingSpinner = () => {
  return (
    <Backdrop
      open={true}
      sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};

export default LoadingSpinner;
