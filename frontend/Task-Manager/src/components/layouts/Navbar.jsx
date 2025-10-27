import React, { useState } from "react";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import SideMenu from "./SideMenu";

const Navbar = ({ activeMenu }) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);

  return (
    <div className="flex gap-5 bg-white border-b border-gray-200/50 backdrop-blur-[2px] py-4 px-7 sticky top-0 z-50">
      {/* Menu Toggle Button for small screens */}
      <button
        className="block lg:hidden text-black"
        onClick={() => setOpenSideMenu(!openSideMenu)}
      >
        {openSideMenu ? (
          <HiOutlineX className="text-2xl" />
        ) : (
          <HiOutlineMenu className="text-2xl" />
        )}
      </button>

      {/* Navbar Title */}
      <h2 className="text-lg font-medium text-black">Expense Tracker</h2>

      {/* Side Menu for mobile */}
      {openSideMenu && (
        <div className="fixed top-[61px] w-full h-screen bg-white z-50">
          <SideMenu activeItem={activeMenu} />
        </div>
      )}
    </div>
  );
};

export default Navbar;
