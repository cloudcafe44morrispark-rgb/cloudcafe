import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Coffee } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function VerifiedPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Redirect to signin or home based on auth status
                    navigate(isAuthenticated ? '/' : '/signin');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate, isAuthenticated]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md text-center">
                {/* Success Icon */}
                <div className="relative inline-block mb-6">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-10 h-10 bg-[#B88A68] rounded-full">
                        <Coffee className="w-5 h-5 text-white" />
                    </div>
                </div>

                {/* Success Message */}
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Email Verified!</h1>
                <p className="text-gray-600 mb-8">
                    Your email has been successfully verified. Welcome to Cloud Cafe!
                </p>

                {/* Countdown */}
                <p className="text-sm text-gray-500 mb-6">
                    Redirecting in <span className="font-bold text-[#B88A68]">{countdown}</span> seconds...
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/signin"
                        className="px-6 py-3 bg-[#B88A68] text-white font-semibold rounded-full hover:bg-[#A67958] transition-colors"
                    >
                        Sign In Now
                    </Link>
                    <Link
                        to="/menu"
                        className="px-6 py-3 border-2 border-[#B88A68] text-[#B88A68] font-semibold rounded-full hover:bg-[#B88A68]/10 transition-colors"
                    >
                        Browse Menu
                    </Link>
                </div>
            </div>
        </div>
    );
}
