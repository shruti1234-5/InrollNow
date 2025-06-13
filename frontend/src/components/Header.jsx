import React from 'react';
import { GraduationCap } from 'lucide-react';
import schoolIcon from "../assets/download2.png";

function Header() {
  return (
    <header className="text-white shadow-sm w-100" style={{ backgroundColor: "#00509E" }}>
    <div className="container px-4 py-3 d-flex justify-content-center align-items-center">
      <div className="d-flex align-items-center gap-2">
        <GraduationCap size={28} />
       
        {/* <img 
        src={schoolIcon} 
        alt="Logo" 
        style={{ width: "80px", height: "70px", }} 
      /> */}
        <h1 className="fs-4 fw-bold m-0 text-center">InRollNow - Your Gateway to College Enrollment.</h1>
      </div>
    </div>
  </header>
  

  )
}

export default Header;
