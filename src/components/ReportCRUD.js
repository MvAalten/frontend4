import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../App";

function ReportCRUD() {
    const [newReport, setNewReport] = useState({ title: '', content: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleCreateReport = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!newReport.title.trim() || !newReport.content.trim()) {
            setMessage("Please fill in both title and content");
            return;
        }

        setLoading(true);

        try {
            await addDoc(collection(db, "reports"), {
                title: newReport.title,
                content: newReport.content,
                createdAt: new Date(),
            });

            setNewReport({ title: '', content: '' });
            setMessage("Report submitted successfully!");

        } catch (error) {
            console.error("Error creating report:", error);
            setMessage("Error submitting report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-red-400">Submit Report</h2>

                <form onSubmit={handleCreateReport} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            placeholder="Report title..."
                            value={newReport.title}
                            onChange={(e) => setNewReport({...newReport, title: e.target.value})}
                            className="w-full p-3 bg-gray-700 text-white rounded"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Content
                        </label>
                        <textarea
                            placeholder="Report details..."
                            value={newReport.content}
                            onChange={(e) => setNewReport({...newReport, content: e.target.value})}
                            className="w-full p-3 bg-gray-700 text-white rounded h-32 resize-none"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-6 py-2 rounded font-semibold"
                    >
                        {loading ? "Submitting..." : "Submit Report"}
                    </button>
                </form>

                {message && (
                    <div className="mt-4 p-3 bg-gray-700 rounded text-white">
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReportCRUD;