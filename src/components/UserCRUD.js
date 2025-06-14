import React, { useEffect, useState } from "react";
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../App";

function UserCRUD({ currentUser }) {
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ username: '', email: '', role: 'user' });

    // Define available roles
    const ROLES = {
        ADMIN: 'admin',
        USER: 'user'
    };

    // Get current user's role
    const getCurrentUserRole = () => {
        if (!currentUser) return null;
        const currentUserData = users.find(user => user.id === currentUser.uid);
        return currentUserData?.role || 'user';
    };

    // Check if current user can perform admin actions
    const canManageUsers = () => {
        const currentRole = getCurrentUserRole();
        return currentRole === ROLES.ADMIN;
    };

    // Check if current user can edit a specific user
    const canEditUser = (targetUser) => {
        if (!currentUser) return false;

        const currentRole = getCurrentUserRole();

        // Admins can edit anyone
        if (currentRole === ROLES.ADMIN) return true;

        // Users can only edit themselves
        return currentUser.uid === targetUser.id;
    };

    // Check if current user can delete a specific user
    const canDeleteUser = (targetUser) => {
        if (!currentUser) return false;

        const currentRole = getCurrentUserRole();

        // Only admins can delete users
        if (currentRole !== ROLES.ADMIN) return false;

        // Admins cannot delete themselves
        return currentUser.uid !== targetUser.id;
    };

    // Check if current user can change roles
    const canChangeRole = () => {
        return getCurrentUserRole() === ROLES.ADMIN;
    };

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
        if (!canEditUser(user)) {
            alert("You don't have permission to edit this user.");
            return;
        }

        setEditingUser(user.id);
        setEditForm({
            username: user.username,
            email: user.email,
            role: user.role || 'user'
        });
    };

    const handleUpdateUser = async (userId) => {
        try {
            const updateData = {
                username: editForm.username,
                email: editForm.email
            };

            // Only include role if user can change roles
            if (canChangeRole()) {
                updateData.role = editForm.role;
            }

            await updateDoc(doc(db, "users", userId), updateData);
            setEditingUser(null);
            alert("User updated successfully!");
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Error updating user");
        }
    };

    const handleDeleteUser = async (userId) => {
        const userToDelete = users.find(user => user.id === userId);

        if (!canDeleteUser(userToDelete)) {
            alert("You don't have permission to delete this user.");
            return;
        }

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

    const getRoleColor = (role) => {
        switch (role) {
            case ROLES.ADMIN:
                return 'bg-red-600';
            default:
                return 'bg-gray-600';
        }
    };

    const getRoleLabel = (role) => {
        return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-4 text-purple-400">User Management</h2>

            {/* Display current user's permissions */}
            <div className="mb-4 p-3 bg-gray-700 rounded">
                <p className="text-sm text-gray-300">
                    Your role: <span className={`px-2 py-1 rounded text-xs ${getRoleColor(getCurrentUserRole())}`}>
                        {getRoleLabel(getCurrentUserRole())}
                    </span>
                </p>
                {!canManageUsers() && (
                    <p className="text-xs text-yellow-400 mt-1">
                        You can only edit your own profile. Contact an admin for role changes.
                    </p>
                )}
            </div>

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
                                {canChangeRole() && (
                                    <select
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                                        className="w-full p-2 bg-gray-600 text-white rounded"
                                    >
                                        <option value={ROLES.USER}>user</option>
                                        <option value={ROLES.ADMIN}>admin</option>
                                    </select>
                                )}
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleUpdateUser(user.id)}
                                        className="bg-green-600 px-3 py-1 rounded text-sm hover:bg-green-700"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditingUser(null)}
                                        className="bg-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <p className="font-semibold">@{user.username}</p>
                                        <span className={`text-xs px-2 py-1 rounded ${getRoleColor(user.role)}`}>
                                            {getRoleLabel(user.role)}
                                        </span>
                                        {currentUser && currentUser.uid === user.id && (
                                            <span className="text-xs bg-green-600 px-2 py-1 rounded">You</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-300">{user.email}</p>
                                </div>
                                <div className="flex space-x-2">
                                    {canEditUser(user) && (
                                        <button
                                            onClick={() => handleEditUser(user)}
                                            className="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-700"
                                        >
                                            Edit
                                        </button>
                                    )}
                                    {canDeleteUser(user) && (
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="bg-red-600 px-3 py-1 rounded text-sm hover:bg-red-700"
                                        >
                                            Delete
                                        </button>
                                    )}
                                    {!canEditUser(user) && !canDeleteUser(user) && currentUser?.uid !== user.id && (
                                        <span className="text-xs text-gray-500 px-3 py-1">No actions available</span>
                                    )}
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