import React, { useState, useEffect } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import {
  Alert,
  Stack,
  Paper,
  FormControl,
  Autocomplete,
  TextField,
} from "@mui/material";
import { AutoComplete, LoadingSpinner } from "../../../../ui-controls";
import LRPaymentAdvice from "./LRPaymentAdvice";
import SupplierBills from "./SupplierBills";
import { useDispatch, useSelector } from "react-redux";
import {
  getBanks,
  getBranches,
  getPlaces,
  getSuppliersByType,
  selectIsLoading,
} from "./slice/paymentAdviceSlice";

const supplierTypes = ["Vehicle", "Petrol", "Tyre"];

const PaymentAdvice = () => {
  const isLoading = useSelector(selectIsLoading);

  const [tabValue, setTabValue] = useState(0);
  const [places, setPlaces] = useState([]);
  const [selectedSupplierType, setSelectedSupplierType] = useState("Vehicle");
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");

  const [httpError, setHttpError] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    if (httpError) {
      const input = document.getElementById(`alertError`);
      input?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "start",
      });
    }
  }, [httpError]);
  useEffect(() => {
    dispatch(getPlaces())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          setPlaces(payload?.data);
        }
      })
      .catch(() => {
        setHttpError(
          "Something went wrong! Please try later or contact Administrator."
        );
      });
    dispatch(getBranches());
    dispatch(getBanks());
  }, []);

  useEffect(() => {
    if (selectedSupplierType) {
      dispatch(getSuppliersByType(selectedSupplierType))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setSuppliers(payload?.data);
          }
        })
        .catch(() => {
          setHttpError(
            "Something went wrong! Please try later or contact Administrator."
          );
        });
    }
  }, [selectedSupplierType]);

  const handleTabChange = (e, newValue) => {
    setTabValue(newValue);
  };

  const supplierChangeHandler = (e, value) => {
    setSelectedSupplier(value);
    setTabValue(0);
  };

  const supplierTypeChangeHandler = (e, value) => {
    setSelectedSupplierType(value);
    setSelectedSupplier("");
    setTabValue(0);
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}
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
            <Alert id="alertError" severity="error">
              {httpError}
            </Alert>
          </Stack>
        )}

        <div className="page_head">
          <h1 className="pageHead">Payment advice</h1>
        </div>

        <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
          <div className="grid grid-6-col">
            <div className="grid-item">
              <FormControl fullWidth size="small">
                <Autocomplete
                  autoSelect
                  disablePortal
                  size="small"
                  name="branch"
                  options={supplierTypes}
                  value={selectedSupplierType || null}
                  onChange={supplierTypeChangeHandler}
                  getOptionLabel={(supplierTypes) => supplierTypes || ""}
                  openOnFocus
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select supplier type"
                      fullWidth
                    />
                  )}
                />
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth size="small">
                <AutoComplete
                  disablePortal
                  size="small"
                  name="supplier"
                  options={suppliers}
                  value={selectedSupplier || null}
                  onChange={supplierChangeHandler}
                  getOptionLabel={(supplier) => supplier.name || ""}
                  openOnFocus
                  renderOption={(props, option) => (
                    <li {...props} key={option._id}>
                      {option.name}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField {...params} label="Select supplier" fullWidth />
                  )}
                />
              </FormControl>
            </div>
          </div>
        </Paper>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="basic tabs example"
        >
          <Tab label="Lorry receipt freight challan" />
          <Tab label="Supplier's bills" />
        </Tabs>

        {tabValue === 0 ? (
          <LRPaymentAdvice
            suppliers={suppliers}
            selectedSupplier={selectedSupplier?._id}
            selectedSupplierType={selectedSupplierType}
            setSelectedSupplier={setSelectedSupplier}
            places={places}
          />
        ) : null}
        {tabValue === 1 ? (
          <SupplierBills
            suppliers={suppliers}
            selectedSupplier={selectedSupplier?._id}
            selectedSupplierType={selectedSupplierType}
          />
        ) : null}
      </div>
    </>
  );
};

export default PaymentAdvice;
