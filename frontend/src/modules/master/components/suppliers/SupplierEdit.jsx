import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Autocomplete,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import { Alert, Stack } from "@mui/material";
import { makeStyles } from "@material-ui/core/styles";
import { LoadingSpinner } from "../../../../ui-controls";
import {
  emailRegEx,
  mobileNoRegEx,
  states,
  validatePhoneNumber,
} from "../../../../services/utils";
import ContactPersonList from "../contact-person/ContactPersonList";
import ContactPersonForm from "../contact-person/ContactPersonForm";
import { useDispatch, useSelector } from "react-redux";
import {
  getSupplier,
  selectIsLoading,
  updateSupplier,
} from "./slice/supplierSlice";

const useStyles = makeStyles(() => ({
  menuPaper: {
    maxHeight: 300,
    maxWidth: 100,
  },
}));

const initialState = {
  name: "",
  type: "",
  address: "",
  state: "",
  city: "",
  phone: "",
  email: "",
  panNo: "",
  vendorCode: "",
  vatNo: "",
  cstNo: "",
  eccNo: "",
  contactPerson: [],
};

const initialErrorState = {
  name: {
    invalid: false,
    message: "",
  },
  address: {
    invalid: false,
    message: "",
  },
  phone: {
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

const SupplierEdit = () => {
  const isLoading = useSelector(selectIsLoading);

  const [supplier, setSupplier] = useState(initialState);
  const [fetchedSupplier, setFetchedSupplier] = useState(initialState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const [editContact, setEditContact] = useState(null);

  const classes = useStyles();

  const location = useLocation();
  const { supplierId } = location.state;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const goToSuppliersList = useCallback(() => {
    navigate("/master/suppliers");
  }, [navigate]);

  useEffect(() => {
    dispatch(getSupplier(supplierId))
      .then(({ payload = {} }) => {
        console.log("Supplier data:", payload);
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          const supplierData = payload.data[0][0]; // Assuming the first array contains the supplier info
          const contactData = payload.data[1]; // Assuming the second array contains the contact info
  
          setSupplier({
            name: supplierData.vehical_owner_name,
            type: supplierData.owner_type,
            address: supplierData.address,
            state: "", // If there's a state field, extract it accordingly
            city: supplierData.city,
            phone: supplierData.telephoneno,
            email: supplierData.owner_emailid,
            panNo: supplierData.panno,
            vendorCode: supplierData.vendor_code,
            vatNo: supplierData.vatnum,
            cstNo: supplierData.cstnum,
            eccNo: supplierData.eccnum,
            contactPerson: contactData.map(contact => ({
              name: contact.person_name || "",
              designation: contact.designation || "",
              email: contact.contact_emailid || "",
              address: contact.contact_address || "",
              phone: contact.faxno || "",
            })) || [],
          });
        }
      })
      .catch((error) => {
        setHttpError(error.message);
        console.error("Error fetching supplier:", error);
      });
  }, [supplierId]);

  const resetButtonHandler = () => {
    setSupplier(fetchedSupplier);
    setHttpError("");
    setFormErrors(initialErrorState);
  };

  const backButtonHandler = () => {
    goToSuppliersList();
  };

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setSupplier((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };
  const autocompleteChangeListener = (value, name) => {
    setSupplier((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };
  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(supplier)) {
        const supplierDataToUpdate = { ...supplier, id: supplierId };
        dispatch(updateSupplier(supplierDataToUpdate))
            .then(({ payload = {} }) => {
                const { message } = payload?.data || {};
                if (message && message.includes("Updated Successfully"))  {
                    setHttpError(message);
                    goToSuppliersList();
                } else {
                    setHttpError("");
                    setSupplier(initialState);
                    goToSuppliersList();
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
      errors.name = { invalid: true, message: "Customer name is required" };
    }
    if (!formData.address?.trim?.()) {
      errors.address = { invalid: true, message: "Address is required" };
    }
    if (
      formData.phone?.trim?.() !== "" &&
      !mobileNoRegEx.test(formData.phone)
    ) {
      errors.phone = {
        invalid: true,
        message: "Phone number should be 10 digits number",
      };
    }
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
      setSupplier((currentState) => {
        const currentSupplier = { ...currentState };
        currentSupplier.contactPerson = [
          ...(currentSupplier.contactPerson || []),
        ];
        currentSupplier.contactPerson?.push?.(receivedPerson);
        return currentSupplier;
      });
    } else {
      const editedContact = { ...editContact };
      const updatedReceivedPerson = { ...receivedPerson };
      delete updatedReceivedPerson.index;
      setSupplier((currentState) => {
        const currentSupplier = { ...currentState };
        const currentSupplierContacts = [...currentState.contactPerson];
        currentSupplierContacts[editedContact.index] = {
          ...updatedReceivedPerson,
        };
        currentSupplier.contactPerson = [...currentSupplierContacts];
        return currentSupplier;
      });
      setEditContact(null);
    }
  };

  const handleTriggerEdit = (index) => {
    setEditContact({ ...supplier.contactPerson[index], index: index });
  };

  const handleTriggerDelete = (contactIndex) => {
    setSupplier((currentState) => {
      const currentSupplier = { ...currentState };
      currentSupplier.contactPerson = currentSupplier.contactPerson?.filter?.(
        (contact, index) => index !== contactIndex
      );
      return currentSupplier;
    });
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <h1 className="pageHead">Edit a supplier</h1>
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

        {!isLoading && (
          <div>
            <form action="" id="supplierForm" onSubmit={submitHandler}>
              <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
                <div className="grid grid-6-col">
                  <div className="grid-item">
                    <FormControl fullWidth error={formErrors.name.invalid}>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Name"
                        value={supplier.name}
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
                    <FormControl fullWidth size="small">
                      <Autocomplete
                        autoSelect
                        disablePortal
                        size="small"
                        name="type"
                        options={["Vehicle", "Petrol", "Tyre"]}
                        value={supplier.type}
                        onChange={(e, value) =>
                          autocompleteChangeListener(value, "type")
                        }
                        getOptionLabel={(option) => option}
                        openOnFocus
                        renderInput={(params) => (
                          <TextField {...params} label="Type" fullWidth />
                        )}
                      />
                    </FormControl>
                  </div>
                  <div className="grid-item">
                    <FormControl fullWidth error={formErrors.address.invalid}>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Address"
                        value={supplier.address}
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
                    <FormControl fullWidth size="small">
                      <Autocomplete
                        autoSelect
                        disablePortal
                        size="small"
                        name="state"
                        options={states}
                        value={supplier.state}
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
                      <TextField
                        size="small"
                        variant="outlined"
                        label="City"
                        value={supplier.city}
                        onChange={inputChangeHandler}
                        name="city"
                        id="city"
                      />
                    </FormControl>
                  </div>

                  <div className="grid-item">
                    <FormControl fullWidth error={formErrors.phone.invalid}>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Telephone"
                        value={supplier.phone}
                        error={formErrors.phone.invalid}
                        onChange={inputChangeHandler}
                        onInput={validatePhoneNumber}
                        name="phone"
                        id="phone"
                      />
                      {formErrors.phone.invalid && (
                        <FormHelperText>
                          {formErrors.phone.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </div>
                  <div className="grid-item">
                    <FormControl fullWidth error={formErrors.email.invalid}>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Email"
                        value={supplier.email}
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
                    <FormControl fullWidth>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="PAN No"
                        value={supplier.panNo}
                        onChange={inputChangeHandler}
                        name="panNo"
                        id="panNo"
                      />
                    </FormControl>
                  </div>
                  <div className="grid-item">
                    <FormControl fullWidth>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Vendor Code"
                        value={supplier.vendorCode}
                        onChange={inputChangeHandler}
                        name="vendorCode"
                        id="vendorCode"
                      />
                    </FormControl>
                  </div>
                  <div className="grid-item">
                    <FormControl fullWidth>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="VAT No"
                        value={supplier.vatNo}
                        onChange={inputChangeHandler}
                        name="vatNo"
                        id="vatNo"
                      />
                    </FormControl>
                  </div>
                  <div className="grid-item">
                    <FormControl fullWidth>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="CST No."
                        value={supplier.cstNo}
                        onChange={inputChangeHandler}
                        name="cstNo"
                        id="cstNo"
                      />
                    </FormControl>
                  </div>
                  <div className="grid-item">
                    <FormControl fullWidth>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="ECC No"
                        value={supplier.eccNo}
                        onChange={inputChangeHandler}
                        name="eccNo"
                        id="eccNo"
                      />
                    </FormControl>
                  </div>
                </div>
              </Paper>
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
                  contactPersons={supplier.contactPerson}
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
                form="supplierForm"
                className="ml6"
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SupplierEdit;
