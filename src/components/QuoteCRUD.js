import React, { useState, useEffect } from 'react';
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    where
} from 'firebase/firestore';
import { db } from '../App';

function QuoteCRUD({ currentUser }) {
    const [quotes, setQuotes] = useState([]);
    const [filteredQuotes, setFilteredQuotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingQuote, setEditingQuote] = useState(null);
    const [filterCategory, setFilterCategory] = useState('all');

    // Form states
    const [formData, setFormData] = useState({
        text: '',
        author: '',
        category: 'Influencers'
    });

    const categories = [
        { value: 'all', label: '🌟 All Categories' },
        { value: 'Influencers', label: '💡 Influencers' },
        { value: 'Games', label: '🎮 Games' },
        { value: 'Philosophical', label: '🤔 Philosophical' }
    ];

    useEffect(() => {
        loadQuotes();
    }, []);

    useEffect(() => {
        filterQuotes();
    }, [filterCategory, quotes]);

    const loadQuotes = async () => {
        try {
            setLoading(true);
            setError('');

            const quotesRef = collection(db, 'quotes');
            const q = query(quotesRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            const quotesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setQuotes(quotesList);
        } catch (err) {
            setError('Failed to load quotes: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const filterQuotes = () => {
        if (filterCategory === 'all') {
            setFilteredQuotes(quotes);
        } else {
            const filtered = quotes.filter(quote =>
                quote.category && quote.category.toLowerCase() === filterCategory.toLowerCase()
            );
            setFilteredQuotes(filtered);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.text.trim()) {
            setError('Quote text is required');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const quoteData = {
                text: formData.text.trim(),
                author: formData.author.trim() || 'Anonymous',
                category: formData.category,
                createdAt: new Date(),
                createdBy: currentUser?.uid || 'anonymous'
            };

            if (editingQuote) {
                // Update existing quote
                await updateDoc(doc(db, 'quotes', editingQuote.id), {
                    ...quoteData,
                    updatedAt: new Date()
                });
                setSuccess('Quote updated successfully! ✨');
            } else {
                // Add new quote
                await addDoc(collection(db, 'quotes'), quoteData);
                setSuccess('Quote added successfully! 🎉');
            }

            // Reset form
            setFormData({
                text: '',
                author: '',
                category: 'Influencers'
            });
            setShowForm(false);
            setEditingQuote(null);

            // Reload quotes
            await loadQuotes();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            setError('Failed to save quote: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (quote) => {
        setEditingQuote(quote);
        setFormData({
            text: quote.text || '',
            author: quote.author || '',
            category: quote.category || 'Influencers'
        });
        setShowForm(true);
    };

    const handleDelete = async (quoteId) => {
        if (!window.confirm('Are you sure you want to delete this quote? 🗑️')) {
            return;
        }

        try {
            setLoading(true);
            await deleteDoc(doc(db, 'quotes', quoteId));
            setSuccess('Quote deleted successfully! 👋');
            await loadQuotes();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to delete quote: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            text: '',
            author: '',
            category: 'Influencers'
        });
        setEditingQuote(null);
        setShowForm(false);
        setError('');
    };

    return (
        <div className="max-w-4xl mx-auto text-slate-700">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                        📚 Manage Quotes
                    </h2>
                    <p className="text-slate-600 text-lg">Create and organize your motivational quotes ✨</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                        showForm
                            ? 'bg-gradient-to-r from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 text-white'
                            : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white'
                    }`}
                >
                    {showForm ? '❌ Cancel' : '✨ Add New Quote'}
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-4 rounded-2xl mb-6 shadow-lg">
                    <div className="flex items-center">
                        <span className="text-xl mr-2">⚠️</span>
                        {error}
                    </div>
                </div>
            )}

            {success && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-2xl mb-6 shadow-lg">
                    <div className="flex items-center">
                        <span className="text-xl mr-2">🎉</span>
                        {success}
                    </div>
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-8 border border-sky-200 shadow-2xl mb-8">
                    <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {editingQuote ? '✏️ Edit Quote' : '✨ Add New Quote'}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-lg font-semibold text-slate-700 mb-3">
                                Quote Text *
                            </label>
                            <textarea
                                name="text"
                                value={formData.text}
                                onChange={handleInputChange}
                                placeholder="Enter your motivational quote..."
                                required
                                rows={4}
                                className="w-full p-4 rounded-2xl border border-sky-200 bg-white/80 backdrop-blur-sm text-slate-700 text-lg placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-200 focus:border-sky-400 transition-all duration-300 resize-vertical"
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-semibold text-slate-700 mb-3">
                                Author
                            </label>
                            <input
                                type="text"
                                name="author"
                                value={formData.author}
                                onChange={handleInputChange}
                                placeholder="Author name (optional)"
                                className="w-full p-4 rounded-2xl border border-sky-200 bg-white/80 backdrop-blur-sm text-slate-700 text-lg placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-200 focus:border-sky-400 transition-all duration-300"
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-semibold text-slate-700 mb-3">
                                Category
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="w-full p-4 rounded-2xl border border-sky-200 bg-white/80 backdrop-blur-sm text-slate-700 text-lg focus:outline-none focus:ring-4 focus:ring-sky-200 focus:border-sky-400 transition-all duration-300"
                            >
                                {categories.slice(1).map(category => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                                    loading
                                        ? 'bg-slate-400 text-white cursor-not-allowed'
                                        : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white'
                                }`}
                            >
                                {loading ? '⏳ Saving...' : (editingQuote ? '✅ Update Quote' : '🚀 Add Quote')}
                            </button>

                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                ❌ Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter Buttons */}
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 border border-sky-200 shadow-xl mb-8">
                <div className="flex flex-wrap gap-3 items-center">
                    <span className="text-lg font-semibold text-slate-700 mr-2">Filter by category:</span>
                    {categories.map(category => (
                        <button
                            key={category.value}
                            onClick={() => setFilterCategory(category.value)}
                            className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                                filterCategory === category.value
                                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white ring-4 ring-sky-200'
                                    : 'bg-white/80 text-slate-700 hover:bg-white border border-sky-200 hover:border-sky-300'
                            }`}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quotes List Header */}
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 border border-sky-200 shadow-xl mb-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        💎 Your Quotes ({filteredQuotes.length})
                    </h3>
                    <button
                        onClick={loadQuotes}
                        disabled={loading}
                        className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                            loading
                                ? 'bg-slate-400 text-white cursor-not-allowed'
                                : 'bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-500 hover:to-sky-600 text-white'
                        }`}
                    >
                        {loading ? '⏳ Loading...' : '🔄 Refresh'}
                    </button>
                </div>
            </div>

            {/* Quotes List */}
            {loading && quotes.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-12 border border-sky-200 shadow-xl text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-sky-400 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-2xl font-bold text-slate-700">Loading your inspiring quotes... ✨</p>
                </div>
            ) : filteredQuotes.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-12 border border-sky-200 shadow-xl text-center">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-2xl font-bold text-slate-700 mb-2">
                        {filterCategory === 'all' ? 'No quotes yet!' : `No ${filterCategory} quotes found`}
                    </p>
                    <p className="text-lg text-slate-600">
                        {filterCategory === 'all' ? 'Add your first inspiring quote to get started! 🚀' : 'Try a different category or add some new quotes! ✨'}
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredQuotes.map((quote, index) => (
                        <div
                            key={quote.id}
                            className="bg-white/70 backdrop-blur-lg rounded-3xl p-8 border border-sky-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                        >
                            <blockquote className="text-xl font-medium italic text-slate-700 mb-6 leading-relaxed">
                                "💭 {quote.text}"
                            </blockquote>

                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div>
                                    {quote.author && (
                                        <p className="text-lg font-bold text-slate-600 mb-2">
                                            — {quote.author}
                                        </p>
                                    )}
                                    <div className="flex items-center">
                                        <span className="px-4 py-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-full text-sm font-bold">
                                            {categories.find(cat => cat.value === quote.category)?.label || quote.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleEdit(quote)}
                                        className="px-6 py-3 rounded-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                    >
                                        ✏️ Edit
                                    </button>

                                    <button
                                        onClick={() => handleDelete(quote.id)}
                                        className="px-6 py-3 rounded-2xl font-bold bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default QuoteCRUD;