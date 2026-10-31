import { Paper, Divider } from "@mui/material";
import React, { useState } from "react";
import AddSupplierBill from "./AddSupplierBill";
import SupplierBillList from "./SupplierBillList";

const SupplierBills = ({
  suppliers,
  selectedSupplier,
  selectedSupplierType,
}) => {
  const [triggerFetch, setTriggerFetch] = useState(true);

  return (
    <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
      {selectedSupplier &&
      selectedSupplierType &&
      selectedSupplierType !== "Vehicle" ? (
        <>
          <>
            <AddSupplierBill
              selectedSupplier={selectedSupplier}
              selectedSupplierType={selectedSupplierType}
              setTriggerFetch={setTriggerFetch}
            />
            <Divider sx={{ margin: "20px 0" }} />
          </>
        </>
      ) : null}
      <SupplierBillList
        selectedSupplier={selectedSupplier}
        selectedSupplierType={selectedSupplierType}
        triggerFetch={triggerFetch}
        setTriggerFetch={setTriggerFetch}
      />
    </Paper>
  );
};

export default SupplierBills;
