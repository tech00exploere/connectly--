import { useEffect, useState } from "react";
import api from "../utils/api";
import { BACKEND_URL } from "../utils/config";
import { UserCheck, UserX } from "lucide-react";

const Requests = () => {
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState({}); // track per-user loading

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/users/requests");
        setReqs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("REQUESTS FETCH ERROR:", err.response?.data || err.message);
        setError("Failed to load connection requests.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const accept = async (id) => {
    setProcessing((p) => ({ ...p, [id]: "accept" }));
    try {
      await api.post(`/users/accept/${id}`);
      setReqs((p) => p.filter((r) => r._id !== id));
    } catch (err) {
      console.error("ACCEPT ERROR:", err.response?.data || err.message);
    } finally {
      setProcessing((p) => ({ ...p, [id]: null }));
    }
  };

  const reject = async (id) => {
    setProcessing((p) => ({ ...p, [id]: "reject" }));
    try {
      await api.post(`/users/reject/${id}`);
      setReqs((p) => p.filter((r) => r._id !== id));
    } catch (err) {
      console.error("REJECT ERROR:", err.response?.data || err.message);
    } finally {
      setProcessing((p) => ({ ...p, [id]: null }));
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        Loading requests…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center text-red-500 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
        Connection Requests
      </h1>

      {reqs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          No pending connection requests 🎉
        </div>
      ) : (
        reqs.map((u) => (
          <div
            key={u._id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={
                  u.profileImage
                    ? `${BACKEND_URL}${u.profileImage}`
                    : "/avatar.png"
                }
                alt={u.username}
                loading="lazy"
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-200 dark:border-emerald-700 shrink-0"
              />
              <div className="min-w-0">
                <div className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">
                  {u.username}
                </div>
                {u.institution && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {u.institution}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => accept(u._id)}
                disabled={!!processing[u._id]}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                <UserCheck size={14} />
                <span className="hidden sm:inline">Accept</span>
              </button>
              <button
                onClick={() => reject(u._id)}
                disabled={!!processing[u._id]}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-60 text-gray-700 dark:text-gray-200 text-sm font-medium transition-colors"
              >
                <UserX size={14} />
                <span className="hidden sm:inline">Decline</span>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Requests;
