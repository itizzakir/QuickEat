import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";

/**
 * Shown when a signed-in user reaches a page their role does not cover. Being explicit matters:
 * the previous silent <Navigate to="/"> looked exactly like a bug.
 */
export default function NotAuthorized({ requiredRoles = [] }) {
  const { user, dashboardPath, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border p-8 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-red-50 flex items-center justify-center">
          <ShieldAlert className="h-7 w-7 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Not authorised</h1>
        <p className="mt-2 text-gray-600">
          Your account does not have access to this page.
        </p>

        {requiredRoles.length > 0 && (
          <p className="mt-4 text-sm text-gray-500">
            Requires{" "}
            <span className="font-semibold text-gray-700">{requiredRoles.join(" or ")}</span>
            {user?.role && (
              <>
                {" "}— you are signed in as{" "}
                <span className="font-semibold text-gray-700">{user.role}</span>
              </>
            )}
            .
          </p>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={dashboardPath}
            className="px-4 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600"
          >
            Go to my dashboard
          </Link>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign in as someone else
          </button>
        </div>
      </div>
    </div>
  );
}
