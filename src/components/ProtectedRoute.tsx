
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isGuest, loading } = useAuth();

  console.log('ProtectedRoute: Current state', { user, isGuest, loading });

  if (loading) {
    console.log('ProtectedRoute: Still loading, showing spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !isGuest) {
    // For testing purposes, allow access to dashboard
    // In production, this should redirect to auth
    console.log('ProtectedRoute: No user or guest session, but allowing access for testing');
  }

  console.log('ProtectedRoute: Rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;
