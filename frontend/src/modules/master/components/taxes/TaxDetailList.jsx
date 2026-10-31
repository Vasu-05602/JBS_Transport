import React, { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import classes from "./TaxDetailList.module.css";

import { getFormattedDate } from "../../../../services/utils";

const TaxDetailList = ({
  taxDetails,
  handleTriggerEdit,
  handleTriggerDelete,
}) => {
  const [expanded, setExpanded] = useState("panel0");
console.log('taxDetails',taxDetails)
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
    taxDetails && taxDetails?.length > 0 ? (
      taxDetails?.map?.((detail, index) => {
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
                Tax detail {index + 1}
              </Typography>
              <Typography>{detail.type}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <div className={classes.accordion_content}>
                <p className={classes.label}>Tax type:</p>
                <p className={classes.content}>{detail.taxType}</p>
              </div>
              <div className={classes.accordion_content}>
                <p className={classes.label}>Amount:</p>
                <p className={classes.content}>{detail.amount}</p>
              </div>
              <div className={classes.accordion_content}>
                <p className={classes.label}>State date:</p>
                <p className={classes.content}>
                  {getFormattedDate(detail.startDate)}
                </p>
              </div>
              <div className={classes.accordion_content}>
                <p className={classes.label}>End date:</p>
                <p className={classes.content}>
                  {getFormattedDate(detail.endDate)}
                </p>
              </div>
              <div className={classes.accordion_content}>
                <p className={classes.label}>Description:</p>
                <p className={classes.content}>{detail.description}</p>
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
        No tax details added
      </Typography>
    );

  return content;
};

export default TaxDetailList;
