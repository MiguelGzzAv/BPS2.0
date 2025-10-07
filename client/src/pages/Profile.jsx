import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../api';

const Profile = () => {
    const { user, login } = useAuth();
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('info');

    // State for theme settings
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [font, setFont] = useState('system-ui');

    // Effect to apply theme and font on initial load
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') === 'dark';
        const savedFont = localStorage.getItem('font') || 'system-ui';

        setIsDarkMode(savedTheme);
        setFont(savedFont);

        document.body.setAttribute('data-theme', savedTheme ? 'dark' : 'light');
        document.body.style.fontFamily = savedFont;
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleThemeChange = (e) => {
        const newIsDarkMode = e.target.checked;
        setIsDarkMode(newIsDarkMode);
        const theme = newIsDarkMode ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        document.body.setAttribute('data-theme', theme);
    };

    const handleFontChange = (e) => {
        const newFont = e.target.value;
        setFont(newFont);
        localStorage.setItem('font', newFont);
        document.body.style.fontFamily = newFont;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        const url = `/api/users/${user.id}`;
        try {
            const response = await fetchWithAuth(url, {
                method: 'PUT',
                body: formData,
            });
            const updatedUser = await response.json();
            if (!response.ok) {
                throw new Error(updatedUser.error || 'Failed to update profile.');
            }
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
                    <h2>My Account</h2>
                    <p className="text-muted">Manage your personal information and application settings.</p>

                    <ul className="nav nav-tabs mt-4">
                        <li className="nav-item">
                            <button className={`nav-link ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
                                Personal Information
                            </button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                                Settings
                            </button>
                        </li>
                    </ul>

                    <div className="card card-body tab-content p-4">
                        {activeTab === 'info' && (
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
                        )}

                        {activeTab === 'settings' && (
                            <div>
                                <h4>Environment Settings</h4>
                                <div className="mb-3">
                                    <label htmlFor="font-select" className="form-label">Application Font</label>
                                    <select id="font-select" className="form-select" value={font} onChange={handleFontChange}>
                                        <option value="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif">System Default</option>
                                        <option value="Arial, sans-serif">Arial</option>
                                        <option value="Verdana, sans-serif">Verdana</option>
                                        <option value="'Times New Roman', Times, serif">Times New Roman</option>
                                        <option value="'Courier New', Courier, monospace">Courier New</option>
                                    </select>
                                </div>
                                <div className="form-check form-switch mb-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        role="switch"
                                        id="dark-mode-switch"
                                        checked={isDarkMode}
                                        onChange={handleThemeChange}
                                    />
                                    <label className="form-check-label" htmlFor="dark-mode-switch">Dark Mode</label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;