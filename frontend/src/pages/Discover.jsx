import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { BACKEND_URL } from "../utils/config";
import { UserPlus, UserCheck, Clock, ArrowRight } from "lucide-react";

const Discover = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/discover");
      setUsers(res.data);
    } catch (err) {
      console.error(
        "DISCOVER FETCH ERROR:",
        err.response?.status,
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const refreshOnFocus = () => fetchData();
    window.addEventListener("focus", refreshOnFocus);
    const intervalId = setInterval(fetchData, 60000);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      clearInterval(intervalId);
    };
  }, []);

  const connect = async (id) => {
    try {
      await api.post(`/users/connect/${id}`);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === id ? { ...u, connectionStatus: "pending" } : u
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to connect");
    }
  };

  const renderButton = (u) => {
    switch (u.connectionStatus) {
      case "connected":
        return (
          <button
            disabled
            className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
          >
            <UserCheck size={14} />
            Connected
          </button>
        );
      case "pending":
        return (
          <button
            disabled
            className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700 text-sm cursor-not-allowed"
          >
            <Clock size={14} />
            Requested
          </button>
        );
      case "received":
        return (
          <button
            onClick={() => navigate("/requests")}
            className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          >
            <ArrowRight size={14} />
            View Request
          </button>
        );
      default:
        return (
          <button
            onClick={() => connect(u._id)}
            className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
          >
            <UserPlus size={14} />
            Connect
          </button>
        );
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-10 text-gray-500 dark:text-gray-400 text-sm">
        Loading users…
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center text-gray-500 dark:text-gray-400 text-sm">
        No users to connect with right now. Check back later!
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Discover People
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
        {users.map((u) => (
          <div
            key={u._id}
            className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center"
          >
            <img
              src={u.profileImage ? `${BACKEND_URL}${u.profileImage}` : "/avatar.png"}
              alt={u.username}
              loading="lazy"
              className="w-16 h-16 rounded-full mb-3 object-cover border-2 border-emerald-200 dark:border-emerald-700"
            />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {u.username}
            </h3>
            {u.institution && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-full">
                {u.institution}
              </p>
            )}
            {renderButton(u)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Discover;
