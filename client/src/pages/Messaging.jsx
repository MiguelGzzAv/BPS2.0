import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { fetchWithAuth } from '../api';

function Messaging() {
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', text: '' });

    // Protect this page to be superadmin-only
    if (user?.role !== 'superadmin') {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (message.trim() === '') {
            setFeedback({ type: 'danger', text: 'Message cannot be empty.' });
            return;
        }

        try {
            setIsSending(true);
            setFeedback({ type: '', text: '' });
            const response = await fetchWithAuth('/api/messaging', {
                method: 'POST',
                body: { message },
            });

            if (!response.ok) {
                throw new Error('Failed to send message.');
            }

            setFeedback({ type: 'success', text: 'Message sent successfully!' });
            setMessage(''); // Clear the textarea
        } catch (error) {
            setFeedback({ type: 'danger', text: error.message || 'An error occurred.' });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="container-fluid mt-4">
            <h2>Global Messaging</h2>
            <p>Send a global broadcast message to all active users. The message will appear as a temporary toast notification on their screen.</p>

            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">Compose Message</h5>
                    <form onSubmit={handleSendMessage}>
                        <div className="mb-3">
                            <label htmlFor="messageTextarea" className="form-label">Message Content</label>
                            <textarea
                                className="form-control"
                                id="messageTextarea"
                                rows="4"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter your broadcast message here..."
                                required
                                disabled={isSending}
                            ></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={isSending}>
                            {isSending ? 'Sending...' : 'Send Broadcast'}
                        </button>
                    </form>
                    {feedback.text && (
                        <div className={`alert alert-${feedback.type} mt-3`} role="alert">
                            {feedback.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Messaging;