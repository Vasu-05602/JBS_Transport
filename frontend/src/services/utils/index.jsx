import store from "@redux/store";
export const getUserData = () => {
  const userData = store.getState().user;
  return userData;
};



export const getToken = () => {
  return localStorage.getItem("jwt_token") || "";
};

export const setToken = (token) => {
  return localStorage.setItem("jwt_token", token);
};
export const setUserType = (type) => {
  return localStorage.setItem("type", type);
};

export const hasSuperAdmin = () => {
  const userType = localStorage.getItem("type");
  return userType === "Superadmin";
};
const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const getFormattedDate = (receivedDate) => {
  const date = new Date(receivedDate);
  const day = date.getDate();
  const formattedDay = ("0" + day)?.slice?.(-2);
  const month = date.getMonth();
  const year = date.getFullYear();

  return `${formattedDay} ${monthNames[month]} ${year}`;
};

export const getFormattedTime = (receivedDate) => {
  const date = new Date(receivedDate);
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  seconds = seconds <= 9 ? "0" + seconds : seconds;
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  const strTime = `${hours}:${minutes}:${seconds} ${ampm}`;
  return strTime;
};

export const getEmpId = () => {
  const loggedInUser = getUserData();
  return loggedInUser &&
    loggedInUser.usertype &&
    loggedInUser.usertype?.toLowerCase?.() === "superadmin"
    ? loggedInUser?.id
    : loggedInUser?.employee_id?.id;
};

export const states = [
  "Maharashtra",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttarakhand",
  "Uttar Pradesh",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and",
  "Daman & Diu",
  "Jammu & Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export const emailRegEx =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const mobileNoRegEx = /^[0-9]{10}$/;

export const getFormattedLRNumber = (lrNo) => {
  lrNo = lrNo.toString?.();
  while (lrNo?.length < 6) lrNo = "0" + lrNo;
  return lrNo;
};

export const getLRNoByBranch = (lrNo, selectedBranch) => {
  if (!selectedBranch) {
    return "";
  }
  const branchInitial = selectedBranch.name[0];
  let newNum = pad(1, 6);
  if (lrNo) {
    const nums = lrNo?.replace?.(/\D/g, "");
    newNum = pad(+nums, 6);
    return branchInitial + "-" + newNum;
  }
  return branchInitial + "-" + newNum;
};

export const getNextLRNumber = (lr, selectedBranch) => {
  if (!selectedBranch) {
    return "";
  }
  const branchInitial = selectedBranch.name[0];
  let newNum = pad(1, 6);
  if (lr && lr.lrNo) {
    const lrNo = lr.lrNo?.replace?.(/\D/g, "");
    newNum = pad(+lrNo + 1, 6);
    return branchInitial + "-" + newNum;
  }
  return branchInitial + "-" + newNum;
};

export const getFormattedLSNumber = (lsNo = "") => {
  if (!lsNo) return "";
  lsNo = lsNo?.toString?.();
  while (lsNo?.length < 6) lsNo = "0" + lsNo;
  return lsNo;
};

export const getFormattedPettyCashNo = (pcNo) => {
  pcNo = pcNo.toString?.();
  while (pcNo?.length < 5) pcNo = "0" + pcNo;
  return pcNo;
};

export const getFormattedTransactionNo = (ptNo) => {
  ptNo = ptNo.toString?.();
  while (ptNo?.length < 5) ptNo = "0" + ptNo;
  return ptNo;
};

export const getNextEmpNo = (emp) => {
  //DTP/2023/EMP-1
  if (emp && emp.code) {
    const parts = emp.code.split?.("/");
    const num = +parts[2]?.replace?.("EMP-", "");
    return `DTP/${new Date().getFullYear()}/EMP-${num + 1}`;
  }
  if (!emp || !emp.code) {
    return `DTP/${new Date().getFullYear()}/EMP-1`;
  }
};

export const getNextDriverNo = (driver) => {
  //DTP/2023/DRV-13
  if (driver && driver.code) {
    const parts = driver.code.split?.("/");
    const num = +parts[2]?.replace?.("DRV-", "");
    if (parts?.length < 2) {
      return `DTP/${new Date().getFullYear()}/DRV-${+parts[0] + 1}`;
    }
    return `DTP/${new Date().getFullYear()}/DRV-${num + 1}`;
  }
  if (!driver || !driver.code) {
    return `DTP/${new Date().getFullYear()}/DRV-1`;
  }
};

export const isSuperAdmin = () => {
  const user = getUserData();
  return user && user.usertype && user.usertype?.toLowerCase?.() === "superadmin";
};

export const isSuperAdminOrAdmin = () => {
  const user = getUserData();
  return (
    user &&
    user.usertype &&
    (user.usertype?.toLowerCase?.() === "superadmin" ||
      user.usertype?.toLowerCase?.() === "admin")
  );
};

export const pad = (num, size) => {
  num = num.toString?.();
  while (num?.length < size) num = "0" + num;
  return num;
};

export const base64ToObjectURL = (base64) => {
  if (base64) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters?.length);
    for (let i = 0; i < byteCharacters?.length; i++) {
      byteNumbers[i] = byteCharacters?.charCodeAt?.(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const file = new Blob([byteArray], {
      type: "application/pdf;base64",
    });
    const fileURL = URL.createObjectURL(file);
    return fileURL;
  }
  return null;
};

export const downloadFile = (fileURL, fileName) => {
  const link = document.createElement("a");
  link.href = fileURL;
  link.download = "JBS-" + fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 7000);
};

export const validateNumber = (e) => {
  const value = e.target.value
    ?.replace?.(/[^0-9.]/g, "")
    ?.replace?.(/(\..*?)\..*/g, "$1");
  e.target.value =
    (value + "")?.includes?.(".") && !parseInt((value + "").split?.(".")[1])
      ? value
      : value !== ""
      ? parseFloat(value || 0)
      : "";
};

export const validatePhoneNumber = (e) => {
  const value = e.target.value?.slice?.(0, 10)?.replace?.(/[^0-9]/g, "");
  e.target.value = value;
};

export const validateAlphaNumeric = (e, length = 50) => {
  return (e.target.value = e.target.value
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, length));
};

export const sortArray = (array, key) => {
  return array.sort((a, b) => (a[key] > b[key] ? 1 : b[key] > a[key] ? -1 : 0));
};
