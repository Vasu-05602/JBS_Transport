import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getUserData } from "../services/utils";

const RequireAuth = ({ parent, path, process, children }) => {
  const user = useSelector((state) => state.user);
  // if (user.type === "Admin") {
  //   return children;
  // }
  
  if (!user || !user.usertype || !user.username) {
    return <Navigate to="/" replace />;
  }
  
  const permissions = user.permissions[parent]?.[path] || {};
  const hasPermission = Array.isArray(process)
    ? process.some((p) => permissions[p] === true)  
    : permissions[process] === true;                
 
  if (hasPermission) {
    return children;
  } else {
    return <Navigate to="/unauthorized" replace />;
  }
};

export default RequireAuth;

export const checkAuth = (parent, path, process) => {
  const user = getUserData();
  const userState = user && user.username ? user : {};
  return userState.permissions[parent][path][process];
};
