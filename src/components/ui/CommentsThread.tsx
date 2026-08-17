'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Edit2, Trash2, Reply } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  mentions: string[];
  created_at: string;
  updated_at: string;
  user: User;
}

interface CommentsThreadProps {
  taskId: string;
}

export function CommentsThread({ taskId }: CommentsThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  // Fetch comments
  useEffect(() => {
    fetchComments();
    subscribeToComments();
  }, [taskId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?taskId=${taskId}`);
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToComments = () => {
    const channel = supabase
      .channel('comments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newComment = payload.new as Comment;
            setComments(prev => [...prev, newComment]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Comment;
            setComments(prev => prev.map(c => c.id === updated.id ? updated : c));
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as Comment;
            setComments(prev => prev.filter(c => c.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      // Extract @mentions from content
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      const mentions: string[] = [];
      let match;
      while ((match = mentionRegex.exec(newComment)) !== null) {
        mentions.push(match[2]); // Extract user ID
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          content: newComment,
          parent_id: replyTo,
          mentions,
        }),
      });

      if (response.ok) {
        setNewComment('');
        setReplyTo(null);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, content: editContent }),
      });

      if (response.ok) {
        setEditingId(null);
        setEditContent('');
      }
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const renderComment = (comment: Comment, depth = 0) => {
    const isEditing = editingId === comment.id;
    const replies = comments.filter(c => c.parent_id === comment.id);

    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8 border-l-2 border-zinc-200 dark:border-zinc-700 pl-4' : ''}`}>
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 mb-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
              {comment.user.full_name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-zinc-900 dark:text-white">
                  {comment.user.full_name}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>

              {isEditing ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white text-sm"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEdit(comment.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditContent('');
                      }}
                      className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm hover:bg-zinc-300 dark:hover:bg-zinc-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setReplyTo(comment.id)}
                      className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Reply className="w-3 h-3" />
                      Reply
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditContent(comment.content);
                      }}
                      className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:underline"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 hover:underline"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {replies.map(reply => renderComment(reply, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-4 text-zinc-500">Loading comments...</div>;
  }

  const topLevelComments = comments.filter(c => !c.parent_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold">
        <MessageCircle className="w-5 h-5" />
        <span>Comments ({comments.length})</span>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
        {replyTo && (
          <div className="mb-2 text-sm text-blue-600 dark:text-blue-400">
            Replying to comment
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="ml-2 underline"
            >
              Cancel
            </button>
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment... Use @username to mention someone"
          className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 text-sm resize-none"
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <Send className="w-4 h-4" />
            Post Comment
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {topLevelComments.length === 0 ? (
          <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          topLevelComments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
}
