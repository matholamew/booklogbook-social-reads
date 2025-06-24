import React from "react";

const Footer = () => {
  return (
    <footer className="w-full py-4 flex justify-center items-center bg-white border-t border-slate-200 mt-8 text-center text-sm text-slate-600">
      <span>
        © {new Date().getFullYear()} BookLogBook
      </span>
    </footer>
  );
};

export default Footer; 