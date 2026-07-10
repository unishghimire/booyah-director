import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-gray-600">
        <span className="font-orbitron text-sm">Loading...</span>
      </div>
    );
  }

  if (!user) {
    const nextUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${nextUrl}`} replace />;
  }

  return children;
}