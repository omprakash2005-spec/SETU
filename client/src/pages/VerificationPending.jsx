import React from 'react';
import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';

const VerificationPending = () => {
    const navigate = useNavigate();

    const handleBackToLogin = () => {
        // NEW: Check user role from localStorage
        const userData = localStorage.getItem('user');
        let role = 'student'; // default to student

        if (userData) {
            try {
                const user = JSON.parse(userData);
                role = user.role || 'student';
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }

        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // NEW: Navigate based on role
        if (role === 'alumni') {
            navigate('/alumniLogin');
        } else {
            navigate('/studentLogin'); // existing student behavior
        }
    };

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
            style={{
                backgroundImage: `url(${assets.landingBG})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
            }}
        >
            {/* White overlay */}
            <div className="absolute inset-0 bg-white opacity-90"></div>

            {/* White solid card */}
            <div className="relative z-10 max-w-lg w-full space-y-8 text-center p-10 bg-white shadow-2xl rounded-3xl">
                <div>
                    {/* Icon */}
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 mb-6 shadow-md">
                        <svg
                            className="h-10 w-10 text-amber-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>

                    {/* Title */}
                    <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        Verification Pending
                    </h2>
                    <p className="mt-4 text-lg text-gray-600">
                        Thanks for searching us! Your account is currently under review.
                    </p>

                    {/* Status Box */}
                    <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-md text-left shadow-sm">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-blue-800">
                                    Status: <span className="font-bold">PENDING APPROVAL</span>
                                </p>
                                <p className="text-sm text-blue-700 mt-1">
                                    We are verifying your ID card details with our records.
                                    <br />
                                    Estimated Time: <span className="font-semibold">2-4 Hours</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Advice Box */}
                    <div className="mt-6 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                        <p className="font-semibold text-gray-700">Advice:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1 text-left">
                            <li>If not verified within 24 hours, please contact your college administration.</li>
                            <li>Ensure you uploaded a clear, valid ID card.</li>
                            <li>Check if your college records need updating.</li>
                        </ul>
                    </div>

                </div>

                {/* Buttons */}
                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center">
                    <button
                        onClick={handleGoHome}
                        className="w-full inline-flex justify-center py-3 px-6 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Back to Home
                    </button>
                    <button
                        onClick={handleBackToLogin}
                        className="w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerificationPending;
