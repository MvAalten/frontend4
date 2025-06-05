import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { initializeApp } from "firebase/app";

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
        <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-4">Users & Passwords</h1>
            <ul className="bg-white rounded-xl shadow-md p-4 w-full max-w-md space-y-2">
                {users.length > 0 ? (
                    users.map((user, index) => (
                        <li key={index} className="text-gray-800 border-b last:border-b-0 pb-1">
                            <strong>{user.username}</strong>: {user.password}
                        </li>
                    ))
                ) : (
                    <li className="text-gray-500">No users found.</li>
                )}
            </ul>
        </div>
    );
}

export default App;
