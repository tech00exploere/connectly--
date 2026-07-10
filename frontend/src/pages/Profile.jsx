import { useEffect, useState } from "react";
import api from "../utils/api";
import { BACKEND_URL } from "../utils/config";
import { compressImage } from "../utils/imageCompressor";

const FIELDS = [
  { key: "username", label: "Username", type: "text" },
  { key: "institution", label: "Institution", type: "text" },
  { key: "qualification", label: "Qualification", type: "text" },
  { key: "dob", label: "Date of Birth", type: "date" },
  { key: "gender", label: "Gender", type: "text" },
  { key: "resume", label: "Resume / Portfolio URL", type: "url" },
];

const Profile = () => {
  const [form, setForm] = useState({
    username: "",
    institution: "",
    qualification: "",
    dob: "",
    gender: "",
    resume: "",
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: "success"|"error", msg }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile");
        setForm((prev) => ({ ...prev, ...res.data }));
        if (res.data.profileImage) {
          setPreview(`${BACKEND_URL}${res.data.profileImage}`);
        }
      } catch (err) {
        console.error(
          "PROFILE FETCH ERROR:",
          err.response?.status,
          err.response?.data || err.message
        );
      }
    };
    fetchProfile();
  }, []);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          data.append(key, value);
        }
      });
      if (image) data.append("image", image);

      const res = await api.put("/profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updated = res.data;
      setForm((prev) => ({ ...prev, ...updated }));
      if (updated.profileImage) {
        setPreview(`${BACKEND_URL}${updated.profileImage}?t=${Date.now()}`);
      }

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const merged = { ...JSON.parse(storedUser), ...updated };
        localStorage.setItem("user", JSON.stringify(merged));
      }

      showToast("success", "Profile updated ✅");
    } catch (err) {
      console.error(
        "PROFILE UPDATE ERROR:",
        err.response?.status,
        err.response?.data || err.message
      );
      showToast("error", err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Edit Profile
        </h1>

        {/* Avatar picker */}
        <div className="flex flex-col sm:flex-row items-center gap-5 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
          <img
            src={preview || "/avatar.png"}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-emerald-200 dark:border-emerald-700 shrink-0"
          />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Profile Photo
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
              Compressed automatically to WebP for fast loading.
            </p>
            <label className="inline-block cursor-pointer bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
              Choose Photo
              <input
                id="profile-image"
                name="profileImage"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  try {
                    const compressed = await compressImage(file, {
                      maxWidth: 300,
                      quality: 0.8,
                    });
                    setImage(compressed);
                    setPreview(URL.createObjectURL(compressed));
                  } catch {
                    setImage(file);
                    setPreview(URL.createObjectURL(file));
                  }
                }}
              />
            </label>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FIELDS.map(({ key, label, type }) => (
            <div key={key} className="flex flex-col gap-1">
              <label
                htmlFor={`profile-${key}`}
                className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                {label}
              </label>
              <input
                id={`profile-${key}`}
                name={key}
                type={type}
                value={form[key] ?? ""}
                onChange={change}
                className="border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className="col-span-1 sm:col-span-2 mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-medium transition-colors"
          >
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
