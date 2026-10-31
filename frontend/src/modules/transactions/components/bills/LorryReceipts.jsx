import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import { Button, Divider, FormControl, TextField } from "@mui/material";
import { getFormattedDate, sortArray } from "../../../../services/utils";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const LorryReceipts = ({
  lorryReceipts,
  setLRForBill,
  bill,
  dateInputChangeHandler,
  setBill,
}) => {

  const getDescription = (lr) => {
    return `${lr.from} to ${lr.to}`;
  };

  const getArticleOrWeight = (lr) => {
    if (lr.transactions && lr.transactions.length > 0) {
      return lr.transactions
        .map((transaction) => transaction.articleNo)
        .filter((val) => val !== undefined && val !== null && val !== "")
        .join(", ");
    }
    return lr.articles !== undefined && lr.articles !== null ? String(lr.articles) : "";
  };

  const columns = [
    { field: "id", headerName: "Id" },
    {
      field: "index",
      headerName: "Sr. No.",
      flex: 1,
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
      field: "description",
      headerName: "Description",
      flex: 1,
      // renderCell: (params) => {
      //   return getDescription(params.row);
      // },
    },
    {
      field: "articles",
      headerName: "Articles",
      flex: 1,
      renderCell: (params) => {
        return getArticleOrWeight(params.row);
      },
    },
    {
      field: "date",
      headerName: "LR date",
      flex: 1,
      // renderCell: (params) => {
      //   if (params.row.wayBillNo) {
      //     return `${params.row.wayBillNo} ${getFormattedDate(params.row.date)}`;
      //   } else {
      //     return getFormattedDate(params.row.date);
      //   }
      // },
    },
    {
      field: "total",
      headerName: "Amount",
      flex: 1,
      renderCell: (params) => {
        return <strong>₹ {Number(params.row.total)?.toFixed?.(2)}</strong>;
      },
    },
  ];

  const [selectedLR, setSelectedLR] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const submitHandler = (e) => {
    e.preventDefault();
    const list = sortArray(selectedLR, "lrNo");
  
    // Log the sorted list
    console.log("Sorted Lorry Receipts List:", list);
  
    setBill((currState) => {
      const updatedBill = {
        ...currState,
        lrList: list?.map?.((lr, index) => ({
          ...lr,
          index: index + 1,
        })),
      };
  
      // Log the updated bill state
      console.log("Updated Bill State:", updatedBill);
  
      return updatedBill;
    });
  };
  


  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.checked;
  
    const updatedLR = lorryReceipts?.map((lr) => {
      if (lr.id.toString() === name) { 
        lr.checked = value;
      }
      return lr;
    });
  
    const selectedLR = updatedLR?.filter(lr => lr.checked);  
    setSelectedLR(selectedLR);
    const allSelected = updatedLR?.every(lr => lr.checked);  
    setSelectAll(allSelected);
  };
  
  

  const selectAllChangeHandler = (e) => {
    setSelectAll(e.target.checked);
    const updatedLR = lorryReceipts?.map?.((lr) => {
      lr.checked = e.target.checked;
      return lr;
    });
    setSelectedLR(updatedLR?.filter?.((lr) => lr.checked));
  };

  // useEffect(() => {
  //   if (selectAll) {
  //     const updatedLR = lorryReceipts?.map?.((lr) => {
  //       lr.checked = true;
  //       return lr;
  //     });
  //     setSelectedLR(updatedLR?.filter?.((lr) => lr.checked));
  //   } else {
  //     const updatedLR = lorryReceipts?.map?.((lr) => {
  //       lr.checked = false;
  //       return lr;
  //     });
  //     setSelectedLR(updatedLR?.filter?.((lr) => lr.checked));
  //   }
  // }, [selectAll]);

  return (
    <>
      <div className="grid grid-6-col">
        <div className="grid-item">
          <h2 className="mb20 text-inline">Lorry receipts</h2>
        </div>
        <div className="grid-item">
          <FormControl fullWidth>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="From"
                inputFormat="DD/MM/YYYY"
                value={bill.from || null}
                disableFuture={true}
                maxDate={bill.to}
                onChange={dateInputChangeHandler.bind(null, "from")}
                inputProps={{
                  readOnly: true,
                }}
                renderInput={(params) => (
                  <TextField name="from" size="small" {...params} />
                )}
              />
            </LocalizationProvider>
          </FormControl>
        </div>
        <div className="grid-item">
          <FormControl fullWidth>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="To"
                inputFormat="DD/MM/YYYY"
                value={bill.to || null}
                disableFuture={true}
                minDate={bill.from}
                onChange={dateInputChangeHandler.bind(null, "to")}
                inputProps={{
                  readOnly: true,
                }}
                renderInput={(params) => (
                  <TextField name="to" size="small" {...params} />
                )}
              />
            </LocalizationProvider>
          </FormControl>
        </div>
        <div className="grid-item">
          <FormControlLabel
            className="groupCheckbox"
            key="selectAll"
            control={
              <Checkbox
                name={selectAll}
                size="small"
                checked={selectAll}
                onChange={selectAllChangeHandler}
              />
            }
            label={
              <span
                style={{
                  fontSize: "0.9em",
                  display: "inline-block",
                  lineHeight: "1em",
                }}
              >
                Select all
              </span>
            }
          />
        </div>
      </div>

      <form action="" onSubmit={submitHandler} id="lrSelectionForm">
        {lorryReceipts?.length === 0 && (
          <p>No lorry receipts found for billing!</p>
        )}
        <div className="bl_lrCheckboxes">
          <FormGroup className="checkboxGroup">
            {lorryReceipts?.length > 0 &&
              lorryReceipts?.map?.((lr) => (
                <FormControlLabel
                  className="groupCheckbox"
                  key={lr.id}
                  control={
                    <Checkbox
                      name={lr.id}
                      size="small"
                      checked={lr.checked}
                      onChange={inputChangeHandler}
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
              ))}
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
      <DataGrid
        sx={{ backgroundColor: "primary.contrastText" }}
        autoHeight
        density="compact"
        getRowId={(row) => row.id || Math.random()}
        rows={bill.lrList || []}
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
    </>
  );
};

export default LorryReceipts;
