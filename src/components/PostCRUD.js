import React, { useEffect, useState } from "react";
import {
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    getDoc,
    serverTimestamp,
    where,
    query,
} from "firebase/firestore";
import { db } from "../App";
import CommentCRUD from "./CommentCRUD";

function TaskCRUD({ currentUser, currentUserData }) {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState({ title: "", content: "", deadline: "" });
    const [editingTask, setEditingTask] = useState(null);
    const [editForm, setEditForm] = useState({ title: "", content: "", deadline: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedComments, setExpandedComments] = useState(new Set());
    const [isUserDataLoading, setIsUserDataLoading] = useState(true);

    useEffect(() => {
        if (currentUser !== null) {
            const timer = setTimeout(() => {
                setIsUserDataLoading(false);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setIsUserDataLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        // Only fetch tasks if user is logged in
        if (!currentUser) {
            setTasks([]);
            return;
        }

        // Create a query that filters for tasks belonging to the current user
        const tasksQuery = query(
            collection(db, "posts"),
            where("type", "==", "task"),
            where("authorId", "==", currentUser.uid)
        );

        const unsubscribe = onSnapshot(
            tasksQuery,
            (snapshot) => {
                const taskList = snapshot.docs
                    .map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate() || new Date(),
                        deadline: doc.data().deadline?.toDate?.() || doc.data().deadline,
                    }));
                taskList.sort((a, b) => b.createdAt - a.createdAt);
                setTasks(taskList);
            },
            (error) => {
                console.error("Error fetching tasks:", error);
            }
        );
        return () => unsubscribe();
    }, [currentUser]);

    const handleCreateTask = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            alert("Please log in to create a task");
            return;
        }

        if (!newTask.title.trim() || !newTask.content.trim()) {
            alert("Please fill in both title and content");
            return;
        }

        if (!newTask.deadline) {
            alert("Please set a deadline for the task");
            return;
        }

        setIsSubmitting(true);

        try {
            const authorUsername =
                currentUserData?.username ||
                currentUser.displayName ||
                currentUser.email ||
                "Anonymous User";

            const taskData = {
                title: newTask.title.trim(),
                content: newTask.content.trim(),
                authorId: currentUser.uid,
                authorUsername,
                likes: [],
                likeCount: 0,
                createdAt: serverTimestamp(),
                type: "task",
                isCompleted: false,
                deadline: new Date(newTask.deadline),
            };

            await addDoc(collection(db, "posts"), taskData);

            setNewTask({ title: "", content: "", deadline: "" });
            alert("Task created successfully!");
        } catch (error) {
            console.error("Error creating task:", error);
            alert(`Error creating task: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditTask = (task) => {
        setEditingTask(task.id);
        setEditForm({
            title: task.title,
            content: task.content,
            deadline: task.deadline ?
                (task.deadline instanceof Date ?
                        task.deadline.toISOString().slice(0, 16) :
                        new Date(task.deadline).toISOString().slice(0, 16)
                ) : ""
        });
    };

    const handleUpdateTask = async (taskId) => {
        if (!editForm.title.trim() || !editForm.content.trim()) {
            alert("Please fill in both title and content");
            return;
        }

        if (!editForm.deadline) {
            alert("Please set a deadline for the task");
            return;
        }

        try {
            const updateData = {
                title: editForm.title.trim(),
                content: editForm.content.trim(),
                deadline: new Date(editForm.deadline),
                updatedAt: serverTimestamp(),
            };

            await updateDoc(doc(db, "posts", taskId), updateData);
            setEditingTask(null);
            alert("Task updated successfully!");
        } catch (error) {
            console.error("Error updating task:", error);
            alert(`Error updating task: ${error.message}`);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            try {
                await deleteDoc(doc(db, "posts", taskId));
                alert("Task deleted successfully!");
            } catch (error) {
                console.error("Error deleting task:", error);
                alert(`Error deleting task: ${error.message}`);
            }
        }
    };

    const handleToggleTaskCompletion = async (taskId) => {
        if (!currentUser) {
            alert("Please log in to mark tasks as complete");
            return;
        }

        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        try {
            await updateDoc(doc(db, "posts", taskId), {
                isCompleted: !task.isCompleted,
                completedAt: !task.isCompleted ? serverTimestamp() : null,
            });
        } catch (error) {
            console.error("Error updating task completion:", error);
            alert(`Error updating task: ${error.message}`);
        }
    };

    const handleLikeTask = async (taskId) => {
        if (!currentUser) {
            alert("Please log in to like tasks");
            return;
        }

        try {
            const taskRef = doc(db, "posts", taskId);
            const taskSnap = await getDoc(taskRef);

            if (!taskSnap.exists()) {
                alert("Task not found");
                return;
            }

            const taskData = taskSnap.data();
            const likes = taskData.likes || [];

            if (likes.includes(currentUser.uid)) {
                await updateDoc(taskRef, {
                    likes: arrayRemove(currentUser.uid),
                    likeCount: Math.max(0, (taskData.likeCount || 0) - 1),
                });
            } else {
                await updateDoc(taskRef, {
                    likes: arrayUnion(currentUser.uid),
                    likeCount: (taskData.likeCount || 0) + 1,
                });
            }
        } catch (error) {
            console.error("Error liking task:", error);
            alert(`Error liking task: ${error.message}`);
        }
    };

    const toggleComments = (taskId) => {
        setExpandedComments((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    const getDeadlineStatus = (deadline) => {
        if (!deadline) return null;

        const now = new Date();
        const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
        const timeDiff = deadlineDate.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysDiff < 0) {
            return { status: "overdue", text: `${Math.abs(daysDiff)} days overdue`, colors: "from-red-500 to-red-600" };
        } else if (daysDiff === 0) {
            return { status: "today", text: "Due today", colors: "from-orange-500 to-red-500" };
        } else if (daysDiff <= 3) {
            return { status: "soon", text: `Due in ${daysDiff} days`, colors: "from-yellow-500 to-orange-500" };
        } else {
            return { status: "upcoming", text: `Due in ${daysDiff} days`, colors: "from-green-500 to-emerald-500" };
        }
    };

    return (
        <div className="space-y-8">
            {/* Create Task Form */}
            {currentUser ? (
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border border-sky-200 shadow-2xl">
                    <div className="flex items-center space-x-3 mb-6">
                        <span className="text-4xl">✅</span>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                            Create New Task
                        </h2>
                    </div>

                    {isUserDataLoading && (
                        <div className="bg-gradient-to-r from-sky-400 to-blue-500 text-white p-4 rounded-2xl mb-6 shadow-lg">
                            <div className="flex items-center space-x-3">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                                <span className="font-medium">Loading user data... You can still create tasks!</span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleCreateTask} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-slate-700 font-semibold">Task Title</label>
                            <input
                                type="text"
                                placeholder="What do you want to accomplish?"
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                className="w-full p-4 bg-white/70 border border-sky-200 rounded-2xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-200 focus:border-sky-300 transition-all duration-300"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-slate-700 font-semibold">Task Description</label>
                            <textarea
                                placeholder="Describe your task in detail..."
                                value={newTask.content}
                                onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
                                className="w-full p-4 bg-white/70 border border-sky-200 rounded-2xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-200 focus:border-sky-300 transition-all duration-300 h-32 resize-none"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-slate-700 font-semibold">⏰ Deadline</label>
                            <input
                                type="datetime-local"
                                value={newTask.deadline}
                                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                                className="w-full p-4 bg-white/70 border border-sky-200 rounded-2xl text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-200 focus:border-sky-300 transition-all duration-300"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center space-x-3">
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                                    <span>Creating Task...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center space-x-2">
                                    <span>✨</span>
                                    <span>Create Task</span>
                                    <span>🚀</span>
                                </div>
                            )}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-8 border border-sky-200 shadow-xl text-center">
                    <div className="text-6xl mb-4">🔐</div>
                    <h3 className="text-2xl font-bold text-slate-700 mb-2">Login Required</h3>
                    <p className="text-slate-600">Please log in to create and manage your tasks!</p>
                </div>
            )}

            {/* Tasks Feed */}
            <div className="space-y-6">
                {currentUser ? (
                    tasks.length > 0 ? (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <span className="text-3xl">📋</span>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent">
                                    Your Tasks ({tasks.length})
                                </h2>
                            </div>

                            {tasks.map((task) => {
                                const deadlineStatus = getDeadlineStatus(task.deadline);

                                return (
                                    <div key={task.id} className={`bg-white/80 backdrop-blur-lg rounded-3xl p-6 border-l-8 shadow-xl hover:shadow-2xl transition-all duration-300 ${
                                        task.isCompleted
                                            ? "border-green-500 bg-gradient-to-r from-green-50/50 to-emerald-50/50"
                                            : "border-sky-500 hover:border-blue-500"
                                    }`}>
                                        {editingTask === task.id ? (
                                            <div className="space-y-6">
                                                <div className="flex items-center space-x-3 mb-4">
                                                    <span className="text-2xl">✏️</span>
                                                    <h3 className="text-xl font-bold text-slate-700">Edit Task</h3>
                                                </div>

                                                <input
                                                    type="text"
                                                    value={editForm.title}
                                                    onChange={(e) =>
                                                        setEditForm({ ...editForm, title: e.target.value })
                                                    }
                                                    className="w-full p-4 bg-white/70 border border-sky-200 rounded-2xl text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-200 focus:border-sky-300 transition-all duration-300"
                                                    required
                                                />

                                                <textarea
                                                    value={editForm.content}
                                                    onChange={(e) =>
                                                        setEditForm({ ...editForm, content: e.target.value })
                                                    }
                                                    className="w-full p-4 bg-white/70 border border-sky-200 rounded-2xl text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-200 focus:border-sky-300 transition-all duration-300 h-24 resize-none"
                                                    required
                                                />

                                                <div className="space-y-2">
                                                    <label className="text-slate-700 font-semibold">Deadline</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={editForm.deadline}
                                                        onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                                                        className="w-full p-4 bg-white/70 border border-sky-200 rounded-2xl text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-200 focus:border-sky-300 transition-all duration-300"
                                                        required
                                                    />
                                                </div>

                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => handleUpdateTask(task.id)}
                                                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl font-bold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                                                    >
                                                        ✅ Save Changes
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingTask(null)}
                                                        className="flex-1 bg-gradient-to-r from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 text-white px-6 py-3 rounded-2xl font-bold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                                                    >
                                                        ❌ Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex items-center space-x-3">
                                                            <span className="text-2xl">
                                                                {task.isCompleted ? "✅" : "⏰"}
                                                            </span>
                                                            <div>
                                                                <div className="flex items-center space-x-2">
                                                                    <h3 className="font-bold text-lg bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                                                                        @{task.authorUsername}
                                                                    </h3>
                                                                    <span className="bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 px-3 py-1 rounded-full text-sm font-medium">
                                                                        Task
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-slate-500 mt-1">
                                                                    Created: {task.createdAt
                                                                    ? task.createdAt.toLocaleDateString()
                                                                    : "Unknown date"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleEditTask(task)}
                                                            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTask(task.id)}
                                                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </div>
                                                </div>

                                                <h4 className={`text-xl font-bold mb-3 ${
                                                    task.isCompleted
                                                        ? "line-through text-slate-500"
                                                        : "text-slate-800"
                                                }`}>
                                                    {task.title}
                                                </h4>

                                                <p className={`mb-4 leading-relaxed ${
                                                    task.isCompleted
                                                        ? "line-through text-slate-500"
                                                        : "text-slate-700"
                                                }`}>
                                                    {task.content}
                                                </p>

                                                {task.deadline && (
                                                    <div className="mb-6 p-4 bg-white/60 rounded-2xl border border-sky-100">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <span className="text-slate-600 font-medium">📅 Deadline:</span>
                                                                <span className="text-slate-700 font-semibold">
                                                                    {task.deadline instanceof Date
                                                                        ? task.deadline.toLocaleString()
                                                                        : new Date(task.deadline).toLocaleString()
                                                                    }
                                                                </span>
                                                            </div>
                                                            {deadlineStatus && !task.isCompleted && (
                                                                <span className={`bg-gradient-to-r ${deadlineStatus.colors} text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg`}>
                                                                    {deadlineStatus.text}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {task.isCompleted && task.completedAt && (
                                                            <div className="mt-2 text-sm text-green-600 font-medium">
                                                                ✓ Completed on {new Date(task.completedAt.seconds * 1000).toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap items-center gap-3">
                                                    <button
                                                        onClick={() => handleToggleTaskCompletion(task.id)}
                                                        className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl ${
                                                            task.isCompleted
                                                                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                                                                : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                                                        }`}
                                                    >
                                                        <span>{task.isCompleted ? "✅" : "⭕"}</span>
                                                        <span>{task.isCompleted ? "Completed" : "Mark Complete"}</span>
                                                    </button>

                                                    <button
                                                        onClick={() => handleLikeTask(task.id)}
                                                        className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl ${
                                                            currentUser && task.likes?.includes(currentUser.uid)
                                                                ? "bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white"
                                                                : "bg-gradient-to-r from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 text-white"
                                                        }`}
                                                        disabled={!currentUser}
                                                    >
                                                        <span>🌟</span>
                                                        <span>Priority: {task.likeCount || 0}</span>
                                                    </button>

                                                    <button
                                                        onClick={() => toggleComments(task.id)}
                                                        className="flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                                                    >
                                                        <span>💬</span>
                                                        <span>
                                                            {expandedComments.has(task.id)
                                                                ? "Hide Comments"
                                                                : "Add Comments"}
                                                        </span>
                                                    </button>

                                                    {task.updatedAt && (
                                                        <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                                            ✏️ Edited {task.updatedAt.toDate
                                                            ? task.updatedAt.toDate().toLocaleDateString()
                                                            : "Unknown"}
                                                        </span>
                                                    )}
                                                </div>

                                                {expandedComments.has(task.id) && (
                                                    <div className="mt-6 p-4 bg-white/60 rounded-2xl border border-sky-100">
                                                        <CommentCRUD
                                                            currentUser={currentUser}
                                                            currentUserData={currentUserData}
                                                            postId={task.id}
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-12 border border-sky-200 shadow-xl text-center">
                            <div className="text-8xl mb-6">📝</div>
                            <h3 className="text-2xl font-bold text-slate-700 mb-4">No Tasks Yet!</h3>
                            <p className="text-slate-600 text-lg mb-6">
                                Create your first task to get started on your productivity journey! ✨
                            </p>
                            <div className="flex justify-center space-x-2 text-2xl animate-bounce">
                                <span>🚀</span>
                                <span>💪</span>
                                <span>🎯</span>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-12 border border-sky-200 shadow-xl text-center">
                        <div className="text-8xl mb-6">🔐</div>
                        <h3 className="text-2xl font-bold text-slate-700 mb-4">Login Required</h3>
                        <p className="text-slate-600 text-lg">
                            Please log in to view and manage your tasks! 🌟
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TaskCRUD;