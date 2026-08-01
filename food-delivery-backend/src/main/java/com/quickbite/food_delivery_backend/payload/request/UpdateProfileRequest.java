package com.quickbite.food_delivery_backend.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Explicit list of the fields a user may change about themselves. Binding the User entity
 * directly would let a caller submit any column on the table, including the password and role.
 */
public class UpdateProfileRequest {

    @NotBlank(message = "fullName is required")
    @Size(min = 3, max = 60)
    private String fullName;

    private String mobile;
    private String address;
    private String avatarUrl;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
