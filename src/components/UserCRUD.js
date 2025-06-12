import React, { useEffect, useState } from "react";
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../App";

function UserCRUD({ currentUser }) {
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ username: '', email: '' });

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
            const userList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(userList);
        });
        return () => unsubscribe();
    }, []);

    const handleEditUser = (user) => {
        setEditingUser(user.id);
        setEditForm({ username: user.username, email: user.email });
    };

    const handleUpdateUser = async (userId) => {
        try {
            await updateDoc(doc(db, "users", userId), editForm);
            setEditingUser(null);
            alert("User updated successfully!");
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Error updating user");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await deleteDoc(doc(db, "users", userId));
                alert("User deleted successfully!");
            } catch (error) {
                console.error("Error deleting user:", error);
                alert("Error deleting user");
            }
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-4 text-purple-400">User Management</h2>
            <div className="space-y-3">
                {users.map((user) => (
                    <div key={user.id} className="bg-gray-700 p-3 rounded flex justify-between items-center">
                        {editingUser === user.id ? (
                            <div className="flex-1 space-y-2">
                                <input
                                    type="text"
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                                    className="w-full p-2 bg-gray-600 text-white rounded"
                                    placeholder="Username"
                                />
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                    className="w-full p-2 bg-gray-600 text-white rounded"
                                    placeholder="Email"
                                />
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleUpdateUser(user.id)}
                                        className="bg-green-600 px-3 py-1 rounded text-sm"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditingUser(null)}
                                        className="bg-gray-600 px-3 py-1 rounded text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <p className="font-semibold">@{user.username}</p>
                                    <p className="text-sm text-gray-300">{user.email}</p>
                                    {currentUser && currentUser.uid === user.id && (
                                        <span className="text-xs bg-green-600 px-2 py-1 rounded">You</span>
                                    )}
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEditUser(user)}
                                        className="bg-blue-600 px-3 py-1 rounded text-sm"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="bg-red-600 px-3 py-1 rounded text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default UserCRUD;