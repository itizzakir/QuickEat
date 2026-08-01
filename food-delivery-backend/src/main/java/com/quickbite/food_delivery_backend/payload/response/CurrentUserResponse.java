package com.quickbite.food_delivery_backend.payload.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.quickbite.food_delivery_backend.models.User;

/**
 * Response for GET /api/auth/me, used by the frontend to revalidate a stored session on page
 * refresh. Carries restaurantId for RESTAURANT users so the dashboard knows which restaurant to
 * load without a second lookup.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CurrentUserResponse {

    private final Long id;
    private final String fullName;
    private final String email;
    private final String role;
    private final String mobile;
    private final String avatarUrl;
    private final String address;
    private final boolean enabled;
    private final Long restaurantId;

    private CurrentUserResponse(User user, Long restaurantId) {
        this.id = user.getId();
        this.fullName = user.getFullName();
        this.email = user.getEmail();
        this.role = user.getRole() != null ? user.getRole().name() : null;
        this.mobile = user.getMobile();
        this.avatarUrl = user.getAvatarUrl();
        this.address = user.getAddress();
        this.enabled = user.isActive();
        this.restaurantId = restaurantId;
    }

    public static CurrentUserResponse of(User user, Long restaurantId) {
        return new CurrentUserResponse(user, restaurantId);
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getMobile() { return mobile; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getAddress() { return address; }
    public boolean isEnabled() { return enabled; }
    public Long getRestaurantId() { return restaurantId; }
}
