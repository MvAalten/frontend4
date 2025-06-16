import React, { useEffect, useState } from "react";
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../App";

function UserCRUD({ currentUser }) {
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ username: '', email: '', role: 'user' });

    const ROLES = {
        ADMIN: 'admin',
        USER: 'user'
    };

    const getCurrentUserRole = () => {
        if (!currentUser) return null;
        const currentUserData = users.find(user => user.id === currentUser.uid);
        return currentUserData?.role || ROLES.USER;
    };

    const canManageUsers = () => getCurrentUserRole() === ROLES.ADMIN;

    const canEditUser = (targetUser) => {
        const currentRole = getCurrentUserRole();
        return currentRole === ROLES.ADMIN || currentUser?.uid === targetUser.id;
    };

    const canDeleteUser = (targetUser) => {
        const currentRole = getCurrentUserRole();
        return currentRole === ROLES.ADMIN && currentUser?.uid !== targetUser.id;
    };

    const canChangeRole = () => getCurrentUserRole() === ROLES.ADMIN;

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
        if (!canEditUser(user)) return alert("You don't have permission to edit this user.");
        setEditingUser(user.id);
        setEditForm({
            username: user.username,
            email: user.email,
            role: user.role || ROLES.USER
        });
    };

    const handleUpdateUser = async (userId) => {
        try {
            const updateData = {
                username: editForm.username,
                email: editForm.email,
            };
            if (canChangeRole()) updateData.role = editForm.role;

            await updateDoc(doc(db, "users", userId), updateData);
            setEditingUser(null);
            alert("User updated successfully!");
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Error updating user.");
        }
    };

    const handleDeleteUser = async (userId) => {
        const userToDelete = users.find(user => user.id === userId);
        if (!canDeleteUser(userToDelete)) return alert("You don't have permission to delete this user.");
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await deleteDoc(doc(db, "users", userId));
                alert("User deleted successfully!");
            } catch (error) {
                console.error("Error deleting user:", error);
                alert("Error deleting user.");
            }
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case ROLES.ADMIN: return 'bg-[#FF6B6B] text-white';
            default: return 'bg-[#40434E] text-[#F5F7FA]';
        }
    };

    const getRoleLabel = (role) =>
        role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';

    return (
        <div className="bg-[#1E1E1E] p-4 rounded-xl border border-[#B9CFD4]/20 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-[#F5F7FA]">User Management</h2>

            <div className="mb-4 p-4 bg-[#40434E] rounded-lg border border-[#B9CFD4]/20">
                <p className="text-sm text-[#F5F7FA]">
                    Your role:
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${getRoleColor(getCurrentUserRole())}`}>
            {getRoleLabel(getCurrentUserRole())}
          </span>
                </p>
                {!canManageUsers() && (
                    <p className="text-xs text-yellow-400 mt-2">
                        You can only edit your own profile. Contact an admin for further changes.
                    </p>
                )}
            </div>

            <div className="space-y-4">
                {users.map((user) => (
                    <div
                        key={user.id}
                        className="bg-[#40434E] p-4 rounded-lg flex justify-between items-start border border-[#B9CFD4]/10"
                    >
                        {editingUser === user.id ? (
                            <div className="flex-1 space-y-3">
                                <input
                                    type="text"
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                    className="w-full p-2 rounded bg-[#1E1E1E] text-[#F5F7FA] border border-[#B9CFD4]/30"
                                    placeholder="Username"
                                />
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full p-2 rounded bg-[#1E1E1E] text-[#F5F7FA] border border-[#B9CFD4]/30"
                                    placeholder="Email"
                                />
                                {canChangeRole() && (
                                    <select
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                        className="w-full p-2 rounded bg-[#1E1E1E] text-[#F5F7FA] border border-[#B9CFD4]/30"
                                    >
                                        <option value={ROLES.USER}>User</option>
                                        <option value={ROLES.ADMIN}>Admin</option>
                                    </select>
                                )}
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleUpdateUser(user.id)}
                                        className="bg-[#FF6B6B] hover:brightness-110 text-white px-3 py-1 rounded text-sm shadow"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditingUser(null)}
                                        className="bg-[#1E1E1E] hover:bg-[#2A2A2A] text-[#F5F7FA] px-3 py-1 rounded text-sm border border-[#B9CFD4]/20"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold text-[#F5F7FA]">@{user.username}</p>
                                        <span className={`text-xs px-2 py-1 rounded ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                                        {currentUser?.uid === user.id && (
                                            <span className="text-xs bg-green-600 px-2 py-1 rounded text-white">You</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-[#B9CFD4]">{user.email}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {canEditUser(user) && (
                                        <button
                                            onClick={() => handleEditUser(user)}
                                            className="bg-[#B9CFD4] text-[#1E1E1E] px-3 py-1 rounded text-sm hover:brightness-110"
                                        >
                                            Edit
                                        </button>
                                    )}
                                    {canDeleteUser(user) && (
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="bg-[#FF6B6B] text-white px-3 py-1 rounded text-sm hover:brightness-110"
                                        >
                                            Delete
                                        </button>
                                    )}
                                    {!canEditUser(user) && !canDeleteUser(user) && currentUser?.uid !== user.id && (
                                        <span className="text-xs text-gray-400 px-3 py-1">No actions available</span>
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
