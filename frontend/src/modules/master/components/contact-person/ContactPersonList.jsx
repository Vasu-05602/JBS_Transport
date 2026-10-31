import React, { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import classes from "./ContactPersonList.module.css";

const ContactPersonList = ({
  contactPersons,
  handleTriggerEdit,
  handleTriggerDelete,
}) => {
  const [expanded, setExpanded] = useState("panel0");

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const triggerEdit = (index) => {
    handleTriggerEdit(index);
  };
  const triggerDelete = (index) => {
    handleTriggerDelete(index);
  };

  let content =
    contactPersons && contactPersons?.length > 0 ? (
      contactPersons?.map?.((contact, index) => {
        return (
          <Accordion
            key={`panel${index}`}
            expanded={expanded === `panel${index}`}
            onChange={handleChange(`panel${index}`)}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel${index}-content`}
              id={`panel${index}-header`}
            >
              <Typography
                sx={{ width: "33%", flexShrink: 0, color: "text.secondary" }}
              >
                Contact person {index + 1}
              </Typography>
              <Typography>{contact.name}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <div className={classes.accordion_content}>
                <p className={classes.label}>Address:</p>
                <p className={classes.content}>{contact.address}</p>
              </div>
              <div className={classes.accordion_content}>
                <p className={classes.label}>Designation:</p>
                <p className={classes.content}>{contact.designation}</p>
              </div>
              <div className={classes.accordion_content}>
                <p className={classes.label}>Email:</p>
                <p className={classes.content}>{contact.email}</p>
              </div>
              <div className={classes.accordion_content}>
                <p className={classes.label}>Phone:</p>
                <p className={classes.content}>{contact.phone}</p>
              </div>
              <div className="right">
                <IconButton
                  size="small"
                  onClick={triggerEdit.bind(null, index)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
                &nbsp;&nbsp;
                <IconButton
                  size="small"
                  onClick={triggerDelete.bind(null, index)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </div>
            </AccordionDetails>
          </Accordion>
        );
      })
    ) : (
      <Typography variant="h7" gutterBottom>
        No contact person added
      </Typography>
    );

  return content;
};

export default ContactPersonList;
