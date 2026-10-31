import React, { useState } from "react";
import { TextField, FormControl, FormHelperText, Button } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { emailRegEx } from "../services/utils";

const initialErrorState = {
  email: {
    invalid: false,
    message: "",
  },
};

const SendEmail = ({ isOpen, setIsOpen, handleSendEmail, contentBody }) => {
  const [email, setEmail] = useState("");
  const [formErrors, setFormErrors] = useState(initialErrorState);

  const validateAndSend = () => {
    setFormErrors(initialErrorState);
    if (!email?.trim?.() || !emailRegEx.test(email)) {
      setFormErrors((currState) => {
        return {
          ...currState,
          email: {
            invalid: true,
            message: "Invalid email",
          },
        };
      });
    } else {
      handleSendEmail(email);
      setEmail("");
    }
  };

  const handleEmailClose = () => {
    setEmail("");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onClose={handleEmailClose}>
      <DialogTitle>Send email</DialogTitle>
      <DialogContent sx={{ width: "400px" }}>
        {contentBody ? (
          <DialogContentText>{contentBody}</DialogContentText>
        ) : null}
        <FormControl fullWidth size="small" error={formErrors.email.invalid}>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Email Address"
            type="email"
            fullWidth
            variant="standard"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={formErrors.email.invalid}
          />
          {formErrors.email.invalid && (
            <FormHelperText>{formErrors.email.message}</FormHelperText>
          )}
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleEmailClose}>Cancel</Button>
        <Button onClick={validateAndSend}>Send</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SendEmail;
