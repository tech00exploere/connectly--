import { useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { BACKEND_URL } from "../utils/config";
import { Heart, MessageCircle, Pencil, Trash2 } from "lucide-react";

const PostCard = ({ post, onUpdated, onDeleted, compact = false }) => {
  const { user } = useAuth();
  const author = post?.author;
  const mediaSrc = post?.mediaUrl
    ? post.mediaUrl.startsWith("http")
      ? post.mediaUrl
      : `${BACKEND_URL}${post.mediaUrl}`
    : "";

  // Derive initial liked state from server data
  const isLikedByMe =
    Array.isArray(post?.likes) &&
    post.likes.some((id) => String(id) === String(user?._id));

  const [likesCount, setLikesCount] = useState(post?.likes?.length || 0);
  const [liked, setLiked] = useState(isLikedByMe);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(post?.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(post?.title || "");
  const [draftContent, setDraftContent] = useState(post?.content || "");
  const [deleted, setDeleted] = useState(false);

  const isOwner = user?._id && author?._id && String(user._id) === String(author._id);

  const toggleLike = async () => {
    try {
      const res = await api.post(`/posts/${post._id}/like`);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to like post");
    }
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/posts/${post._id}/comment`, {
        text: commentText
      });
      setComments((prev) => [...prev, res.data]);
      setCommentText("");
      setShowComments(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add comment");
    }
  };

  const saveEdit = async () => {
    if (!draftTitle.trim() || !draftContent.trim()) return;
    try {
      const res = await api.put(`/posts/${post._id}`, {
        title: draftTitle,
        content: draftContent
      });
      setEditing(false);
      if (onUpdated) onUpdated(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update post");
    }
  };

  const deletePost = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${post._id}`);
      if (onDeleted) onDeleted(post._id);
      else setDeleted(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete post");
    }
  };

  if (deleted) return null;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      {/* Author row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm shrink-0">
            {(author?.username?.[0] || "?").toUpperCase()}
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-100 leading-tight">
              {author?.username || "Unknown"}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {author?.institution || "Member"}
            </p>
          </div>
        </div>
        <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full shrink-0">
          {post?.category || "general"}
        </span>
      </div>

      {/* Content / Edit form */}
      {editing ? (
        <div className="mt-3 space-y-2">
          <input
            id={`edit-title-${post._id}`}
            name={`edit-title-${post._id}`}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <textarea
            id={`edit-content-${post._id}`}
            name={`edit-content-${post._id}`}
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3
            className={`mt-3 font-semibold text-gray-800 dark:text-gray-100 ${
              compact ? "line-clamp-1 text-sm" : "text-base"
            }`}
          >
            {post?.title}
          </h3>
          <p
            className={`text-gray-600 dark:text-gray-300 mt-1 leading-relaxed ${
              compact ? "line-clamp-3 text-sm" : "text-sm"
            }`}
          >
            {post?.content}
          </p>
        </>
      )}

      {/* Media — YouTube-style 16:9, compact size */}
      {post?.mediaType && post.mediaType !== "none" && mediaSrc ? (
        <div className="mt-3 rounded-xl overflow-hidden bg-black max-w-md mx-auto">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            {post.mediaType === "image" ? (
              <img
                src={mediaSrc}
                alt={post?.title || "Post media"}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <video
                src={mediaSrc}
                controls
                preload="metadata"
                playsInline
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
            )}
          </div>
        </div>
      ) : null}



      {/* Actions */}
      <div className="flex items-center gap-3 mt-3 text-sm text-gray-500 dark:text-gray-400">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
            liked
              ? "text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20"
              : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          <Heart size={15} fill={liked ? "currentColor" : "none"} />
          <span>{likesCount}</span>
        </button>

        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <MessageCircle size={15} />
          <span>{comments.length}</span>
        </button>

        {isOwner && (
          <>
            <button
              onClick={() => setEditing((v) => !v)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-auto"
            >
              <Pencil size={14} />
              <span className="text-xs">{editing ? "Editing" : "Edit"}</span>
            </button>
            <button
              onClick={deletePost}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
              <span className="text-xs">Delete</span>
            </button>
          </>
        )}
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
                No comments yet. Be the first!
              </p>
            ) : (
              comments.map((c) => (
                <div key={c._id || c.createdAt} className="text-sm flex gap-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-100 shrink-0">
                    {c.user?.username || "User"}:
                  </span>
                  <span className="text-gray-600 dark:text-gray-300 break-words">
                    {c.text}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <input
              id={`comment-${post._id}`}
              name={`comment-${post._id}`}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addComment()}
              placeholder="Write a comment..."
              className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button
              onClick={addComment}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 rounded-lg text-sm font-medium transition-colors"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
