import React, { useState } from "react";

const UploadPage = () => {
    const [videoFile, setVideoFile] = useState(null);

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) setVideoFile(file);
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full p-6 bg-[#1E1E1E] text-white">
            <h1 className="text-3xl font-bold mb-4">Upload Your Workout Video</h1>
            <p className="text-lg text-gray-400 mb-8">
                Share your workout videos with the GymTok community.
            </p>

            <div className="bg-[#40434E] p-6 rounded-lg shadow-lg w-full max-w-lg">
                <div className="text-center mb-6">
                    <label htmlFor="video-upload" className="text-lg font-semibold text-[#FF6B6B] cursor-pointer">
                        Choose a video file to upload
                    </label>
                    <input
                        type="file"
                        id="video-upload"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                {videoFile && (
                    <div className="text-center mb-6">
                        <p className="text-lg text-white">Selected File: {videoFile.name}</p>
                    </div>
                )}

                <button
                    onClick={() => {}}
                    className="w-full bg-[#FF6B6B] py-2 rounded-full text-white font-bold hover:bg-[#FF4F4F] transition"
                    disabled={!videoFile}
                >
                    Upload Video
                </button>
            </div>
        </div>
    );
};

export default UploadPage;
