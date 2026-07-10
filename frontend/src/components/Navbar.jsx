import { Home, User, LogOut, LogIn, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-[#FFFEF5] dark:bg-gray-900 border-b border-emerald-200 dark:border-gray-800 shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <h1 className="text-[var(--primary-700)] dark:text-[var(--primary-300)] font-extrabold text-xl sm:text-2xl">
          Connectly
        </h1>

        {/* Right side navigation links — always visible desktop mode */}
        <div className="flex gap-4 sm:gap-6 items-center">
          {isAuthenticated ? (
            <>
              <Link
                to="/"
                className="flex items-center gap-2 text-[var(--primary-700)] dark:text-[var(--primary-300)] hover:text-[var(--primary-800)] dark:hover:text-[var(--primary-200)] text-sm font-medium"
              >
                <Home size={18} />
                <span>Home</span>
              </Link>

              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-[var(--primary-700)] dark:text-[var(--primary-300)] hover:text-[var(--primary-800)] dark:hover:text-[var(--primary-200)] text-sm font-medium"
              >
                <User size={18} />
                <span>Profile</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-[var(--primary-700)] dark:text-[var(--primary-300)] hover:text-red-600 dark:hover:text-red-400 text-sm font-medium"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-[var(--primary-700)] dark:text-[var(--primary-300)] hover:text-[var(--primary-800)] dark:hover:text-[var(--primary-200)] text-sm font-medium"
              >
                <LogIn size={18} />
                <span>Login</span>
              </Link>

              <Link
                to="/register"
                className="flex items-center gap-1.5 text-[var(--primary-700)] dark:text-[var(--primary-300)] hover:text-[var(--primary-800)] dark:hover:text-[var(--primary-200)] text-sm font-medium"
              >
                <UserPlus size={18} />
                <span>Register</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
