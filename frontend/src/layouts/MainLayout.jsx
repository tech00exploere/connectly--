import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
