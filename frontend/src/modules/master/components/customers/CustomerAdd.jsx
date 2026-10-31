import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Autocomplete,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import { Alert, Stack } from "@mui/material";
import { AutoComplete, LoadingSpinner } from "../../../../ui-controls";
import {
  emailRegEx,
  states,
  validatePhoneNumber,
} from "../../../../services/utils";

import ContactPersonList from "../contact-person/ContactPersonList";
import ContactPersonForm from "../contact-person/ContactPersonForm";
import { useDispatch, useSelector } from "react-redux";
import { createCustomer, selectIsLoading } from "./slice/customerSlice";

const initialErrorState = {
  name: {
    invalid: false,
    message: "",
  },
  address: {
    invalid: false,
    message: "",
  },
  telephone: {
    invalid: false,
    message: "",
  },
  email: {
    invalid: false,
    message: "",
  },
  contactPerson: {
    invalid: false,
    message: "",
  },
};

const CustomerAdd = () => {
  const initialState = {
    name: "",
    address: "",
    telephone: "",
    alternateTelephone: "",
    fax: "",
    cstNo: "",
    gstNo: "",
    state: "",
    city: "",
    email: "",
    vendorCode: "",
    vatNo: "",
    eccNo: "",
    contactPerson: [],
    showHamali:1
  };
  const [customer, setCustomer] = useState(initialState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const [editContact, setEditContact] = useState(null);
  const isLoading = useSelector(selectIsLoading);
  const { places } = useSelector(({ customer }) => customer);

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const goToCustomersList = useCallback(() => {
    navigate("/master/customers");
  }, [navigate]);

  const resetButtonHandler = () => {
    setCustomer({ ...initialState });
    setHttpError("");
    setFormErrors(initialErrorState);
  };

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setCustomer((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };
  const inputChangeHandlerCheckbox= (event) => {
    const { name, value, type, checked } = event.target;
  
    setCustomer((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 0 : 1) : value, // Set 0 if checked, else 1
    }));
  };
  
  const autocompleteChangeListener = (value, key) => {
    setCustomer((currState) => {
      return {
        ...currState,
        [key]: value,
      };
    });
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(customer)) {
      const cityId = customer.city?.name;
      const updatedCustomer = {
        ...customer,
        city: cityId,
      };
      dispatch(createCustomer(updatedCustomer))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message && message.includes("Added Successfully")) {
            setHttpError("");
            setCustomer(initialState);
            goToCustomersList();
          } else {
            setHttpError(message || "An unknown error occurred");
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };

  const backButtonHandler = () => {
    goToCustomersList();
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };
    if (!formData.name?.trim?.()) {
      errors.name = { invalid: true, message: "Customer name is required" };
    }
    if (!formData.address?.trim?.()) {
      errors.address = { invalid: true, message: "Address is required" };
    }
    // if (
    //   formData.telephone?.trim?.() !== "" &&
    //   !mobileNoRegEx.test(formData.telephone)
    // ) {
    //   errors.telephone = {
    //     invalid: true,
    //     message: "Phone number should be 10 digits number",
    //   };
    // }
    if (formData.email !== "" && !emailRegEx.test(formData.email)) {
      errors.email = { invalid: true, message: "Email is invalid" };
    }
    // if (!formData.contactPerson?.length) {
    //   errors.contactPerson = {
    //     invalid: true,
    //     message: "At least one contact person is required",
    //   };
    // }
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

  const handleOnContactPersonAdd = (receivedPerson) => {
    if (!editContact) {
      setCustomer((currentState) => {
        const currentCustomer = { ...currentState };
        currentCustomer.contactPerson?.push?.(receivedPerson);
        return currentCustomer;
      });
    } else {
      const editedContact = { ...editContact };
      const updatedReceivedPerson = { ...receivedPerson };
      delete updatedReceivedPerson.index;
      setCustomer((currentState) => {
        const currentCustomer = { ...currentState };
        const currentCustomerContacts = [...currentState.contactPerson];
        currentCustomerContacts[editedContact.index] = {
          ...updatedReceivedPerson,
        };
        currentCustomer.contactPerson = [...currentCustomerContacts];
        return currentCustomer;
      });
      setEditContact(null);
    }
  };

  const handleTriggerEdit = (index) => {
    setEditContact({ ...customer.contactPerson[index], index: index });
  };

  const handleTriggerDelete = (contactIndex) => {
    setCustomer((currentState) => {
      const currentCustomer = { ...currentState };
      currentCustomer.contactPerson = currentCustomer.contactPerson?.filter?.(
        (contact, index) => index !== contactIndex
      );
      return currentCustomer;
    });
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}

      <h1 className="pageHead">Add a customer</h1>
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

      {!isLoading && (
        <div>
          <form action="" id="customerForm" onSubmit={submitHandler}>
            <div className="inner-wrap">
              <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
                <div className="grid grid-6-col">
                  <div className="grid-item">
                    <FormControl fullWidth error={formErrors.name.invalid}>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Name"
                        value={customer.name}
                        error={formErrors.name.invalid}
                        onChange={inputChangeHandler}
                        name="name"
                        id="name"
                      />
                      {formErrors.name.invalid && (
                        <FormHelperText>
                          {formErrors.name.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </div>
                  <div className="grid-item">
                    <FormControl fullWidth error={formErrors.address.invalid}>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Correspondence address"
                        value={customer.address}
                        onChange={inputChangeHandler}
                        error={formErrors.address.invalid}
                        name="address"
                        id="address"
                      />
                      {formErrors.address.invalid && (
                        <FormHelperText>
                          {formErrors.address.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </div>
                  <div className="grid-item">
                    <FormControl fullWidth error={formErrors.telephone.invalid}>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Telephone"
                        value={customer.telephone}
                        error={formErrors.telephone.invalid}
                        onChange={inputChangeHandler}
                        onInput={validatePhoneNumber}
                        name="telephone"
                        id="telephone"
                      />
                      {formErrors.telephone.invalid && (
                        <FormHelperText>
                          {formErrors.telephone.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </div>
                  {/* <div className="grid-item">
                    <FormControl fullWidth>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Alternate Telephone"
                        value={customer.alternateTelephone}
                        onChange={inputChangeHandler}
                        onInput={validatePhoneNumber}
                        name="alternateTelephone"
                        id="alternateTelephone"
                      />
                    </FormControl>
                  </div> */}
                  {/* <div className="grid-item">
                    <FormControl fullWidth>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Fax No"
                        value={customer.fax}
                        onChange={inputChangeHandler}
                        name="fax"
                        id="fax"
                      />
                    </FormControl>
                  </div> */}
                  {/* <div className="grid-item">
                    <FormControl fullWidth>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="CST No."
                        value={customer.cstNo}
                        onChange={inputChangeHandler}
                        name="cstNo"
                        id="cstNo"
                      />
                    </FormControl>
                  </div> */}
                  <div className="grid-item">
                    <FormControl fullWidth>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="GST No."
                        value={customer.gstNo}
                        onChange={inputChangeHandler}
                        name="gstNo"
                        id="gstNo"
                      />
                    </FormControl>
                  </div>
                  <div className="grid-item">
                    <FormControl fullWidth size="small">
                      <Autocomplete
                        autoSelect
                        disablePortal
                        size="small"
                        name="state"
                        options={states}
                        value={customer.state || null}
                        onChange={(e, value) =>
                          autocompleteChangeListener(value, "state")
                        }
                        getOptionLabel={(option) => option}
                        openOnFocus
                        renderInput={(params) => (
                          <TextField {...params} label="State" fullWidth />
                        )}
                      />
                    </FormControl>
                  </div>
                  <div className="grid-item">
                    <FormControl fullWidth>
                      <Autocomplete
                        id="Customer"
                        options={
                          places
                            ? places.map((place) => ({
                                name: place.place_name,
                                id: place.place_id,
                              }))
                            : []
                        }
                        getOptionLabel={(option) => option.name}
                        value={
                          customer.city
                            ? { name: customer.city.name, id: customer.city.id }
                            : null
                        }
                        onChange={(e, value) => {
                          // Store both name and id in customer.city
                          autocompleteChangeListener(
                            value ? { name: value.name, id: value.id } : null,
                            "city"
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            name="city"
                            variant="outlined"
                            label="City"
                            size="small"
                            fullWidth
                          />
                        )}
                      />
                    </FormControl>
                  </div>

                  <div className="grid-item">
                    <FormControl fullWidth error={formErrors.email.invalid}>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Email"
                        value={customer.email}
                        error={formErrors.email.invalid}
                        onChange={inputChangeHandler}
                        name="email"
                        id="email"
                      />
                      {formErrors.email.invalid && (
                        <FormHelperText>
                          {formErrors.email.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </div>
                  <div className="grid-item">
                    <FormControlLabel
                      control={
                        <Checkbox
                        checked={customer.showHamali === 0}
                          onChange={inputChangeHandlerCheckbox}
                          name="showHamali"
                          color="primary"
                        />
                      }
                      label="Show Hamali"
                    />
                  </div>
                  {/* <div className="grid-item">
                    <FormControl fullWidth>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="VAT No"
                        value={customer.vatNo}
                        onChange={inputChangeHandler}
                        name="vatNo"
                        id="vatNo"
                      />
                    </FormControl>
                  </div> */}
                  {/* <div className="grid-item">
                    <FormControl fullWidth>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="ECC No"
                        value={customer.eccNo}
                        onChange={inputChangeHandler}
                        name="eccNo"
                        id="eccNo"
                      />
                    </FormControl>
                  </div> */}
                </div>
              </Paper>
            </div>
          </form>

          <div className="bl_contact_person">
            <div className="bl_form">
              <ContactPersonForm
                onContactPersonAdd={handleOnContactPersonAdd}
                editContact={editContact}
              />
            </div>
            <div className="bl_content">
              {formErrors.contactPerson.invalid && (
                <Stack
                  sx={{
                    width: "100%",
                    margin: "0 0 30px 0",
                    border: "1px solid red",
                    borderRadius: "4px",
                  }}
                  spacing={2}
                >
                  <Alert severity="error">
                    {formErrors.contactPerson.message}
                  </Alert>
                </Stack>
              )}
              <ContactPersonList
                contactPersons={customer.contactPerson}
                handleTriggerEdit={handleTriggerEdit}
                handleTriggerDelete={handleTriggerDelete}
              />
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
              form="customerForm"
              className="ml6"
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerAdd;
