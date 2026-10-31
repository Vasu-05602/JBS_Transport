import React, { useEffect, useMemo, useState } from "react";
import {
  DataGrid,
  GridToolbarContainer,
  useGridApiRef,
} from "@mui/x-data-grid";
import {
  IconButton,
  Alert,
  Stack,
  TextField,
  InputAdornment,
  debounce,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EmailIcon from "@mui/icons-material/Email";
import DownloadIcon from "@mui/icons-material/Download";
import {
  base64ToObjectURL,
  downloadFile,
  getFormattedDate,
  getFormattedLSNumber,
  pad,
} from "../../../../services/utils";
import { LoadingSpinner, SendEmail } from "../../../../ui-controls";
import { useDispatch, useSelector } from "react-redux";
import {
  downloadPaymentCollection,
  selectIsLoading,
  setSearch,
} from "./slice/paymentCollectionSlice";
import SearchOutlined from "@mui/icons-material/SearchOutlined";

const PaymentCollectionHistory = ({ bills }) => {
  const columns = [
    { field: "_id", headerName: "Id" },
    { field: "billNo", headerName: "Bill no.", flex: 1 },
    { field: "billDate", headerName: "Bill date", flex: 1 },
    {
      field: "billAmount",
      headerName: "Total bill amount",
      type: "number",
      flex: 1,
    },
    {
      field: "receivedAmout",
      headerName: "Receiving amount",
      type: "number",
      flex: 1,
    },
    { field: "payMode", headerName: "Payment mode", flex: 1 },
    { field: "receivingDate", headerName: "Receiving date", flex: 1 },
    {
      field: "actions",
      headerName: "Action",
      sortable: false,
      minWidth: 180,
      renderCell: (params) => {
        const triggerView = (e) => {
          e.stopPropagation();
          const bill = bills?.find?.((bill) => {
            return bill._id === params.row.bill_id;
          });
          const paymentIndex = bill.paymentCollection?.findIndex?.(
            (pay) => pay._id === params.row._id
          );
          triggerViewPayment({
            ...params.row,
            download: false,
            index: paymentIndex + 1,
          });
        };

        const triggerDownload = (e) => {
          e.stopPropagation();
          const bill = bills?.find?.((bill) => {
            return bill._id === params.row.bill_id;
          });
          const paymentIndex = bill.paymentCollection?.findIndex?.(
            (pay) => pay._id === params.row._id
          );
          triggerViewPayment({
            ...params.row,
            download: true,
            index: paymentIndex + 1,
          });
        };

        const triggerEmail = (e) => {
          e.stopPropagation();
          setIsOpenEmail(true);
          setSelectedVoucher({ ...params.row });
        };

        return (
          <>
            <IconButton size="small" onClick={triggerDownload} color="primary">
              <DownloadIcon />
            </IconButton>
            <IconButton size="small" onClick={triggerView} color="primary">
              <VisibilityIcon />
            </IconButton>
            <IconButton size="small" onClick={triggerEmail} color="primary">
              <EmailIcon />
            </IconButton>
          </>
        );
      },
    },
  ];
  const { search } = useSelector(({ paymentcollection }) => paymentcollection);

  const apiRef = useGridApiRef();
  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);
  const [updatedBills, setUpdatedBills] = useState([]);
  const [paymentCollection, setPaymentCollection] = useState(null);
  const [httpError, setHttpError] = useState("");
  const [isOpenEmail, setIsOpenEmail] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [isloading, setLoading] = useState(false);

  useEffect(() => {
    setUpdatedBills(() => {
      return getUpdatedBills(bills);
    });
  }, [bills]);

  const triggerViewPayment = (payment) => {
    setPaymentCollection(payment);
  };

  const updateSearchValue = useMemo(() => {
    return debounce((newValue) => {
      apiRef.current.setQuickFilterValues(
        newValue.split?.(" ")?.filter?.((word) => word !== "")
      );
    }, 500);
  }, [apiRef]);

  useEffect(() => {
    if (search && updatedBills?.length) {
      setLoading(true);
      updateSearchValue(search);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [updatedBills]);

  const onSearchChange = (e) => {
    updateSearchValue(e.target.value);
    dispatch(setSearch(e.target.value));
  };

  useEffect(() => {
    if (paymentCollection) {
      dispatch(
        downloadPaymentCollection({
          billId: paymentCollection.bill_id,
          collectionId: paymentCollection._id,
          email: "",
        })
      )
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            if (payload?.data.file) {
              const name = `${getFormattedLSNumber(
                paymentCollection.billNo
              )}_${pad(paymentCollection.index, 3)}.pdf`;
              const fileURL = base64ToObjectURL(payload?.data.file);
              if (paymentCollection.download) {
                downloadFile(fileURL, name);
              } else {
                window.open(fileURL, "_blank");
              }
            }
            setPaymentCollection(null);
          }
        })
        .catch(() => {
          setHttpError(
            "Something went wrong! Please try later or contact Administrator."
          );
        });
    }
  }, [paymentCollection]);

  useEffect(() => {
    if (sendEmail && emailAddress && selectedVoucher) {
      setIsOpenEmail(false);
      dispatch(
        downloadPaymentCollection({
          billId: selectedVoucher.bill_id,
          collectionId: selectedVoucher._id,
          email: emailAddress,
        })
      )
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          }
          setSendEmail(false);
          setSelectedVoucher(null);
        })
        .catch((error) => {
          setHttpError(error.message);
          setSelectedVoucher(null);
        });
    }
  }, [sendEmail, emailAddress, selectedVoucher]);

  const getUpdatedBills = (bills) => {
    const updatedBills = [];
    if (bills?.length) {
      bills?.forEach?.((bill) => {
        if (bill.paymentCollection?.length) {
          bill.paymentCollection?.forEach?.((collection) => {
            const history = {};
            history._id = collection._id;
            history.bill_id = bill._id;
            history.billNo = getFormattedLSNumber(bill.billNo);
            history.billDate = getFormattedDate(bill.date);
            history.billAmount = bill.total?.toFixed?.(2);
            history.receivingDate = getFormattedDate(collection.receivingDate);
            history.receivedAmout = collection.receive?.toFixed?.(2);
            history.payMode = collection.payMode;
            updatedBills?.push?.(history);
          });
        }
      });
    }
    return updatedBills;
  };

  const handleSendEmail = (email) => {
    setSendEmail(true);
    setEmailAddress(email);
  };
  return (
    <>
      {(isLoading || isloading) && <LoadingSpinner />}

      <h2 className="mb20">Collection history</h2>

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
      <DataGrid
        apiRef={apiRef}
        sx={{ backgroundColor: "primary.contrastText" }}
        autoHeight
        density="standard"
        getRowId={(row) => row._id}
        rows={updatedBills}
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
      <SendEmail
        isOpen={isOpenEmail}
        setIsOpen={setIsOpenEmail}
        handleEmailClose={() => {
          setIsOpenEmail(false);
        }}
        handleSendEmail={(email) => handleSendEmail(email)}
        contentBody=""
      />
    </>
  );
};

export default PaymentCollectionHistory;
