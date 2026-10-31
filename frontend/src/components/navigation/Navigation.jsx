import React, { useEffect, useState } from "react";
import { Link, useLocation, useResolvedPath } from "react-router-dom";
import { useSelector } from "react-redux";
import classes from "./Navigation.module.css";
import navItems from "./navList";
import { arrow, arrowDown } from "../../assets";
const Navigation = () => {
  const user = useSelector((state) => state.user);
  
  return (
    <nav className={classes.nav}>
      <ul>
        {navItems?.map?.((navItem) => {
           if (
            user &&
            user.usertype?.toLowerCase() === "clientuser" &&
            (   navItem.to === "/transactions" || navItem.to === "/reports")
          ) {
            return null; 
          }

          if (
            user &&
            (user.usertype?.toLowerCase() === "superadmin" ||
             user.usertype?.toLowerCase() === "admin" ||
             user.usertype?.toLowerCase() === "user") &&
            (navItem.to === "/ClientlorryReceipt")
          ) {
            return null; 
          }
          
          
          if (
            user &&
            user.usertype &&
            (user.usertype?.toLowerCase?.() === "user" ||
            user.usertype?.toLowerCase?.() === "admin") &&
            (navItem.to === "/users")
          ) {
            return null;
          }

          if (
            user &&
            user.usertype &&
            (user.usertype?.toLowerCase?.() === "user") &&
            (navItem.to === "/users" || navItem.to === "/master")
          ) {
            return null;
          }
          if (navItem.children && navItem.children?.length > 0) {
            return (
              <CustomLink
                key={navItem.to}
                to={navItem.to}
                subnav={navItem.children}
              >
                <span className="nav-icons">{navItem.icon}</span>
                {navItem.label}
              </CustomLink>
            );
          } else {
            return (
              <CustomLink key={navItem.to} to={navItem.to}>
                <span className="nav-icons">{navItem.icon}</span>
                {navItem.label}
              </CustomLink>
            );
          }
        })}
      </ul>
    </nav>
  );
};

export default Navigation;

const CustomLink = ({ to, children, ...props }) => {
  const resolvedPath = useResolvedPath(to);
  const location = useLocation();
  // const isActive = useMatch({ path: resolvedPath.pathname });
  const isActive = location.pathname.includes?.(resolvedPath.pathname);
  let isChildActive = false;
  if (!isChildActive && location.pathname.startsWith(to)) {
    isChildActive = true;
  }
  const [toggle, setToggle] = useState(false);
  useEffect(() => {
    setToggle(isActive || isChildActive);
  }, [location]);

  const toggleMenu = () => {
    setToggle(!toggle);
  };
  return (
    <li className={toggle ? classes.active : ""}>
      <Link to={to} {...props}>
        {children}
      </Link>
      {props.subnav && props.subnav?.length > 0 && (
        <ul>
          {props.subnav?.map?.((subnavItem) => (
            <CustomSubLink key={subnavItem.to} subto={subnavItem.to}>
              {subnavItem.label}
            </CustomSubLink>
          ))}
        </ul>
      )}
      <span onClick={toggleMenu} className="nav-arrow">
        {toggle ? <img src={arrowDown} alt="" /> : <img src={arrow} alt="" />}
      </span>
    </li>
  );
};

const CustomSubLink = ({ subto, children, ...props }) => {
  const resolvedPath = useResolvedPath(subto);
  // const isActive = useMatch({ path: resolvedPath.pathname, startsWith: true });
  const location = useLocation();
  const isActive = location.pathname.includes?.(resolvedPath.pathname);
  let isChildActive = false;
  if (!isChildActive && location.pathname.startsWith(subto)) {
    isChildActive = true;
  }

  return (
    <li key={subto} className={isActive || isChildActive ? classes.active : ""}>
      {/* return (<li key={subto} className=''> */}
      <Link to={subto} {...props}>
        {children}
      </Link>
    </li>
  );
};
