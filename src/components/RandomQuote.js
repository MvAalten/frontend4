import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../App';

function RandomQuote() {
    const [currentQuote, setCurrentQuote] = useState(null);
    const [loading, setLoading] = useState(false);
    const [allQuotes, setAllQuotes] = useState([]);
    const [filteredQuotes, setFilteredQuotes] = useState([]);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Quote categories
    const categories = [
        { value: 'all', label: 'All Quotes' },
        { value: 'motivational', label: 'Motivational' },
        { value: 'fitness', label: 'Fitness' },
        { value: 'inspirational', label: 'Inspirational' }
    ];

    useEffect(() => {
        loadAllQuotes();
    }, []);

    useEffect(() => {
        filterQuotes();
    }, [selectedCategory, allQuotes]);

    const loadAllQuotes = async () => {
        try {
            setLoading(true);
            setError(null);

            const quotesRef = collection(db, 'quotes');
            const snapshot = await getDocs(quotesRef);

            const quotesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setAllQuotes(quotesList);

            if (quotesList.length === 0) {
                setError('No quotes found in the database');
            }
        } catch (err) {
            setError(`Failed to load quotes: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const filterQuotes = () => {
        if (selectedCategory === 'all') {
            setFilteredQuotes(allQuotes);
        } else {
            const filtered = allQuotes.filter(quote =>
                quote.category && quote.category.toLowerCase() === selectedCategory.toLowerCase()
            );
            setFilteredQuotes(filtered);
        }

        // Reset current quote when filter changes
        setCurrentQuote(null);
    };

    const getRandomQuote = async () => {
        const quotesToUse = filteredQuotes.length > 0 ? filteredQuotes : allQuotes;

        if (quotesToUse.length === 0) {
            setError('No quotes available for the selected category');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 200));
            const randomIndex = Math.floor(Math.random() * quotesToUse.length);
            setCurrentQuote(quotesToUse[randomIndex]);
        } catch {
            setError('Failed to select random quote');
        } finally {
            setLoading(false);
        }
    };

    const refreshQuotes = async () => {
        setCurrentQuote(null);
        await loadAllQuotes();
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

    if (error) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}
            >
                <div
                    style={{
                        maxWidth: '28rem',
                        width: '100%',
                        padding: '1.5rem',
                        backgroundColor: '#40434E',
                        border: '1px solid #B9CFD4',
                        borderRadius: '0.5rem',
                        color: '#F5F7FA'
                    }}
                >
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', color: '#FF6B6B' }}>
                        Error
                    </h2>
                    <p style={{ marginBottom: '1rem' }}>{error}</p>
                    <button
                        onClick={refreshQuotes}
                        style={{
                            backgroundColor: '#FF6B6B',
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
                        <p>Quotes loaded: {allQuotes.length}</p>
                        <p>Current quote: {currentQuote ? 'Yes' : 'No'}</p>
                        <p>Selected category: {selectedCategory}</p>
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
                padding: '1rem',
            }}
        >
            <div
                style={{
                    maxWidth: '40rem',
                    width: '100%',
                    padding: '1.5rem',
                    backgroundColor: '#1E1E1E',
                    border: '1px solid #B9CFD4',
                    borderRadius: '0.5rem',
                    color: '#F5F7FA',
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
                        color: '#FF6B6B',
                    }}
                >
                    Random Quote
                </h2>

                {/* Category Filter */}
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            marginBottom: '1rem'
                        }}
                    >
                        {categories.map(category => (
                            <button
                                key={category.value}
                                onClick={() => handleCategoryChange(category.value)}
                                style={{
                                    backgroundColor: selectedCategory === category.value ? '#FF6B6B' : '#40434E',
                                    color: '#F5F7FA',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: selectedCategory === category.value ? '700' : '400',
                                    transition: 'all 0.3s ease',
                                    fontSize: '0.875rem'
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedCategory !== category.value) {
                                        e.currentTarget.style.backgroundColor = '#FF6B6B';
                                        e.currentTarget.style.opacity = '0.8';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedCategory !== category.value) {
                                        e.currentTarget.style.backgroundColor = '#40434E';
                                        e.currentTarget.style.opacity = '1';
                                    }
                                }}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#B9CFD4', margin: 0 }}>
                        {selectedCategory === 'all'
                            ? `All ${allQuotes.length} quotes`
                            : `${filteredQuotes.length} ${selectedCategory} quotes`
                        }
                    </p>
                </div>

                {/* Quote Display */}
                <div
                    style={{
                        minHeight: '250px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#40434E',
                        borderRadius: '0.5rem',
                        padding: '1.5rem',
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
                            <p>Loading quote...</p>
                        </div>
                    ) : currentQuote ? (
                        <div
                            style={{
                                backgroundColor: '#1E1E1E',
                                padding: '1.5rem',
                                borderRadius: '0.5rem',
                                width: '100%',
                                color: '#F5F7FA',
                                textAlign: 'center',
                                boxShadow: 'inset 0 0 10px rgba(255,107,107,0.5)',
                            }}
                        >
                            <blockquote style={{
                                fontSize: '1.125rem',
                                fontStyle: 'italic',
                                margin: '0 0 1rem 0',
                                lineHeight: '1.6',
                                position: 'relative'
                            }}>
                                <span style={{ fontSize: '2rem', color: '#FF6B6B', position: 'absolute', top: '-0.5rem', left: '-0.5rem' }}>"</span>
                                <span style={{ paddingLeft: '1rem' }}>{currentQuote.text || currentQuote.quote}</span>
                                <span style={{ fontSize: '2rem', color: '#FF6B6B' }}>"</span>
                            </blockquote>
                            {currentQuote.author && (
                                <p style={{
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    color: '#B9CFD4',
                                    margin: 0
                                }}>
                                    — {currentQuote.author}
                                </p>
                            )}
                            {currentQuote.category && (
                                <p style={{
                                    fontSize: '0.875rem',
                                    color: '#FF6B6B',
                                    margin: '0.5rem 0 0 0',
                                    textTransform: 'capitalize'
                                }}>
                                    {currentQuote.category}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#B9CFD4' }}>
                            <p style={{ marginBottom: '1rem' }}>No quote selected</p>
                            <p style={{ fontSize: '0.875rem' }}>Click "Get Random Quote" to start!</p>
                            {filteredQuotes.length === 0 && selectedCategory !== 'all' && (
                                <p style={{ color: '#FF6B6B', marginTop: '0.5rem' }}>
                                    No quotes available for "{selectedCategory}" category
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={getRandomQuote}
                        disabled={loading || (selectedCategory !== 'all' && filteredQuotes.length === 0) || allQuotes.length === 0}
                        style={{
                            flex: 1,
                            backgroundColor:
                                loading || (selectedCategory !== 'all' && filteredQuotes.length === 0) || allQuotes.length === 0
                                    ? '#40434E' : '#FF6B6B',
                            color: '#F5F7FA',
                            fontWeight: '600',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: loading || (selectedCategory !== 'all' && filteredQuotes.length === 0) || allQuotes.length === 0
                                ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                            if (!loading && !((selectedCategory !== 'all' && filteredQuotes.length === 0) || allQuotes.length === 0))
                                e.currentTarget.style.backgroundColor = '#e85a5a';
                        }}
                        onMouseLeave={(e) => {
                            if (!loading && !((selectedCategory !== 'all' && filteredQuotes.length === 0) || allQuotes.length === 0))
                                e.currentTarget.style.backgroundColor = '#FF6B6B';
                        }}
                    >
                        {loading ? 'Loading...' : 'Get Random Quote'}
                    </button>
                </div>

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

export default RandomQuote;