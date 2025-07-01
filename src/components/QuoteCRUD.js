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
        category: 'motivational'
    });

    const categories = [
        { value: 'all', label: 'All Categories' },
        { value: 'motivational', label: 'Motivational' },
        { value: 'fitness', label: 'Fitness' },
        { value: 'inspirational', label: 'Inspirational' }
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
                setSuccess('Quote updated successfully!');
            } else {
                // Add new quote
                await addDoc(collection(db, 'quotes'), quoteData);
                setSuccess('Quote added successfully!');
            }

            // Reset form
            setFormData({
                text: '',
                author: '',
                category: 'motivational'
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
            category: quote.category || 'motivational'
        });
        setShowForm(true);
    };

    const handleDelete = async (quoteId) => {
        if (!window.confirm('Are you sure you want to delete this quote?')) {
            return;
        }

        try {
            setLoading(true);
            await deleteDoc(doc(db, 'quotes', quoteId));
            setSuccess('Quote deleted successfully!');
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
            category: 'motivational'
        });
        setEditingQuote(null);
        setShowForm(false);
        setError('');
    };

    return (
        <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '1rem',
            color: '#F5F7FA',
            fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
        }}>
            <div style={{
                backgroundColor: '#1E1E1E',
                border: '1px solid #B9CFD4',
                borderRadius: '0.5rem',
                padding: '1.5rem'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <h2 style={{
                        fontSize: '1.75rem',
                        fontWeight: '700',
                        margin: 0,
                        color: '#FF6B6B'
                    }}>
                        Manage Quotes
                    </h2>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        style={{
                            backgroundColor: '#FF6B6B',
                            color: '#F5F7FA',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e85a5a'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FF6B6B'}
                    >
                        {showForm ? 'Cancel' : 'Add New Quote'}
                    </button>
                </div>

                {/* Messages */}
                {error && (
                    <div style={{
                        backgroundColor: '#FF6B6B',
                        color: 'white',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem'
                    }}>
                        {success}
                    </div>
                )}

                {/* Add/Edit Form */}
                {showForm && (
                    <div style={{
                        backgroundColor: '#40434E',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem'
                    }}>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            marginBottom: '1rem',
                            color: '#FF6B6B'
                        }}>
                            {editingQuote ? 'Edit Quote' : 'Add New Quote'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontWeight: '600'
                                }}>
                                    Quote Text *
                                </label>
                                <textarea
                                    name="text"
                                    value={formData.text}
                                    onChange={handleInputChange}
                                    placeholder="Enter the quote text..."
                                    required
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid #B9CFD4',
                                        backgroundColor: '#1E1E1E',
                                        color: '#F5F7FA',
                                        fontSize: '1rem',
                                        resize: 'vertical',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontWeight: '600'
                                }}>
                                    Author
                                </label>
                                <input
                                    type="text"
                                    name="author"
                                    value={formData.author}
                                    onChange={handleInputChange}
                                    placeholder="Author name (optional)"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid #B9CFD4',
                                        backgroundColor: '#1E1E1E',
                                        color: '#F5F7FA',
                                        fontSize: '1rem',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontWeight: '600'
                                }}>
                                    Category
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid #B9CFD4',
                                        backgroundColor: '#1E1E1E',
                                        color: '#F5F7FA',
                                        fontSize: '1rem',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    {categories.slice(1).map(category => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        backgroundColor: loading ? '#40434E' : '#FF6B6B',
                                        color: '#F5F7FA',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '0.5rem',
                                        border: 'none',
                                        fontWeight: '600',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        transition: 'background-color 0.3s ease'
                                    }}
                                    onMouseEnter={e => {
                                        if (!loading) e.currentTarget.style.backgroundColor = '#e85a5a';
                                    }}
                                    onMouseLeave={e => {
                                        if (!loading) e.currentTarget.style.backgroundColor = '#FF6B6B';
                                    }}
                                >
                                    {loading ? 'Saving...' : (editingQuote ? 'Update Quote' : 'Add Quote')}
                                </button>

                                <button
                                    type="button"
                                    onClick={resetForm}
                                    style={{
                                        backgroundColor: '#40434E',
                                        color: '#F5F7FA',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '0.5rem',
                                        border: 'none',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.3s ease'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#555865'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#40434E'}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Filter */}
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                }}>
                    <span style={{ fontWeight: '600', marginRight: '0.5rem' }}>Filter:</span>
                    {categories.map(category => (
                        <button
                            key={category.value}
                            onClick={() => setFilterCategory(category.value)}
                            style={{
                                backgroundColor: filterCategory === category.value ? '#FF6B6B' : '#40434E',
                                color: '#F5F7FA',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: filterCategory === category.value ? '700' : '400',
                                transition: 'all 0.3s ease',
                                fontSize: '0.875rem'
                            }}
                            onMouseEnter={e => {
                                if (filterCategory !== category.value) {
                                    e.currentTarget.style.backgroundColor = '#FF6B6B';
                                    e.currentTarget.style.opacity = '0.8';
                                }
                            }}
                            onMouseLeave={e => {
                                if (filterCategory !== category.value) {
                                    e.currentTarget.style.backgroundColor = '#40434E';
                                    e.currentTarget.style.opacity = '1';
                                }
                            }}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>

                {/* Quotes List */}
                <div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem'
                    }}>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            margin: 0,
                            color: '#B9CFD4'
                        }}>
                            Quotes ({filteredQuotes.length})
                        </h3>

                        <button
                            onClick={loadQuotes}
                            disabled={loading}
                            style={{
                                backgroundColor: '#40434E',
                                color: '#F5F7FA',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>

                    {loading && quotes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#B9CFD4' }}>
                            Loading quotes...
                        </div>
                    ) : filteredQuotes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#B9CFD4' }}>
                            {filterCategory === 'all' ? 'No quotes found. Add your first quote!' : `No ${filterCategory} quotes found.`}
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gap: '1rem'
                        }}>
                            {filteredQuotes.map(quote => (
                                <div
                                    key={quote.id}
                                    style={{
                                        backgroundColor: '#40434E',
                                        padding: '1.5rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #B9CFD4'
                                    }}
                                >
                                    <blockquote style={{
                                        fontSize: '1.125rem',
                                        fontStyle: 'italic',
                                        margin: '0 0 1rem 0',
                                        lineHeight: '1.6',
                                        color: '#F5F7FA'
                                    }}>
                                        "{quote.text}"
                                    </blockquote>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        flexWrap: 'wrap',
                                        gap: '1rem'
                                    }}>
                                        <div>
                                            {quote.author && (
                                                <p style={{
                                                    fontSize: '1rem',
                                                    fontWeight: '600',
                                                    color: '#B9CFD4',
                                                    margin: '0 0 0.25rem 0'
                                                }}>
                                                    — {quote.author}
                                                </p>
                                            )}
                                            <p style={{
                                                fontSize: '0.875rem',
                                                color: '#FF6B6B',
                                                margin: 0,
                                                textTransform: 'capitalize'
                                            }}>
                                                {quote.category}
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleEdit(quote)}
                                                style={{
                                                    backgroundColor: '#4CAF50',
                                                    color: 'white',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '0.375rem',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#45a049'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#4CAF50'}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                onClick={() => handleDelete(quote.id)}
                                                style={{
                                                    backgroundColor: '#FF6B6B',
                                                    color: 'white',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '0.375rem',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e85a5a'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FF6B6B'}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default QuoteCRUD;