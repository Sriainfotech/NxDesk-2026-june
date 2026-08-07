import React from 'react';

const ReturnUserPersonalDetails = ({ userDetails }) => {
    if (!userDetails) {
        return <p>No user details available.</p>;
    }

    const { firstName, lastName, email, phone } = userDetails;

    return (
        <div>
            <h2>User Personal Details</h2>
            <p><strong>First Name:</strong> {firstName}</p>
            <p><strong>Last Name:</strong> {lastName}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Phone:</strong> {phone}</p>
        </div>
    );
};

export default ReturnUserPersonalDetails;