package com.quickbite.food_delivery_backend.payload.request;

import jakarta.validation.constraints.NotNull;

/** Body for PATCH /api/admin/users/{id}/enabled — suspend or reinstate an account. */
public class EnabledRequest {

    @NotNull(message = "enabled is required")
    private Boolean enabled;

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
}
