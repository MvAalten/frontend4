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
    }, [currentUser]); // Re-run when currentUser changes

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
            return { status: "overdue", text: `${Math.abs(daysDiff)} days overdue`, color: "#DC2626" };
        } else if (daysDiff === 0) {
            return { status: "today", text: "Due today", color: "#FF6B6B" };
        } else if (daysDiff <= 3) {
            return { status: "soon", text: `Due in ${daysDiff} days`, color: "#F59E0B" };
        } else {
            return { status: "upcoming", text: `Due in ${daysDiff} days`, color: "#10B981" };
        }
    };

    return (
        <div className="space-y-6 mt-8">
            {/* Debug Info */}
            <div className="bg-gray-900 p-2 rounded text-xs text-gray-400">
                Debug: User: {currentUser ? "✓" : "✗"} | UserData:{" "}
                {currentUserData ? "✓" : "✗"} | Tasks: {tasks.length} | Loading:{" "}
                {isUserDataLoading ? "✓" : "✗"}
            </div>

            {/* Create Task Form */}
            {currentUser ? (
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-xl font-bold mb-4" style={{ color: "#FF6B6B" }}>
                        ✅ Create New Task
                    </h2>

                    {isUserDataLoading && (
                        <div
                            className="p-3 rounded mb-4 text-red-200"
                            style={{ backgroundColor: "#FF6B6B" }}
                        >
                            Loading user data... You can still create tasks!
                        </div>
                    )}

                    <form onSubmit={handleCreateTask} className="space-y-3">
                        <input
                            type="text"
                            placeholder="Task title..."
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            className="w-full p-3 bg-gray-700 text-white rounded"
                            required
                            disabled={isSubmitting}
                        />

                        <textarea
                            placeholder="Task description..."
                            value={newTask.content}
                            onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
                            className="w-full p-3 bg-gray-700 text-white rounded h-24 resize-none"
                            required
                            disabled={isSubmitting}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Deadline
                            </label>
                            <input
                                type="datetime-local"
                                value={newTask.deadline}
                                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                                className="w-full p-3 bg-gray-700 text-white rounded"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <button
                            type="submit"
                            className="px-4 py-2 rounded font-semibold disabled:opacity-50"
                            style={{
                                backgroundColor: "#FF6B6B",
                                color: "white",
                            }}
                            disabled={isSubmitting}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = "#E55A5A")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = "#FF6B6B")
                            }
                        >
                            {isSubmitting ? "Creating..." : "Create Task"}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <p className="text-gray-400">
                        Please log in to create and manage your tasks.
                    </p>
                </div>
            )}

            {/* Tasks Feed */}
            <div className="space-y-4">
                {currentUser ? (
                    tasks.length > 0 ? (
                        tasks.map((task) => {
                            const deadlineStatus = getDeadlineStatus(task.deadline);

                            return (
                                <div key={task.id} className={`bg-gray-800 p-4 rounded-lg border-l-4 ${
                                    task.isCompleted ? "border-green-500" : "border-yellow-500"
                                }`}>
                                    {editingTask === task.id ? (
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={editForm.title}
                                                onChange={(e) =>
                                                    setEditForm({ ...editForm, title: e.target.value })
                                                }
                                                className="w-full p-2 bg-gray-700 text-white rounded"
                                                required
                                            />
                                            <textarea
                                                value={editForm.content}
                                                onChange={(e) =>
                                                    setEditForm({ ...editForm, content: e.target.value })
                                                }
                                                className="w-full p-2 bg-gray-700 text-white rounded h-20 resize-none"
                                                required
                                            />
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Deadline
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={editForm.deadline}
                                                    onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                                                    className="w-full p-2 bg-gray-700 text-white rounded"
                                                    required
                                                />
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleUpdateTask(task.id)}
                                                    className="px-3 py-1 rounded text-sm"
                                                    style={{
                                                        backgroundColor: "#FF6B6B",
                                                        color: "white",
                                                    }}
                                                    onMouseEnter={(e) =>
                                                        (e.currentTarget.style.backgroundColor = "#E55A5A")
                                                    }
                                                    onMouseLeave={(e) =>
                                                        (e.currentTarget.style.backgroundColor = "#FF6B6B")
                                                    }
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingTask(null)}
                                                    className="px-3 py-1 rounded text-sm"
                                                    style={{
                                                        backgroundColor: "#6B7280",
                                                        color: "white",
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center space-x-3">
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-lg">
                                                                {task.isCompleted ? "✅" : "⏰"}
                                                            </span>
                                                            <h3
                                                                className="font-bold"
                                                                style={{ color: "#FF6B6B" }}
                                                            >
                                                                @{task.authorUsername}
                                                            </h3>
                                                            <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                                                                Task
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-400">
                                                            {task.createdAt
                                                                ? task.createdAt.toLocaleDateString()
                                                                : "Unknown date"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEditTask(task)}
                                                        className="px-3 py-1 rounded text-sm"
                                                        style={{
                                                            backgroundColor: "#FF6B6B",
                                                            color: "white",
                                                        }}
                                                        onMouseEnter={(e) =>
                                                            (e.currentTarget.style.backgroundColor =
                                                                "#E55A5A")
                                                        }
                                                        onMouseLeave={(e) =>
                                                            (e.currentTarget.style.backgroundColor =
                                                                "#FF6B6B")
                                                        }
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTask(task.id)}
                                                        className="px-3 py-1 rounded text-sm"
                                                        style={{
                                                            backgroundColor: "#DC2626",
                                                            color: "white",
                                                        }}
                                                        onMouseEnter={(e) =>
                                                            (e.currentTarget.style.backgroundColor =
                                                                "#B91C1C")
                                                        }
                                                        onMouseLeave={(e) =>
                                                            (e.currentTarget.style.backgroundColor =
                                                                "#DC2626")
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>

                                            <h4 className={`text-lg font-semibold mb-2 ${
                                                task.isCompleted ? "line-through text-gray-500" : "text-white"
                                            }`}>
                                                {task.title}
                                            </h4>

                                            <p className={`mb-4 ${
                                                task.isCompleted ? "line-through text-gray-500" : "text-gray-200"
                                            }`}>
                                                {task.content}
                                            </p>

                                            {task.deadline && (
                                                <div className="mb-4">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm text-gray-400">Deadline:</span>
                                                        <span
                                                            className="text-sm font-medium px-2 py-1 rounded"
                                                            style={{
                                                                backgroundColor: deadlineStatus?.color + "20",
                                                                color: deadlineStatus?.color
                                                            }}
                                                        >
                                                            {task.deadline instanceof Date
                                                                ? task.deadline.toLocaleString()
                                                                : new Date(task.deadline).toLocaleString()
                                                            }
                                                        </span>
                                                        {deadlineStatus && !task.isCompleted && (
                                                            <span
                                                                className="text-xs px-2 py-1 rounded font-medium"
                                                                style={{
                                                                    backgroundColor: deadlineStatus.color,
                                                                    color: "white"
                                                                }}
                                                            >
                                                                {deadlineStatus.text}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {task.isCompleted && task.completedAt && (
                                                        <div className="text-xs text-green-400 mt-1">
                                                            ✓ Completed on {new Date(task.completedAt.seconds * 1000).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center space-x-4">
                                                <button
                                                    onClick={() => handleToggleTaskCompletion(task.id)}
                                                    className={`flex items-center space-x-2 px-3 py-1 rounded font-medium`}
                                                    style={{
                                                        backgroundColor: task.isCompleted ? "#10B981" : "#F59E0B",
                                                        color: "white",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor =
                                                            task.isCompleted ? "#059669" : "#D97706";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor =
                                                            task.isCompleted ? "#10B981" : "#F59E0B";
                                                    }}
                                                >
                                                    <span>{task.isCompleted ? "✓" : "○"}</span>
                                                    <span>{task.isCompleted ? "Completed" : "Mark Complete"}</span>
                                                </button>

                                                <button
                                                    onClick={() => handleLikeTask(task.id)}
                                                    className={`flex items-center space-x-2 px-3 py-1 rounded`}
                                                    style={{
                                                        backgroundColor:
                                                            currentUser && task.likes?.includes(currentUser.uid)
                                                                ? "#FF6B6B"
                                                                : "#4B5563",
                                                        color:
                                                            currentUser && task.likes?.includes(currentUser.uid)
                                                                ? "white"
                                                                : "#D1D5DB",
                                                    }}
                                                    disabled={!currentUser}
                                                    onMouseEnter={(e) => {
                                                        if (
                                                            currentUser &&
                                                            task.likes?.includes(currentUser.uid)
                                                        ) {
                                                            e.currentTarget.style.backgroundColor =
                                                                "#E55A5A";
                                                        } else {
                                                            e.currentTarget.style.backgroundColor =
                                                                "#6B7280";
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (
                                                            currentUser &&
                                                            task.likes?.includes(currentUser.uid)
                                                        ) {
                                                            e.currentTarget.style.backgroundColor =
                                                                "#FF6B6B";
                                                        } else {
                                                            e.currentTarget.style.backgroundColor =
                                                                "#4B5563";
                                                        }
                                                    }}
                                                >
                                                    <span>Priority:</span>
                                                    <span>{task.likeCount || 0}</span>
                                                </button>

                                                <button
                                                    onClick={() => toggleComments(task.id)}
                                                    className="flex items-center space-x-2 px-3 py-1 rounded text-white"
                                                    style={{ backgroundColor: "#FF6B6B" }}
                                                    onMouseEnter={(e) =>
                                                        (e.currentTarget.style.backgroundColor = "#E55A5A")
                                                    }
                                                    onMouseLeave={(e) =>
                                                        (e.currentTarget.style.backgroundColor = "#FF6B6B")
                                                    }
                                                >
                                                    <span>
                                                        {expandedComments.has(task.id)
                                                            ? "Hide Comments"
                                                            : "Add Comments"}
                                                    </span>
                                                </button>

                                                {task.updatedAt && (
                                                    <span className="text-xs text-gray-500">
                                                        (edited{" "}
                                                        {task.updatedAt.toDate
                                                            ? task.updatedAt.toDate().toLocaleString()
                                                            : "Unknown"}
                                                        )
                                                    </span>
                                                )}
                                            </div>

                                            {expandedComments.has(task.id) && (
                                                <CommentCRUD
                                                    currentUser={currentUser}
                                                    currentUserData={currentUserData}
                                                    postId={task.id}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center text-gray-400 py-8">
                            No tasks yet. Create your first task to get started!
                        </div>
                    )
                ) : (
                    <div className="text-center text-gray-400 py-8">
                        Please log in to view and manage your tasks.
                    </div>
                )}
            </div>
        </div>
    );
}

export default TaskCRUD;