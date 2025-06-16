import React, { useState, useEffect } from 'react';
import { collection, getDocs} from 'firebase/firestore';
import { db } from '../App';

function RandomChallenge() {
    const [currentChallenge, setCurrentChallenge] = useState(null);
    const [loading, setLoading] = useState(false);
    const [allChallenges, setAllChallenges] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadAllChallenges();
    }, []);

    const loadAllChallenges = async () => {
        try {
            setLoading(true);
            setError(null);

            const challengesRef = collection(db, 'challanges');
            const snapshot = await getDocs(challengesRef);

            const challengesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setAllChallenges(challengesList);

            if (challengesList.length > 0) {
                const randomIndex = Math.floor(Math.random() * challengesList.length);
                setCurrentChallenge(challengesList[randomIndex]);
            } else {
                setError('No challenges found in the database');
            }
        } catch (err) {
            setError(`Failed to load challenges: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getRandomChallenge = async () => {
        if (allChallenges.length === 0) {
            setError('No challenges available');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 200));
            const randomIndex = Math.floor(Math.random() * allChallenges.length);
            setCurrentChallenge(allChallenges[randomIndex]);
        } catch {
            setError('Failed to select random challenge');
        } finally {
            setLoading(false);
        }
    };

    const refreshChallenges = async () => {
        setCurrentChallenge(null);
        await loadAllChallenges();
    };

    if (error) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1E1E1E', // Charcoal Black page background
                    padding: '1rem'
                }}
            >
                <div
                    style={{
                        maxWidth: '28rem',
                        width: '100%',
                        padding: '1.5rem',
                        backgroundColor: '#40434E', // Dark Slate
                        border: '1px solid #B9CFD4', // Sky Mist border
                        borderRadius: '0.5rem',
                        color: '#F5F7FA' // Arctic White text
                    }}
                >
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', color: '#FF6B6B' }}>
                        Error
                    </h2>
                    <p style={{ marginBottom: '1rem' }}>{error}</p>
                    <button
                        onClick={refreshChallenges}
                        style={{
                            backgroundColor: '#FF6B6B', // Coral Energy
                            color: '#F5F7FA',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e85a5a')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FF6B6B')}
                    >
                        Try Again
                    </button>
                    <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#B9CFD4' }}>
                        <p>Debug info:</p>
                        <p>Challenges loaded: {allChallenges.length}</p>
                        <p>Current challenge: {currentChallenge ? 'Yes' : 'No'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1E1E1E', // Charcoal Black page background
                padding: '1rem',
            }}
        >
            <div
                style={{
                    maxWidth: '32rem',
                    width: '100%',
                    padding: '1.5rem',
                    backgroundColor: '#1E1E1E', // Charcoal Black container background
                    border: '1px solid #B9CFD4', // Sky Mist border
                    borderRadius: '0.5rem',
                    color: '#F5F7FA', // Arctic White text
                    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                }}
            >
                <h2
                    style={{
                        fontSize: '1.75rem',
                        fontWeight: '700',
                        margin: 0,
                        textAlign: 'center',
                        color: '#FF6B6B', // Coral Energy
                    }}
                >
                    Random Challenge
                </h2>

                {/* Challenge Display */}
                <div
                    style={{
                        minHeight: '200px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#40434E', // Dark Slate
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                    }}
                >
                    {loading ? (
                        <div style={{ textAlign: 'center', color: '#B9CFD4' }}>
                            <div
                                style={{
                                    borderTop: '4px solid #FF6B6B',
                                    borderRight: '4px solid transparent',
                                    borderRadius: '50%',
                                    width: '48px',
                                    height: '48px',
                                    margin: '0 auto 1rem',
                                    animation: 'spin 1s linear infinite',
                                }}
                            />
                            <p>Loading challenge...</p>
                        </div>
                    ) : currentChallenge ? (
                        <div
                            style={{
                                backgroundColor: '#1E1E1E', // Charcoal Black
                                padding: '1.5rem',
                                borderRadius: '0.5rem',
                                width: '100%',
                                color: '#F5F7FA',
                                textAlign: 'center',
                                boxShadow: 'inset 0 0 10px rgba(255,107,107,0.5)',
                            }}
                        >
                            <p style={{ fontSize: '1.75rem', fontWeight: '700' }}>
                                {currentChallenge.amount} {currentChallenge.exercise}
                            </p>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#B9CFD4' }}>
                            <p style={{ marginBottom: '1rem' }}>No challenge selected</p>
                            <p style={{ fontSize: '0.875rem' }}>Click "Get Random Challenge" to start!</p>
                            {allChallenges.length === 0 && (
                                <p style={{ color: '#FF6B6B', marginTop: '0.5rem' }}>
                                    No challenges available to display
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={getRandomChallenge}
                        disabled={loading || allChallenges.length === 0}
                        style={{
                            flex: 1,
                            backgroundColor:
                                loading || allChallenges.length === 0 ? '#40434E' : '#FF6B6B',
                            color: '#F5F7FA',
                            fontWeight: '600',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: loading || allChallenges.length === 0 ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                            if (!loading && allChallenges.length > 0)
                                e.currentTarget.style.backgroundColor = '#e85a5a';
                        }}
                        onMouseLeave={(e) => {
                            if (!loading && allChallenges.length > 0)
                                e.currentTarget.style.backgroundColor = '#FF6B6B';
                        }}
                    >
                        {loading ? 'Loading...' : 'Get Random Challenge'}
                    </button>

                    <button
                        onClick={refreshChallenges}
                        disabled={loading}
                        title="Refresh challenges list"
                        style={{
                            backgroundColor: loading ? '#40434E' : '#40434E',
                            color: '#F5F7FA',
                            fontWeight: '600',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.3s ease',
                            fontSize: '1.25rem',
                            lineHeight: 1,
                            userSelect: 'none',
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) e.currentTarget.style.backgroundColor = '#333a43';
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) e.currentTarget.style.backgroundColor = '#40434E';
                        }}
                    >
                        🔄
                    </button>
                </div>

                {/* Stats */}
                <div
                    style={{
                        marginTop: '1rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        color: '#B9CFD4',
                    }}
                >
                    {allChallenges.length > 0 && (
                        <p>Total challenges available: {allChallenges.length}</p>
                    )}
                </div>

                {/* Spinner animation */}
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg);}
                        100% { transform: rotate(360deg);}
                    }
                `}</style>
            </div>
        </div>
    );
}

export default RandomChallenge;
