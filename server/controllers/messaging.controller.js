const { globalMessages } = require('../data/database');

// Controller to get the latest message
const getLatestMessage = (req, res) => {
    // Return the last message in the array, or null if it's empty
    const latestMessage = globalMessages.length > 0 ? globalMessages[globalMessages.length - 1] : null;
    res.status(200).json(latestMessage);
};

// Controller to create a new global message
const createMessage = (req, res) => {
    // Ensure only superadmins can create messages
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to perform this action.' });
    }

    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ error: 'Invalid payload. A non-empty "message" string is required.' });
    }

    const newMessage = {
        id: Date.now(), // Simple unique ID using timestamp
        text: message.trim(),
        timestamp: new Date().toISOString(),
    };

    globalMessages.push(newMessage);

    // Optional: Keep the array from growing indefinitely in a real app
    // For this mock DB, we'll just let it grow.
    // if (globalMessages.length > 10) {
    //     globalMessages.shift();
    // }

    res.status(201).json({ message: 'Message created successfully.', createdMessage: newMessage });
};

module.exports = {
    getLatestMessage,
    createMessage,
};