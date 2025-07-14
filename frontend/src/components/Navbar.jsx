import { useNavigate, useLocation } from "react-router-dom";
import schoolIcon from "../assets/download.png";
import { LayoutDashboard, ClipboardList, CreditCard, FileDown, FileBarChart, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onNavClick, isMobile, isCollapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

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

  const handleLogout = async () => {
    await logout();
    navigate('/register');
  };

  const handleNavClick = (path) => {
    navigate(path);
    if (onNavClick) {
      onNavClick();
    }
    if (isMobile && onToggle) {
      onToggle();
    }
  };

  return (
    <>
      {/* Toggle button for mobile */}
      {isMobile && (
        <button
          className="btn btn-primary position-fixed top-0 start-0 m-3 d-lg-none"
          style={{ zIndex: 1100 }}
          onClick={onToggle}
        >
          <Menu size={28} />
        </button>
      )}
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && !isCollapsed && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: 'rgba(0,0,0,0.3)', zIndex: 1099 }}
          onClick={onToggle}
        />
      )}
      <nav
        className="bg-white border-end h-100 position-fixed"
        style={{
          width: 268,
          zIndex: 1100,
          left: isMobile ? (isCollapsed ? '-268px' : '0') : '0',
          top: 0,
          height: '100vh',
          transition: 'left 0.2s',
          boxShadow: isMobile && !isCollapsed ? '2px 0 8px rgba(0,0,0,0.1)' : undefined
        }}
      >
        <div className="d-flex flex-column h-100">
          <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
            <img
              src={schoolIcon}
              alt="College Icon"
              className="img-fluid"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          
          </div>
          <div className="flex-grow-1 overflow-auto">
            {navItems.map((item) => (
              <button
                key={item.path}
                className={`btn btn-link text-decoration-none text-start d-flex align-items-center gap-2 p-3 rounded ${
                  isActiveRoute(item.path) ? 'text-primary' : 'text-dark'
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
    </>
  );
};

export default Navbar;