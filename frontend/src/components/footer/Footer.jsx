import React from "react";
import Divider from "@mui/material/Divider";
import classes from "./Footer.module.css";
const Footer = () => {
  return (
    <footer className={classes.mainFooter}>
      <Divider />
      <p>
        {new Date().getFullYear()} &copy;{" "}
        <strong>
          <a href="https://www.vspace.co.in/" target="_blank" rel="noreferrer">
            Vspace Software
          </a>
        </strong>{" "}
        - <em>Save your time, choose the best</em>
      </p>
    </footer>
  );
};

export default Footer;
