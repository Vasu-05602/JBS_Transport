import React, { useState, useEffect, memo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import { Button, Divider, FormControl, Grid, TextField } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { getFormattedDate } from "../../../../services/utils";
import { useDispatch } from 'react-redux';
import { getLorryReceiptsForLSdetials } from "./slice/loadingSlipSlice";

const FreightDetails = ({
  loadingSlip,
  setLoadingSlip,
  lorryReceipts,
  setSearchLr,
  filteredLR,
  setFilteredLR,
  lrFilter,
  dateChangeHandler,
}) => {




  const columns = [
    { field: "id", headerName: "Id" },
    {
      field: "index",
      headerName: "Sr. No.",
      width: 70,
    },
    {
      field: "lrNo",
      headerName: "LR no.",
      flex: 1,
      renderCell: ({ value, row }) => {
        return row.deliveryDate ? (
          <span style={{ fontWeight: "bolder", fontStyle: "italic"  }}> {value}</span>
        ) : (
          value
        );
      },
    },
    {
      field: "date",
      headerName: "LR Date",
      flex: 1,
      // renderCell: (params) => {
      //   return params.row.date ? getFormattedDate(params.row.date) : "-";
      // },
    },
    {
      field: "consignorName",
      headerName: "Consignor",
      flex: 1,
    },
    { field: "from", headerName: "From", flex: 1 },
    {
      field: "consigneeName",
      headerName: "Consignee",
      flex: 1,
    },
    { field: "to", headerName: "To", flex: 1 },
    { field: "weight", headerName: "Weight", flex: 1 },
    {
      field: "article",
      headerName: "No. of Articles",
      flex: 1,
      // renderCell: (params) => {
      //   return (
      //     params.row?.transactions?.reduce(
      //       (total, article) => total + (article || 0),
      //       0
      //     ) || 0
      //   );
      // },
    },
    {
      field: "total",
      headerName: "To pay",
      flex: 1,
      type: "number",
      renderCell: (params) => {
        return params.row.payType?.toLowerCase() === "topay" ? (
          <strong>₹ {parseFloat(params.row.total)?.toFixed(2)}</strong>
        ) : (
          "-"
        );
      },
    },
  ];


  const [selectedLR, setSelectedLR] = useState([]);
  const [sortedLR, setSortedLR] = useState([]);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const dispatch = useDispatch();
  useEffect(() => {
    const updatedLorryReceipts = [...(lorryReceipts || [])];
    updatedLorryReceipts?.forEach?.((lr) => {
      let weight = 0;
      lr.transactions?.forEach?.((transaction) => {
        weight += +transaction.weight;
      });
      lr.weight = weight;
      lr.checked = lr?.checked || false;
      lr.show = lr.lrNo.includes?.(search);
    });
    setFilteredLR(updatedLorryReceipts);
  }, [lorryReceipts]);

  const inputChangeHandler = (e, index) => {
    const list = [...filteredLR];
    list[index] = { ...list[index], checked: e.target.checked };
    if (e.target.checked) {
      setSortedLR((prevState) => [...prevState, list[index]]);
    } else {
      setSortedLR((prevState) =>
        prevState.filter(({ id }) => list[index].id !== id)
      );
    }
    setFilteredLR([...list]);
  };

  useEffect(() => {
    setLoadingSlip((currState) => {
      return {
        ...currState,
        lrList: selectedLR?.map?.((lr, index) => ({
          ...lr,
          index: index + 1,
        })),
      };
    });
  }, [selectedLR, setLoadingSlip]);


  useEffect(() => {
    const total = loadingSlip.lrList.reduce((sum, lr) => {
      return lr.payType?.toLowerCase() === "topay" ? sum + (parseFloat(lr.total) || 0) : sum;
    }, 0);
    setTotal(total); 
    setLoadingSlip((prev) => ({
      ...prev,
      totalFreight: total 
    }));
  }, [loadingSlip.lrList]); 
  

  const submitHandler = async (e) => {
    e.preventDefault();
    let _total = 0;
    let list = [...sortedLR];  
    const selectedItems = list.filter((lr) => {
      if (lr.checked || search?.toUpperCase() === lr.lrNo?.toUpperCase()) {
        lr.checked = true;
        _total += lr.payType?.toLowerCase() === "topay" ? lr.total : 0;
      }
      return lr.checked;
    });
    const selectedIds = selectedItems.map((lr) => lr.id).filter(Boolean);
    if (selectedIds.length > 0) {
      try {
        const { payload = {} } = await dispatch(getLorryReceiptsForLSdetials({ selectedIds }));
        const { message } = payload?.data || {};
        if (message) {
          console.error("API error message:", message);
        } else {
          const data = payload?.data; 
          const dataWithIndex = data.map((item, index) => ({
            ...item,
            index: index + 1, 
          }));
          dataWithIndex.forEach((item) => {
            const listItem = list.find(lr => lr.id === item.id);
            if (listItem) {
              listItem.checked = true;
              if (listItem.payType?.toLowerCase() === "topay") {
                _total += parseFloat(listItem.total) || 0; 
              }
            }
          });
          setLoadingSlip((prev) => ({
            ...prev,
            lrList: dataWithIndex, 
            toPay: _total,
          }));
        }
      } catch (error) {
        console.error("Error during API call:", error);
      }
    } else {
      console.warn("No IDs found for selected items.");
    }
  };
  const fetchLrs = (str) => {
    const search = str.trim?.();
    setSearchLr(search);
  };

  const searchChangeHandler = (e) => {
    const search = e.target.value
      ? e.target.value?.trim?.()?.toUpperCase?.()
      : e.target.value;
    setSearch(search);
    // if (search) {
    //   setFilteredLR((currState) => {
    //     const updatedLR = currState;
    //     updatedLR?.forEach?.((lr) => {
    //       lr.show = lr.lrNo?.toUpperCase?.().includes?.(search);
    //     });
    //     return updatedLR;
    //   });
    // } else {
    //   setFilteredLR((currState) => {
    //     const updatedLR = currState;
    //     updatedLR?.forEach?.((lr) => {
    //       lr.show = true;
    //     });
    //     return updatedLR;
    //   });
    // }
    fetchLrs(e.target.value);
  };

  let totalRecord = 0,
    selected = 0;

  const renderItems =
    filteredLR?.length > 0 &&
    filteredLR?.map?.((lr, index) => {
      if (lr.show) {
        totalRecord += 1;
      }
      if (lr.checked && lr.show) {
        selected += 1;
      }
      return lr.show ? (
        <FormControlLabel
          className="groupCheckbox"
          key={lr.id}
          control={
            <Checkbox
              name={lr.id}
              size="small"
              checked={lr.checked || false}
              onChange={(e) => inputChangeHandler(e, index)}
            />
          }
          label={
            <span
              style={{
                fontSize: "0.9em",
                display: "inline-block",
                lineHeight: "1em",
                ...(lr.deliveryDate
                  ? { fontWeight: "bolder", fontStyle: "italic" }
                  : {}),
              }}
            >
              {lr.lrNo}
            </span>
          }
        />
      ) : null;
    });
  return (
    <>
      <form action="" onSubmit={submitHandler} id="lrSelectionForm">
        <Grid container spacing={2}>
          <Grid item xs={2}>
            <h2 className="mb20 text-inline">Lorry receipts</h2>
          </Grid>

          <Grid item xs={3}>
            <TextField
              size="small"
              variant="outlined"
              label="Filter LR"
              value={search || ""}
              fullWidth
              onChange={searchChangeHandler}
              name="search"
              id="search"
            />
          </Grid>
          <Grid item xs={3}>
            <h4 className=" text-inline" style={{ paddingTop: "5px" }}>
              {totalRecord} Out of {selected} selected
            </h4>
          </Grid>
          <Grid item xs={2}>
            <FormControl fullWidth>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="From"
                  inputFormat="DD/MM/YYYY"
                  value={lrFilter.from || null}
                  disableFuture={true}
                  maxDate={lrFilter.to}
                  onChange={dateChangeHandler.bind(null, "from")}
                  inputProps={{
                    readOnly: true,
                  }}
                  renderInput={(params) => (
                    <TextField name="from" size="small" {...params} />
                  )}
                />
              </LocalizationProvider>
            </FormControl>
          </Grid>
          <Grid item xs={2}>
            <FormControl fullWidth>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="To"
                  inputFormat="DD/MM/YYYY"
                  value={lrFilter.to || null}
                  disableFuture={true}
                  minDate={lrFilter.from}
                  onChange={dateChangeHandler.bind(null, "to")}
                  inputProps={{
                    readOnly: true,
                  }}
                  renderInput={(params) => (
                    <TextField name="to" size="small" {...params} />
                  )}
                />
              </LocalizationProvider>
            </FormControl>
          </Grid>
        </Grid>
        <div className="bl_lrCheckboxes">
          <FormGroup className="checkboxGroup">
            {renderItems}
            {filteredLR?.length === 0 && <p>No lorry receipts for challan</p>}
          </FormGroup>
        </div>
        <div className="right">
          <Button
            variant="contained"
            size="medium"
            type="submit"
            color="primary"
            form="lrSelectionForm"
            className="ml6"
          >
            Add
          </Button>
        </div>
      </form>

      <Divider sx={{ margin: "20px 0" }} />
      <div style={{ width: "100%" }}>
        <DataGrid
          sx={{ backgroundColor: "primary.contrastText" }}
          autoHeight
          density="compact"
          getRowId={(row) => row.id}
          rows={loadingSlip.lrList}
          columns={columns}
          initialState={{
            ...columns,
            columns: {
              columnVisibilityModel: {
                id: false,
              },
            },
          }}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
        />
        <div
          style={{ textAlign: "end", paddingTop: "10px", paddingRight: "10px" }}
        >
          <p>
            Total To Pay: <strong> ₹ {total?.toFixed?.(2)}</strong>
          </p>
        </div>
      </div>
    </>
  );
};

export default memo(FreightDetails);
