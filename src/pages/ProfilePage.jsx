import React from "react";

const ProfilePage = () => {
    return (
        <div className="flex flex-col items-center w-full p-6">
            {/* Profile Header */}
            <div className="text-center mb-6">
                <img
                    src="https://via.placeholder.com/150" // Placeholder for profile picture
                    alt="Profile"
                    className="w-32 h-32 rounded-full mb-4"
                />
                <h2 className="text-3xl font-bold">@fitbeast</h2>
                <p className="text-lg text-gray-400">"No excuses. Just results."</p>
            </div>

            {/* Profile Content */}
            <div className="w-full">
                <h3 className="text-xl font-bold mb-4">Uploaded Videos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Placeholder for uploaded videos */}
                    <div className="bg-[#40434E] p-4 rounded-lg shadow-md">
                        <div className="h-40 bg-black mb-4 rounded-lg"></div>
                        <p className="text-center text-lg font-semibold">Workout Video 1</p>
                    </div>
                    <div className="bg-[#40434E] p-4 rounded-lg shadow-md">
                        <div className="h-40 bg-black mb-4 rounded-lg"></div>
                        <p className="text-center text-lg font-semibold">Workout Video 2</p>
                    </div>
                    <div className="bg-[#40434E] p-4 rounded-lg shadow-md">
                        <div className="h-40 bg-black mb-4 rounded-lg"></div>
                        <p className="text-center text-lg font-semibold">Workout Video 3</p>
                    </div>
                </div>
            </div>

            {/* Follow/Message/Other Profile Options */}
            <div className="mt-8 flex gap-4">
                <button className="bg-[#FF6B6B] text-white py-2 px-6 rounded-full font-semibold hover:bg-[#FF4F4F] transition">
                    Follow
                </button>
                <button className="bg-[#B9CFD4] text-black py-2 px-6 rounded-full font-semibold hover:bg-[#A2BCC5] transition">
                    Message
                </button>
            </div>
        </div>
    );
};

export default ProfilePage;
