import { Link, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";

/** A real 404. The catch-all used to render the landing page, hiding every broken link. */
export default function NotFound() {
  const location = useLocation();
  const { isAuthenticated, dashboardPath } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border p-8 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary-50 flex items-center justify-center">
          <Compass className="h-7 w-7 text-primary-500" />
        </div>

        <p className="text-5xl font-extrabold text-gray-900">404</p>
        <h1 className="mt-2 text-xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-gray-600 break-all">
          Nothing lives at <span className="font-mono text-sm">{location.pathname}</span>
        </p>

        <div className="mt-6">
          <Link
            to={isAuthenticated ? dashboardPath : "/"}
            className="inline-block px-4 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600"
          >
            {isAuthenticated ? "Back to my dashboard" : "Back to QuickBite"}
          </Link>
        </div>
      </div>
    </div>
  );
}
