import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import { useSelector, useDispatch } from "react-redux";
import { removeUser } from "../../modules/user/slice/userSlice";
import { getFormattedDate } from "../../services/utils";
import classes from "./Header.module.css";

const burger = classes.burger;
const burgerActive = `${classes.burger} ${classes.active}`;

const Header = () => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState({});
  const [burgerClass, setBurgerClass] = useState(classes.burger);

  useEffect(() => {
    setLoggedInUser(user);
  }, [user]);

  // const currentDate = `${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}`;
  const currentDate = getFormattedDate(new Date());

  const handleLogout = () => {
    dispatch(removeUser());
    const jQueryScript = document.createElement("link");
    jQueryScript.setAttribute(
      "href",
      "https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/6.4.1/mdb.min.css"
    );
    jQueryScript.setAttribute("rel", "stylesheet");
    document.head.appendChild(jQueryScript);
    navigate("/");
    window.location.reload();
  };

  const handleMenuClick = () => {
    if (
      document.body.classList?.length &&
      document.body.classList.contains("show-menu")
    ) {
      document.body.classList.remove("show-menu");
      setBurgerClass(burger);
    } else {
      document.body.classList.add("show-menu");
      setBurgerClass(burgerActive);
    }
  };

  return (
    <header className={classes.header}>
      <div className={classes.head}>
        {/* {user && user.type ? ( */}
          <div className={burgerClass} onClick={handleMenuClick}>
            <div className={classes.bar}></div>
            <div className={classes.bar}></div>
            <div className={classes.bar}></div>
          </div>
        {/* ) : null} */}
        <div className={classes.logo}>
          <Link to="/">{import.meta.env.VITE_TITLE}</Link>
        </div>

        {loggedInUser && loggedInUser.username && (
          <div className="head-rgt">
            <div className={classes.logout}>
              <span className="head-date">Date: {currentDate}</span>{" "}
              <span className="headPipe">|</span>{" "}
              {user.employee && user.employee?.name}
              {!user.employee &&
                !user.employee?.name &&
                user.username}&nbsp;{" "}
              <IconButton
                size="small"
                onClick={handleLogout}
                sx={{
                  color: "#fff",
                  fontSize: "1em",
                  "&:hover": { color: "#fff" },
                }}
              >
                <LogoutIcon sx={{ fontSize: "1.5em" }} />
                Logout
              </IconButton>
            </div>
          </div>
        )}
        {(!loggedInUser || !loggedInUser.username) && (
          <div className={classes.logout}>
            <span className="head-date">Date: {currentDate}</span>{" "}
            <span className="headPipe">|</span>{" "}
            {user.employee && user.employee?.name}
            {!user.employee && !user.employee?.name && user.username}{" "}
            <IconButton
              size="small"
              onClick={handleLogout}
              sx={{
                color: "#fff",
                fontSize: "1em",
                "&:hover": { color: "#fff" },
              }}
            >
              <LoginIcon sx={{ fontSize: "1.5em" }} />
              &nbsp;Login
            </IconButton>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
