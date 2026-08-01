package com.quickbite.food_delivery_backend.payload.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Admin create/update payload. Unlike public signup this accepts any role, including ADMIN —
 * the endpoint's own authorisation is what restricts who may call it.
 */
public class AdminUserRequest {

    @NotBlank(message = "fullName is required")
    @Size(min = 3, max = 60)
    private String fullName;

    @NotBlank(message = "email is required")
    @Email(message = "email must be a valid address")
    @Size(max = 50)
    private String email;

    /**
     * Required on create; on update, blank or absent means "leave the password alone".
     * Deliberately not @Size-annotated: an empty string is a meaningful value here, so the
     * length rule is applied in the controller only when a password is actually supplied.
     */
    private String password;

    @NotBlank(message = "role is required")
    private String role;

    private String mobile;
    private String address;
    private String avatarUrl;
    private Boolean enabled;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
}
