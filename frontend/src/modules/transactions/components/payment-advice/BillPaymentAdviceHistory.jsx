import React, { useEffect, useMemo, useState } from "react";
import {
  DataGrid,
  GridToolbarContainer,
  useGridApiRef,
} from "@mui/x-data-grid";
import { getFormattedDate } from "../../../../services/utils";
import { debounce, InputAdornment, TextField } from "@mui/material";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { useDispatch, useSelector } from "react-redux";
import { setSearch } from "./slice/paymentAdviceSlice";
import { LoadingSpinner } from "../../../../ui-controls";

const BillPaymentAdviceHistory = ({ supplierBills }) => {
  const columns = [
    { field: "_id", headerName: "Id" },
    {
      field: "invoiceNo",
      headerName: "Invoice no.",
      flex: 1,
    },
    {
      field: "date",
      headerName: "Date",
      flex: 1,
    },
    {
      field: "amount",
      headerName: "Amount",
      flex: 1,
      type: "number",
      renderCell: (params) => {
        return params.row.amount ? (
          <strong>₹ {params.row.amount}</strong>
        ) : null;
      },
    },
    {
      field: "paid",
      headerName: "Paid",
      flex: 1,
      type: "number",
      renderCell: (params) => {
        return params.row.paid ? <strong>₹ {params.row.paid}</strong> : null;
      },
    },
    {
      field: "payMode",
      headerName: "Payment mode",
      flex: 1,
    },
    {
      field: "chequeNo",
      headerName: "Cheque no",
      flex: 1,
    },
    {
      field: "chequeDate",
      headerName: "Cheque date",
      flex: 1,
    },
    {
      field: "bank",
      headerName: "Bank",
      flex: 1,
    },
    {
      field: "accountNo",
      headerName: "Account no",
      flex: 1,
    },
    {
      field: "transactionNo",
      headerName: "Transaction no",
      flex: 1,
    },
    {
      field: "transactionDate",
      headerName: "Transaction date",
      flex: 1,
    },
  ];
  const [isloading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const apiRef = useGridApiRef();
  const { search } = useSelector(({ paymentadvice }) => paymentadvice);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const updateSearchValue = useMemo(() => {
    return debounce((newValue) => {
      apiRef.current.setQuickFilterValues(
        newValue.split?.(" ")?.filter?.((word) => word !== "")
      );
    }, 500);
  }, [apiRef]);

  useEffect(() => {
    if (search && paymentHistory?.length) {
      setLoading(true);
      updateSearchValue(search);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [paymentHistory]);

  const onSearchChange = (e) => {
    updateSearchValue(e.target.value);
    dispatch(setSearch(e.target.value));
  };
  useEffect(() => {
    if (supplierBills?.length) {
      const historyList = [];
      let indexes = 0;
      supplierBills?.forEach?.((bill, index) => {
        indexes = indexes + 1;
        historyList?.push?.({
          // _id: "payment_" + 0,
          _id: indexes,
          date: bill.createdAt,
          invoiceNo: bill.invoiceNo,
          amount: bill.amount,

          //   hire: ls.hire,
          //   advance: ls.advance,
          //   hamali: ls.hamali,
          //   commission: ls.commission,
          //   stacking: ls.stacking,
          //   totalHire: ls.hire + ls.hamali - ls.commission - ls.stacking,
        });
        if (bill.payments?.length) {
          bill.payments?.forEach?.((payment, idx) => {
            indexes = indexes + 1;
            const history = {};
            // history._id = "payment_" + (index + 1);
            history._id = indexes;
            history.date = getFormattedDate(new Date(payment.date));
            history.paid = payment.paid?.toFixed?.(2);
            history.amount = payment.amount?.toFixed?.(2);
            history.payMode = payment.payMode;
            history.chequeNo = payment.chequeNo ? payment.chequeNo : "-";
            history.chequeDate = payment.chequeDate
              ? getFormattedDate(payment.chequeDate)
              : "-";
            history.bank = payment.jsmBank ? payment.jsmBank : "-";
            history.accountNo = payment.jsmAccountNo
              ? payment.jsmAccountNo
              : "-";
            history.transactionNo = payment.transactionNo
              ? payment.transactionNo
              : "-";
            history.transactionDate = payment.transactionDate
              ? getFormattedDate(payment.transactionDate)
              : "-";
            historyList?.push?.(history);
          });
        }
      });
      setPaymentHistory(historyList);
    } else {
      setPaymentHistory([]);
    }
  }, [supplierBills]);

  return (
    <>
      <h2 className="mb10">Payment history</h2>
      {isloading ? <LoadingSpinner /> : false}
      <DataGrid
        apiRef={apiRef}
        sx={{ backgroundColor: "primary.contrastText" }}
        autoHeight
        density="standard"
        getRowId={(row) => row._id}
        rows={paymentHistory}
        columns={columns}
        initialState={{
          ...columns,
          columns: {
            columnVisibilityModel: {
              _id: false,
            },
          },
        }}
        components={{
          Toolbar: () => (
            <GridToolbarContainer
              sx={{
                gap: "6px",
                mb: "10px",
                justifyContent: "end",
                border: "none",
              }}
            >
              <TextField
                variant="standard"
                placeholder="Search..."
                autoFocus={!!search}
                onChange={onSearchChange}
                value={search}
                style={{ width: "300px" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined />
                    </InputAdornment>
                  ),
                }}
              />
            </GridToolbarContainer>
          ),
        }}
        pageSize={10}
        rowsPerPageOptions={[10]}
        disableSelectionOnClick
      />
    </>
  );
};

export default BillPaymentAdviceHistory;
