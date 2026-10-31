import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Footer, Navigation, Header } from "..";
import classes from "./Layout.module.css";
const Layout = (props) => {
  const user = useSelector((state) => state.user);
  useEffect(() => {
    if (user.username) {
      const linkNodes = document.getElementsByTagName("link");
      const list = [...linkNodes];
      const linkNode = list.find((node) => node.href.includes("mdb-ui-kit"));
      if (linkNode) {
        linkNode?.parentNode?.removeChild(linkNode);
      }
    }
  }, [user]);
  return (
    <>
      {user && user.username && (
        <>
          <Header />
          <div className="main-wrap">
            <div className="left-panel">
              <Navigation />
            </div>
            <div className="right-panel">
              <main className={classes.main}>{props.children}</main>
              <Footer />
            </div>
          </div>
        </>
      )}

      {!user.username && (
        <div className="bg-login">
          <div className="bl_login">
            <main className={classes.main1}>{props.children}</main>
          </div>
        </div>
      )}
    </>
  );
};

export default Layout;
