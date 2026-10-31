import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Paper } from "@mui/material";
import { Alert, Stack } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { LoadingSpinner } from "../../../../ui-controls";
import { getFormattedDate } from "../../../../services/utils";
import { useDispatch, useSelector } from "react-redux";
import { getSupplier, selectIsLoading } from "./slice/paymentAdviceSlice";

const SupplierBillView = () => {
  const location = useLocation();
  const isLoading = useSelector(selectIsLoading);

  const bill = location.state;
  const [supplierBill, setSupplierBill] = useState(bill);
  const [supplier, setSupplier] = useState(null);
  const [httpError, setHttpError] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    if (supplierBill.supplier) {
      dispatch(getSupplier(supplierBill.supplier))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            setSupplierBill((currState) => {
              return {
                ...currState,
                supplierDetails: payload?.data,
              };
            });
            setSupplier(payload?.data);
          }
        })
        .catch((e) => {
          setHttpError(e.message);
        });
    }
  }, [supplierBill.supplier]);

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <h1 className="pageHead">Pay supplier bill</h1>
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

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Supplier</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Invoice no</TableCell>
              <TableCell>Supply content</TableCell>
              <TableCell align="right">Bill amount</TableCell>
              <TableCell align="right">Paid</TableCell>
              <TableCell align="right">Balance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{supplierBill.supplierDetails?.name}</TableCell>
              <TableCell>{getFormattedDate(supplierBill.date)}</TableCell>
              <TableCell>{supplierBill.invoiceNo}</TableCell>
              <TableCell>{supplierBill.supplyContent}</TableCell>
              <TableCell align="right">
                ₹ {supplierBill.amount?.toFixed?.(2)}
              </TableCell>
              <TableCell align="right">
                ₹ {supplierBill.paid?.toFixed?.(2)}
              </TableCell>
              <TableCell align="right">
                ₹ {supplierBill.balance?.toFixed?.(2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
        <div className="grid grid-8-col">
          <div className="grid-item">Add payment</div>
        </div>
      </Paper>

      <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
        <h2>Payment history</h2>
        {supplierBill.payments?.length > 0 && (
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Invoice no</TableCell>
                  <TableCell>Supply content</TableCell>
                  <TableCell align="right">Bill amount</TableCell>
                  <TableCell align="right">Paid</TableCell>
                  <TableCell align="right">Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {supplierBill.payments?.map?.((row) => (
                  <TableRow
                    key={row.date}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {getFormattedDate(row.date)}
                    </TableCell>
                    <TableCell align="right">{row.paid}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {supplierBill.payments?.length === 0 && (
          <p style={{ marginTop: "20px" }}>No payment history for this bill</p>
        )}
      </Paper>
    </>
  );
};

export default SupplierBillView;
