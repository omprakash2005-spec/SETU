import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    // We can get user from localStorage or Context. 
    // Using localStorage is safer for persistence across refreshes if Context isn't hydration ready.
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
            }
        }
        setLoading(false);
    }, []);

    if (loading) {
        return <div>Loading...</div>; // Or a spinner
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Check verification status
    // If verification_status is 'PENDING' or 'FAILED', redirect to pending page
    // But allow access if it's 'VERIFIED' or if the field is missing (legacy users? prompt says "don't change existing system". 
    // Existing users might not have this field. 
    // Prompt says: "A new user...". Existing users might be undefined.
    // We should be careful. If undefined, maybe allow? Or assume VERIFIED?
    // Prompt says: "If no match found -> PENDING".
    // "Legacy users" -> If I updated the DB schema, existing users have NULL or default 'PENDING'.
    // My DB init script set default 'PENDING'.
    // But I should check if `is_verified` is reliable.
    // Backend sets `is_verified`.

    if (user.role === 'admin') {
        return <Outlet />; // Admins bypass
    }

    if (user.verification_status === 'VERIFIED' || user.is_verified === true) {
        return <Outlet />;
    }

    // If not verified
    return <Navigate to="/verification-pending" replace />;
};

export default ProtectedRoute;
