import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  Autocomplete,
} from "@mui/material";
import { Alert, Stack } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { createArticle, selectIsLoading } from "./slice/articleSlice";
import { LoadingSpinner } from "../../../../ui-controls";

const RATE_TYPES = [
  { label: "Kg", value: "Kg" },
  { label: "Case", value: "Case" },
];

const initialArticleState = {
  name: "",
  description: "",
  rateType:null,
};

const initialErrorState = {
  name: {
    invalid: false,
    message: "",
  },
  rateType: {
    invalid: false,
    message: "",
  }
};

const ArticleAdd = () => {
  const [article, setArticle] = useState(initialArticleState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);

  const navigate = useNavigate();

  const goToArticlesList = useCallback(() => {
    navigate("/master/articles");
  }, [navigate]);

  const cancelButtonHandler = () => {
    resetButtonHandler();
    goToArticlesList();
  };

  const resetButtonHandler = () => {
    setArticle(initialArticleState);
    setHttpError("");
    setFormErrors(initialErrorState);
  };

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setArticle((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };


  const handleRateTypeChange = (event, newValue) => {
    setArticle((prevState) => ({
      ...prevState,
      rateType: newValue ? newValue.value : null, 
    }));
  };
  

  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(article)) {
      dispatch(createArticle(article))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || "";
          if (message && message.includes("Added Successfully")) {
            setHttpError("");  
            setArticle(initialArticleState);  
            goToArticlesList();
          } else {
            setHttpError(message || "An unknown error occurred"); 
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };
    if (!formData.name?.trim?.()) {
      errors.name = { invalid: true, message: "Article name is required" };
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

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <h1 className="pageHead">Add an article</h1>
      <div className="inner-wrap">
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
        <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
          <form action="" onSubmit={submitHandler}>
            <div className="grid grid-6-col">
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.name.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Article name"
                    value={article.name}
                    error={formErrors.name.invalid}
                    onChange={inputChangeHandler}
                    name="name"
                    id="name"
                  />
                  {formErrors.name.invalid && (
                    <FormHelperText>{formErrors.name.message}</FormHelperText>
                  )}
                </FormControl>
              </div>


              <div className="grid-item">
            <FormControl
              fullWidth
              size="small"
              error={formErrors.rateType.invalid}
            >
              <Autocomplete
                autoSelect
                size="small"
                name="rateType"
                id="rateType"
                options={RATE_TYPES}
                value={RATE_TYPES.find((type) => type.value === article.rateType) || null} 
                openOnFocus
                onChange={handleRateTypeChange} 
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Rate type"
                    error={formErrors.rateType.invalid}
                    fullWidth
                  />
                )}
              />
              {formErrors.rateType.invalid && (
                <FormHelperText>{formErrors.rateType.message}</FormHelperText>
              )}
            </FormControl>
            </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Article description"
                    value={article.abbreviation}
                    onChange={inputChangeHandler}
                    name="description"
                    id="description"
                  />
                </FormControl>
              </div>
            </div>
            <div className="right">
              <Button
                variant="outlined"
                size="medium"
                onClick={cancelButtonHandler}
              >
                Back
              </Button>
              <Button
                variant="outlined"
                size="medium"
                onClick={resetButtonHandler}
                className="ml6"
              >
                Reset
              </Button>
              <Button
                variant="contained"
                size="medium"
                type="submit"
                color="primary"
                className="ml6"
              >
                Save
              </Button>
            </div>
          </form>
        </Paper>
      </div>
    </>
  );
};

export default ArticleAdd;
