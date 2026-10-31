const { some } = require("lodash");

const convertTime12to24 = (time12h) => {
  if (!time12h || !time12h?.trim?.()) {
    return null;
  }
  const [time, modifier] = time12h.split(" ");

  let [hours, minutes] = time.split(":");

  if (hours === "12") {
    hours = "00";
  }

  if (modifier === "PM") {
    hours = parseInt(hours, 10) + 12;
  }
  return `2023-12-06T${hours}:${minutes}:17.689Z`;
};
const sortArray = (array, key) => {
  return array.sort((a, b) => (a[key] > b[key] ? 1 : b[key] > a[key] ? -1 : 0));
};

function hasHindiCharacters(str = "") {
  if (!str) {
    return false;
  }

  return some(str.split(""), function (char) {
    const charCode = char.charCodeAt?.() || 0;
    return charCode >= 2309 && charCode <= 2361;
  });
}

function addHours(date) {
  if (!date) {
    return date;
  }

  let newDate = new Date(date);
  newDate.setHours(newDate.getHours() + 5);
  newDate.setMinutes(newDate.getMinutes() + 30);
  return newDate.toISOString();
}

module.exports = {
  convertTime12to24,
  sortArray,
  hasHindiCharacters,
  addHours,
};
