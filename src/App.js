import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import UpdateProfile from "./components/UpdateProfile";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDIab5pd5vj0hSCa1AisTB1Cy1t2t-Ngbk",
    authDomain: "l2p4frontend.firebaseapp.com",
    projectId: "l2p4frontend",
    storageBucket: "l2p4frontend.appspot.com",
    messagingSenderId: "439165311953",
    appId: "1:439165311953:web:3d5465838296978009def0",
    measurementId: "G-MH08GCCV0P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "users"));
                const userList = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        username: data.username || "No username",
                        password: data.password || "No password"
                    };
                });
                setUsers(userList);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-4 text-center">Users & Passwords</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl shadow-md p-4">
                        <h2 className="text-xl font-semibold mb-4">Current Users</h2>
                        <ul className="space-y-2">
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <li key={user.id} className="text-gray-800 border-b last:border-b-0 pb-2">
                                        <strong>{user.username}</strong>: {user.password}
                                    </li>
                                ))
                            ) : (
                                <li className="text-gray-500">No users found.</li>
                            )}
                        </ul>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4">
                        <UpdateProfile />
                    </div>
                </div>
            </div>
            <button
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={() => {
                    import("./components/GoogleAuth");
                }}
            >
                Login with google
            </button>

        </div>
    );
}

export default App;
