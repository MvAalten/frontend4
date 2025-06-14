import React, { useState, useEffect } from 'react';
import { collection, getDocs} from 'firebase/firestore';
import { db } from '../App';

function RandomChallenge() {
    const [currentChallenge, setCurrentChallenge] = useState(null);
    const [loading, setLoading] = useState(false);
    const [allChallenges, setAllChallenges] = useState([]);
    const [error, setError] = useState(null);

    // Load all challenges once on component mount
    useEffect(() => {
        loadAllChallenges();
    }, []);

    const loadAllChallenges = async () => {
        try {
            setLoading(true);
            setError(null); // Clear any previous errors

            const challengesRef = collection(db, 'challanges');
            const snapshot = await getDocs(challengesRef);

            const challengesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log('Raw challenges data:', challengesList); // Debug log
            setAllChallenges(challengesList);

            // Set initial random challenge if challenges exist
            if (challengesList.length > 0) {
                const randomIndex = Math.floor(Math.random() * challengesList.length);
                setCurrentChallenge(challengesList[randomIndex]);
                console.log('Initial random challenge set:', challengesList[randomIndex]);
            } else {
                console.log('No challenges found in database');
                setError('No challenges found in the database');
            }

            console.log(`Loaded ${challengesList.length} challenges`);
        } catch (err) {
            console.error('Error loading challenges:', err);
            setError(`Failed to load challenges: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getRandomChallenge = async () => {
        console.log('getRandomChallenge called, allChallenges length:', allChallenges.length);

        if (allChallenges.length === 0) {
            setError('No challenges available');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Add a small delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 200));

            // Simple random selection from loaded challenges
            const randomIndex = Math.floor(Math.random() * allChallenges.length);
            const randomChallenge = allChallenges[randomIndex];

            console.log('Random index:', randomIndex);
            console.log('Selected random challenge:', randomChallenge);

            setCurrentChallenge(randomChallenge);
        } catch (err) {
            console.error('Error selecting random challenge:', err);
            setError('Failed to select random challenge');
        } finally {
            setLoading(false);
        }
    };

    const refreshChallenges = async () => {
        setCurrentChallenge(null);
        await loadAllChallenges();
    };

    // Debug: Log current state
    console.log('Current state:', {
        currentChallenge,
        loading,
        allChallengesLength: allChallenges.length,
        error
    });

    if (error) {
        return (
            <div className="max-w-md mx-auto p-6 bg-red-900 border border-red-700 rounded-lg">
                <h2 className="text-xl font-bold text-red-300 mb-4">Error</h2>
                <p className="text-red-200 mb-4">{error}</p>
                <button
                    onClick={refreshChallenges}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold"
                >
                    Try Again
                </button>
                <div className="mt-4 text-sm text-red-300">
                    <p>Debug info:</p>
                    <p>Challenges loaded: {allChallenges.length}</p>
                    <p>Current challenge: {currentChallenge ? 'Yes' : 'No'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto p-6 bg-gray-800 border border-gray-700 rounded-lg">
            <h2 className="text-2xl font-bold text-purple-400 mb-6 text-center">
                Random Challenge
            </h2>



            {/* Challenge Display */}
            <div className="mb-6 min-h-[200px] flex items-center justify-center">
                {loading ? (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading challenge...</p>
                    </div>
                ) : currentChallenge ? (
                    <div className="bg-gray-700 p-6 rounded-lg w-full">


                        {/* Display challenge text directly */}
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">
                                {currentChallenge.amount} {currentChallenge.exercise}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-400">
                        <p className="mb-4">No challenge selected</p>
                        <p className="text-sm">Click "Get Random Challenge" to start!</p>
                        {allChallenges.length === 0 && (
                            <p className="text-red-400 text-sm mt-2">
                                No challenges available to display
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={getRandomChallenge}
                    disabled={loading || allChallenges.length === 0}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                    {loading ? 'Loading...' : 'Get Random Challenge'}
                </button>

                <button
                    onClick={refreshChallenges}
                    disabled={loading}
                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    title="Refresh challenges list"
                >
                    🔄
                </button>
            </div>

            {/* Stats */}
            <div className="mt-4 text-center text-sm text-gray-400">
                {allChallenges.length > 0 && (
                    <p>Total challenges available: {allChallenges.length}</p>
                )}
            </div>
        </div>
    );
}

export default RandomChallenge;