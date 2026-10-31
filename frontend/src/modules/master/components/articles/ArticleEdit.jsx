import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  Autocomplete,
} from "@mui/material";
import { Alert, Stack } from "@mui/material";
import { LoadingSpinner } from "../../../../ui-controls";
import { useDispatch, useSelector } from "react-redux";
import {
  getArticle,
  selectIsLoading,
  updateArticle,
} from "./slice/articleSlice";

const RATE_TYPES = [
  { label: "Fixed", value: "Fixed" },
  { label: "Kg", value: "Kg" },
  { label: "Case", value: "Case" },
];

const initialArticleState = {
  name: "",
  description: "",
  rateType: null,  // Add rateType to the state
};

const initialErrorState = {
  name: {
    invalid: false,
    message: "",
  },
  rateType: {
    invalid: false,
    message: "",
  },
};

const ArticleEdit = () => {
  const [article, setArticle] = useState(initialArticleState);
  const [fetchedArticle, setFetchedArticle] = useState(initialArticleState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const isLoading = useSelector(selectIsLoading);
  const dispatch = useDispatch();

  const location = useLocation();
  const { articleId } = location.state;
  const navigate = useNavigate();

  const goToArticlesList = useCallback(() => {
    navigate("/master/articles");
  }, [navigate]);

  useEffect(() => {
    if (articleId && articleId !== "") {
      dispatch(getArticle(articleId))
        .then(({ payload = {} }) => {
          const { data } = payload || {};
          if (data?.message) {
            setHttpError(data.message);
          } else {
            setHttpError("");
            const articleData = data?.[0] || {}; 
            setArticle({
              name: articleData.articles_name || "",
              description: articleData.description || "",
              rateType: articleData.Unit || null,  // Set rateType from database value (unit column)
            });
            setFetchedArticle({
              name: articleData.articles_name || "",
              description: articleData.description || "",
              rateType: articleData.Unit || null,  // Set fetched rateType value
            });
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  }, [articleId]);

  const backButtonHandler = () => {
    goToArticlesList();
  };

  const resetButtonHandler = () => {
    setArticle(fetchedArticle);
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
    setArticle((prev) => ({
      ...prev,
      rateType: newValue ? newValue.value : null,  // Set the rateType value
    }));
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(article)) {
      dispatch(updateArticle({ ...article, articleId }))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message && message.includes("Updated Successfully")) {
            setHttpError(message);
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
    if (!formData.rateType) {
      errors.rateType = { invalid: true, message: "Rate Type is required" };
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
      <h1 className="pageHead">Edit an article</h1>
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

        {isLoading && <LoadingSpinner />}

        {!isLoading && (
          <form action="" onSubmit={submitHandler}>
            <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
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
                  <FormControl fullWidth error={formErrors.rateType.invalid}>
                    <Autocomplete
                      size="small"
                      options={RATE_TYPES}
                      value={article.rateType ? RATE_TYPES.find(rt => rt.value === article.rateType) : null}
                      onChange={handleRateTypeChange}
                      getOptionLabel={(option) => option.label}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Rate Type"
                          error={formErrors.rateType.invalid}
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
                      value={article.description}
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
                  onClick={backButtonHandler}
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
            </Paper>
          </form>
        )}
      </div>
    </>
  );
};

export default ArticleEdit;
