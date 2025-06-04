import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.jsx";
import { FaHeart, FaComment, FaShare, FaPlus } from "react-icons/fa";

export default function UserCard({ refreshTrigger }) {
    const [tasks, setTaskList] = useState();

    const fetchTasks = async () => {
        try {
            const getCollectionData = collection(db, "tasks");
            const data = await getDoc(getCollectionData);
            setTaskList(data.docs.map((doc) =>({ ...doc.data(), id: doc._id })));
        } catch (error) {
            console.error("Error getting tasks", error);
        }
    };
    return (
        <div className="relative w-full max-w-[500px] aspect-[9/16] bg-[#40434E] rounded-2xl overflow-hidden shadow-lg">
            {/* Overlay Text */}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 text-center">
                <p className="text-lg sm:text-xl">{userName || "Loading..."}</p>
            </div>

            {/* Video Info */}
            <div className="absolute bottom-28 left-6 text-sm sm:text-base space-y-1 w-2/3">
                <p className="font-bold">@fitbeast</p>
                <p>“No excuses. Just results.”</p>
            </div>

            {/* Social Buttons */}
            <div className="absolute bottom-12 right-6 flex flex-col items-center gap-4">
                <button className="text-[#FF6B6B] text-xl sm:text-2xl hover:scale-110 transition-transform">
                    <FaHeart />
                </button>
                <button className="text-[#B9CFD4] text-xl sm:text-2xl hover:scale-110 transition-transform">
                    <FaComment />
                </button>
                <button className="text-[#B9CFD4] text-xl sm:text-2xl hover:scale-110 transition-transform">
                    <FaShare />
                </button>
                <button className="mt-4 bg-[#FF6B6B] p-4 rounded-full text-white text-sm sm:text-base font-bold hover:scale-110 transition-transform">
                    <FaPlus />
                </button>
            </div>
        </div>
    );
}
