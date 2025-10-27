import React, { useContext } from "react";
import { UserContext } from "../../context/userContext";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";

const DashboardLayout = ({ children, activellenu }) => {
  const { user } = useContext(UserContext);

  return (
    <div className="">
      <Navbar activellenu={activellenu} />
      {user && (
        <div className="flex">
          <div className="вах-[1888px]:hidden">
            <SideMenu activellenu={activellenu} />
          </div>
          <div className="grow mx-5">{children}</div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
