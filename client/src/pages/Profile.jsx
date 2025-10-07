import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
    const { user, login } = useAuth(); // Using login to update the global user state
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        // The user can only update their own data, so we use their ID
        const url = `/api/users/${user.id}`;

        try {
            const response = await fetchWithAuth(url, {
                method: 'PUT',
                body: formData, // fetchWithAuth handles stringify
            });

            const updatedUser = await response.json();

            if (!response.ok) {
                throw new Error(updatedUser.error || 'Failed to update profile.');
            }

            // Update the user in the global state and localStorage
            login({ ...user, ...updatedUser });

            setMessage('Profile updated successfully!');
        } catch (err) {
            setError(err.message);
        }
    };

    if (!user) {
        return <p>Loading profile...</p>;
    }

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header">
                            <h2>My Profile</h2>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                {message && <div className="alert alert-success">{message}</div>}
                                {error && <div className="alert alert-danger">{error}</div>}

                                <div className="mb-3">
                                    <label htmlFor="name" className="form-label">Full Name</label>
                                    <input type="text" id="name" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">Email Address</label>
                                    <input type="email" id="email" name="email" className="form-control" value={formData.email} onChange={handleChange} required />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="phone" className="form-label">Phone</label>
                                    <input type="tel" id="phone" name="phone" className="form-control" value={formData.phone} onChange={handleChange} />
                                </div>
                                <hr />
                                <div className="mb-3">
                                    <label htmlFor="username" className="form-label">Username</label>
                                    <input type="text" id="username" name="username" className="form-control" value={user.username} disabled />
                                    <div className="form-text">Your username cannot be changed.</div>
                                </div>
                                 <div className="mb-3">
                                    <label htmlFor="role" className="form-label">Role</label>
                                    <input type="text" id="role" name="role" className="form-control" value={user.role} disabled />
                                </div>

                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;