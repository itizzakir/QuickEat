package com.quickbite.food_delivery_backend.security;

import com.quickbite.food_delivery_backend.models.ERole;
import com.quickbite.food_delivery_backend.security.services.UserDetailsImpl;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.GrantedAuthority;

/**
 * Ownership checks shared by every endpoint that still takes a user id from the client.
 *
 * <p>Without these, any authenticated caller can read or overwrite any other user's cart,
 * orders and profile simply by changing the id in the URL.
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static boolean isAdmin(UserDetailsImpl principal) {
        if (principal == null) {
            return false;
        }
        for (GrantedAuthority authority : principal.getAuthorities()) {
            if (ERole.ROLE_ADMIN.name().equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    public static boolean hasRole(UserDetailsImpl principal, ERole role) {
        if (principal == null) {
            return false;
        }
        for (GrantedAuthority authority : principal.getAuthorities()) {
            if (role.name().equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    /**
     * Allows the request only when the principal is acting on their own data, or is an admin.
     *
     * @throws AccessDeniedException translated to a 403 JSON body by GlobalExceptionHandler
     */
    public static void requireSelfOrAdmin(UserDetailsImpl principal, Long targetUserId) {
        if (principal == null) {
            throw new AccessDeniedException("Authentication required");
        }
        if (isAdmin(principal)) {
            return;
        }
        if (targetUserId == null || !targetUserId.equals(principal.getId())) {
            // Deliberately vague: do not confirm whether the target id exists.
            throw new AccessDeniedException("You are not allowed to access this resource");
        }
    }

    /** Guards a resource that belongs to some user id, without the admin escape hatch. */
    public static void requireOwner(UserDetailsImpl principal, Long ownerUserId) {
        if (principal == null || ownerUserId == null || !ownerUserId.equals(principal.getId())) {
            throw new AccessDeniedException("You are not allowed to access this resource");
        }
    }
}
