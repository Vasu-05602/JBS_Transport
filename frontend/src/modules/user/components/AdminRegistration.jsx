import React, { useState, useMemo } from "react";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Paper,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Stack } from "@mui/material";
import LoadingSpinner from "@ui-controls/LoadingSpinner";
import { createUser, selectIsLoading } from "../slice/userSlice";

const AdminRegistration = () => {
  const dispatch = useDispatch();
  const initialState = useMemo(() => {
    return {
      type: "Superadmin",
      username: "",
      password: "",
    };
  }, []);

  const initialErrorState = {
    username: {
      invalid: false,
      message: "",
    },
    password: {
      invalid: false,
      message: "",
    },
  };
  const isLoading = useSelector(selectIsLoading);
  const [loginData, setLoginData] = useState(initialState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };
    if (!formData.username || !formData.username?.trim?.()) {
      errors.username = { invalid: true, message: "Username is required" };
    }
    if (!formData.password || !formData.password?.trim?.()) {
      errors.password = { invalid: true, message: "Password is required" };
    } else if (formData.password?.trim?.()?.length < 5) {
      errors.password = {
        invalid: true,
        message: "Password length should be 5 or more characters",
      };
    }

    let validationErrors = false;
    for (const key in errors) {
      if (errors[key].invalid === true) {
        validationErrors = true;
      }
    }
    if (validationErrors) {
      setFormErrors(errors);
    }
    return validationErrors;
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(loginData)) {
      dispatch(createUser(loginData))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            setLoginData(initialState);
          }
        })
        .catch(() => {
          setHttpError(
            "Something went wrong! Please try later or contact Administrator."
          );
        });
    }
  };

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setLoginData((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}

      <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
        <h2 className="pageHead">Admin registration</h2>
        {httpError !== "" && (
          <Stack
            sx={{
              width: "100%",
              margin: "0 0 30px 0",
              border: "1px solid red",
              borderRadius: "4px",
            }}
            spacing={2}
          >
            <Alert severity="error">{httpError}</Alert>
          </Stack>
        )}

        <form onSubmit={submitHandler}>
          <div className="grid grid-1-col">
            <div className="grid-item">
              <FormControl fullWidth error={formErrors.username.invalid}>
                <TextField
                  variant="outlined"
                  label="Username"
                  error={formErrors.username.invalid}
                  value={loginData.username}
                  onChange={inputChangeHandler}
                  name="username"
                  id="username"
                  inputProps={{ maxLength: 50 }}
                />
                {formErrors.username.invalid && (
                  <FormHelperText>{formErrors.username.message}</FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth error={formErrors.username.invalid}>
                <TextField
                  variant="outlined"
                  label="Password"
                  type="password"
                  error={formErrors.password.invalid}
                  value={loginData.password}
                  onChange={inputChangeHandler}
                  name="password"
                  id="password"
                  inputProps={{ maxLength: 20 }}
                />
                {formErrors.password.invalid && (
                  <FormHelperText>{formErrors.password.message}</FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grig-item right">
              <Button
                variant="contained"
                size="medium"
                type="submit"
                color="primary"
                className="ml6"
              >
                Submit
              </Button>
            </div>
          </div>
        </form>
      </Paper>
    </>
  );
};

export default AdminRegistration;
