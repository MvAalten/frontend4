// Simple Message Display Component
import React, { useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    orderBy,
    query
} from 'firebase/firestore';
import { db } from '../App';

function SimpleMessageDisplay({ currentUser }) {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        // Get ALL messages from friendmessages collection
        const messagesQuery = query(
            collection(db, 'friendmessages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const messagesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('All messages:', messagesData);
            setMessages(messagesData);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">All Friend Messages</h2>

            {messages.length === 0 ? (
                <p>No messages found</p>
            ) : (
                <div className="space-y-2">
                    {messages.map(message => (
                        <div key={message.id} className="border p-3 rounded">
                            <p><strong>{message.senderId === currentUser?.uid ? 'You:' : 'Them:'}</strong> {message.message}</p>
                            <p className="text-sm text-gray-500">Created: {message.createdAt ? new Date(message.createdAt.seconds * 1000).toLocaleString() : 'No timestamp'}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SimpleMessageDisplay;