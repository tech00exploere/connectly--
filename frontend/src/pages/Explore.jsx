const categories = [
  {
    key: "tech",
    title: "Tech",
    subtitle: "New tools, builds, and product drops",
    items: ["AI tooling", "Frontend tips", "OSS releases"]
  },
  {
    key: "entertainment",
    title: "Entertainment",
    subtitle: "Movies, music, gaming, and creators",
    items: ["New trailers", "Top charts", "Creator highlights"]
  },
  {
    key: "culture",
    title: "Culture",
    subtitle: "Ideas, trends, and community moments",
    items: ["Trending topics", "Local stories", "Opinion threads"]
  },
  {
    key: "skills",
    title: "Skills",
    subtitle: "Learn, teach, and show your craft",
    items: ["Quick lessons", "Portfolios", "Mentor offers"]
  },
  {
    key: "finance",
    title: "Finance",
    subtitle: "Markets, side hustles, and money tips",
    items: ["Personal finance", "Market notes", "Startup funding"]
  },
  {
    key: "health",
    title: "Health",
    subtitle: "Wellness, routines, and performance",
    items: ["Fitness plans", "Mental health", "Nutrition basics"]
  }
];

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import api from "../utils/api";

const Explore = () => {
  const { category } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/posts?category=${category}`);
        setPosts(res.data);
      } catch (err) {
        console.error(
          "CATEGORY POSTS ERROR:",
          err.response?.status,
          err.response?.data || err.message
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category]);

  return (
    <div className="rounded-xl p-4 sm:p-6 bg-gradient-to-br from-amber-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Explore</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Choose a feed to focus your timeline by topic.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div
            key={c.key}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex flex-col hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {c.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{c.subtitle}</p>
              </div>
              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full shrink-0">
                Feed
              </span>
            </div>

            <div className="mt-4 flex-1">
              <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                What you will see
              </div>
              <div className="mt-2 space-y-2">
                {c.items.map((item) => (
                  <div
                    key={item}
                    className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <Link
              to={`/explore/${c.key}`}
              className="mt-4 w-full text-center bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white py-2 rounded-lg transition-colors text-sm font-medium"
            >
              View {c.title} Feed
            </Link>
          </div>
        ))}
      </div>

      {category ? (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 capitalize">
              {category} Feed
            </h2>
            <Link
              to="/explore"
              className="text-sm text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
            >
              ← Back to all categories
            </Link>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400">
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400">
              No posts in this category yet.
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} compact />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Explore;
