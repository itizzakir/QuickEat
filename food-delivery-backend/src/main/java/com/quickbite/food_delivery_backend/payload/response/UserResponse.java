package com.quickbite.food_delivery_backend.payload.response;

import com.quickbite.food_delivery_backend.models.User;

/**
 * Safe public view of a {@link User}. Deliberately has no password field, so a hash cannot be
 * serialised even by accident.
 */
public class UserResponse {

    private final Long id;
    private final String fullName;
    private final String email;
    private final String role;
    private final String mobile;
    private final String address;
    private final String avatarUrl;
    private final boolean enabled;

    private UserResponse(User user) {
        this.id = user.getId();
        this.fullName = user.getFullName();
        this.email = user.getEmail();
        this.role = user.getRole() != null ? user.getRole().name() : null;
        this.mobile = user.getMobile();
        this.address = user.getAddress();
        this.avatarUrl = user.getAvatarUrl();
        this.enabled = user.isActive();
    }

    public static UserResponse from(User user) {
        return user == null ? null : new UserResponse(user);
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getMobile() { return mobile; }
    public String getAddress() { return address; }
    public String getAvatarUrl() { return avatarUrl; }
    public boolean isEnabled() { return enabled; }
}
