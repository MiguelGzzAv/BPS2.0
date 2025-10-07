import React from 'react';

function Maintenance() {
    return (
        <div className="container-fluid d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
            <div className="text-center">
                <i className="bi bi-tools" style={{ fontSize: '4rem' }}></i>
                <h1 className="display-4 mt-3">Page Under Maintenance</h1>
                <p className="lead">We are currently performing scheduled maintenance on this page.</p>
                <p>Please check back later. We apologize for any inconvenience.</p>
            </div>
        </div>
    );
}

export default Maintenance;