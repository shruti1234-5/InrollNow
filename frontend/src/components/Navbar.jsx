import { useNavigate, useLocation } from "react-router-dom";
import schoolIcon from "../assets/download.png";
import { LayoutDashboard, ClipboardList, CreditCard, FileDown, FileBarChart, LogOut } from 'lucide-react';

const Navbar = ({ onNavClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActiveRoute = (route) => {
    return location.pathname === route;
  };

  const navItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard"
    },
    {
      title: "Application Form",
      icon: <ClipboardList size={20} />,
      path: "/registration"
    },
    {
      title: "Payment Details",
      icon: <CreditCard size={20} />,
      path: "/payment"
    },
  ];

  const handleLogout = () => {
    // Clear all form-related data from localStorage
    const userPhone = localStorage.getItem('userPhone');
    if (userPhone) {
      localStorage.removeItem(`step1Data_${userPhone}`);
      localStorage.removeItem(`step2Data_${userPhone}`);
      localStorage.removeItem(`step3Data_${userPhone}`);
      localStorage.removeItem(`step1Submitted_${userPhone}`);
      localStorage.removeItem(`step2Submitted_${userPhone}`);
      localStorage.removeItem(`step3Submitted_${userPhone}`);
    }
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const handleNavClick = (path) => {
    navigate(path);
    if (onNavClick) {
      onNavClick();
    }
  };

  return (
    <nav className="bg-white border-end h-100 position-fixed" style={{ width: "268px", zIndex: 1000 }}>
      <div className="d-flex flex-column h-100">
        <div className="p-3 border-bottom">
        <img 
            src={schoolIcon} 
            alt="College Icon"  
            className="img-fluid"
            style={{ maxWidth: "100%", height: "auto" }}  
          />
        </div>
        <div className="flex-grow-1 overflow-auto">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`btn btn-link text-decoration-none text-start d-flex align-items-center gap-2 p-3 rounded ${     
                isActiveRoute(item.path) ? "text-primary" : "text-dark"
              }`}
              onClick={() => handleNavClick(item.path)}
            >
              <span className="me-2">{item.icon}</span>
              {item.title}
            </button>
          ))}
        </div>
        <div className="p-3 border-top">
          <button
            className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;