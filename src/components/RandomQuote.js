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
        { value: 'all', label: '✨ All Quotes', emoji: '✨' },
        { value: 'Influencers', label: '🌟 Influencers', emoji: '🌟' },
        { value: 'Games', label: '🎮 Games', emoji: '🎮' },
        { value: 'Philosophical', label: '🧠 Philosophical', emoji: '🧠' }
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
            <div className="text-center py-12">
                <div className="bg-gradient-to-r from-red-50 to-pink-50 backdrop-blur-lg rounded-3xl p-8 border border-red-200 shadow-xl max-w-2xl mx-auto">
                    <div className="text-6xl mb-4">😔</div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
                        Oops! Something went wrong
                    </h2>
                    <p className="text-slate-600 text-lg mb-6">{error}</p>
                    <button
                        onClick={refreshQuotes}
                        className="bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white px-8 py-4 rounded-2xl font-bold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        🔄 Try Again
                    </button>
                    <div className="mt-6 p-4 bg-white/70 backdrop-blur-lg rounded-2xl border border-red-200">
                        <p className="text-sm text-slate-500 mb-2 font-medium">Debug info:</p>
                        <div className="text-xs text-slate-400 space-y-1">
                            <p>Quotes loaded: {allQuotes.length}</p>
                            <p>Current quote: {currentQuote ? 'Yes' : 'No'}</p>
                            <p>Selected category: {selectedCategory}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                    💭 Random Quote Generator
                </h2>
                <p className="text-xl text-slate-600">Discover inspiration from amazing quotes! ✨</p>
            </div>

            {/* Category Filter */}
            <div className="text-center">
                <div className="flex gap-3 flex-wrap justify-center mb-4">
                    {categories.map(category => (
                        <button
                            key={category.value}
                            onClick={() => handleCategoryChange(category.value)}
                            className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                                selectedCategory === category.value
                                    ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white ring-4 ring-sky-200'
                                    : 'bg-white/80 backdrop-blur-lg text-slate-700 hover:bg-gradient-to-r hover:from-sky-400 hover:to-blue-500 hover:text-white border border-sky-200'
                            }`}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>
                <div className="bg-gradient-to-r from-cyan-50 to-sky-50 backdrop-blur-lg p-4 rounded-2xl border border-sky-200 shadow-lg inline-block">
                    <p className="text-sky-700 font-medium">
                        {selectedCategory === 'all'
                            ? `✨ All ${allQuotes.length} quotes available`
                            : `${categories.find(c => c.value === selectedCategory)?.emoji} ${filteredQuotes.length} ${selectedCategory} quotes available`
                        }
                    </p>
                </div>
            </div>

            {/* Quote Display */}
            <div className="bg-white/60 backdrop-blur-lg rounded-3xl p-8 border border-sky-200 shadow-2xl min-h-[400px] flex items-center justify-center">
                {loading ? (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-sky-400 border-t-transparent mx-auto mb-6 shadow-lg"></div>
                        <p className="text-2xl font-bold text-sky-600 animate-pulse">Loading inspiration...</p>
                        <p className="text-slate-500 mt-2">✨ Getting ready to motivate you!</p>
                    </div>
                ) : currentQuote ? (
                    <div className="text-center w-full max-w-4xl">
                        <div className="bg-gradient-to-br from-sky-50 to-blue-50 backdrop-blur-lg p-8 rounded-3xl border border-sky-200 shadow-xl">
                            <div className="relative">
                                <div className="text-6xl text-sky-400 mb-4">"</div>
                                <blockquote className="text-2xl md:text-3xl font-medium text-slate-700 leading-relaxed mb-6 italic">
                                    {currentQuote.text || currentQuote.quote}
                                </blockquote>
                                <div className="text-6xl text-sky-400 mb-6 rotate-180">"</div>
                            </div>

                            {currentQuote.author && (
                                <div className="bg-white/70 backdrop-blur-lg p-4 rounded-2xl border border-sky-200 shadow-lg inline-block mb-4">
                                    <p className="text-xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                                        — {currentQuote.author}
                                    </p>
                                </div>
                            )}

                            {currentQuote.category && (
                                <div className="inline-block bg-gradient-to-r from-indigo-400 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                                    {categories.find(c => c.value === currentQuote.category)?.emoji || '✨'} {currentQuote.category}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="text-8xl mb-6">💭</div>
                        <p className="text-2xl font-bold text-slate-600 mb-4">Ready for some inspiration?</p>
                        <p className="text-lg text-sky-600 mb-6">Click the button below to discover an amazing quote! ✨</p>
                        {filteredQuotes.length === 0 && selectedCategory !== 'all' && (
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-2xl border border-yellow-200 shadow-lg">
                                <p className="text-yellow-700 font-medium">
                                    🔍 No quotes available for "{selectedCategory}" category
                                </p>
                                <p className="text-yellow-600 text-sm mt-1">Try selecting a different category!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Action Button */}
            <div className="text-center">
                <button
                    onClick={getRandomQuote}
                    disabled={loading || (selectedCategory !== 'all' && filteredQuotes.length === 0) || allQuotes.length === 0}
                    className={`px-12 py-6 rounded-3xl font-bold text-xl transition-all duration-300 transform shadow-2xl ${
                        loading || (selectedCategory !== 'all' && filteredQuotes.length === 0) || allQuotes.length === 0
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white hover:scale-110 ring-4 ring-sky-200 hover:ring-sky-300'
                    }`}
                >
                    {loading ? (
                        <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                            Loading Magic...
                        </div>
                    ) : (
                        '🎲 Get Random Quote'
                    )}
                </button>
            </div>
        </div>
    );
}

export default RandomQuote;