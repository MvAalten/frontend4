import React from "react";
import { FaHome, FaUser, FaCompass, FaUpload, FaSignInAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

const Sidebar = () => {
    return (
        <aside className="w-20 sm:w-56 bg-[#40434E] flex flex-col items-center sm:items-start px-2 sm:px-4 py-6 space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold mb-2">GymTok</h1>

            <input
                type="text"
                placeholder="Search"
                className="bg-[#B9CFD4] text-black placeholder-black px-2 py-1 rounded-md w-full text-sm sm:text-base"
            />

            <nav className="flex flex-col space-y-4 mt-4 w-full">
                <Link to="/" className="flex items-center gap-2 hover:text-[#FF6B6B]">
                    <FaHome /> <span className="hidden sm:inline">Home</span>
                </Link>
                <Link to="/explore" className="flex items-center gap-2 hover:text-[#FF6B6B]">
                    <FaCompass /> <span className="hidden sm:inline">Explore</span>
                </Link>
                <Link to="/upload" className="flex items-center gap-2 hover:text-[#FF6B6B]">
                    <FaUpload /> <span className="hidden sm:inline">Upload</span>
                </Link>
                <Link to="/profile" className="flex items-center gap-2 hover:text-[#FF6B6B]">
                    <FaUser /> <span className="hidden sm:inline">Profile</span>
                </Link>
                <Link to="/login" className="flex items-center gap-2 hover:text-[#FF6B6B]">
                    <FaSignInAlt /> <span className="hidden sm:inline">Login</span>
                </Link>
            </nav>
        </aside>
    );
};

export default Sidebar;
