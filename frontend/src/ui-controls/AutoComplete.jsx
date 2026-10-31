import React from "react";
import { Autocomplete } from "@mui/material";
import { matchSorter } from "match-sorter";

const AutoComplete = ({ sortKey = "name", ...props }) => {
  const filterOptions = (options, { inputValue }) =>
    matchSorter(options, inputValue, {
      keys: [{ threshold: matchSorter.rankings.STARTS_WITH, key: sortKey }],
    });
  return (
    <Autocomplete
      autoSelect
      filterOptions={filterOptions}
      {...props}
      renderOption={(props, option) => (
        <li {...props} key={option._id}>
          {option[sortKey]}
        </li>
      )}
    />
  );
};

export default AutoComplete;
