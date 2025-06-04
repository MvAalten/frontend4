import React from "react";
import VideoCard from "../components/VideoCard.jsx";

const ExplorePage = () => {
    const posts = [
        { id: 1, title: "Leg Day Motivation", imgSrc: "/path/to/image1.jpg" },
        { id: 2, title: "Upper Body Workout", imgSrc: "/path/to/image2.jpg" },
        { id: 3, title: "HIIT Session", imgSrc: "/path/to/image3.jpg" },
        { id: 4, title: "Strength Training", imgSrc: "/path/to/image4.jpg" },
        // Add more if needed
    ];

    return (
        <div className="bg-[#1E1E1E] min-h-screen flex flex-col">
            <div className="text-center p-6">
                <h1 className="text-4xl font-bold text-white">Explore New Workout Content</h1>
                <p className="text-lg text-gray-400">Discover the latest workout videos and more!</p>
            </div>
            {/* Scrollable Video Feed */}
            <div className="flex-1 overflow-y-auto px-6 pb-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {posts.map((post) => (
                        <VideoCard
                            key={post.id}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExplorePage;
