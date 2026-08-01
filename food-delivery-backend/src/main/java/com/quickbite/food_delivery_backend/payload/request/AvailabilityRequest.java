package com.quickbite.food_delivery_backend.payload.request;

import jakarta.validation.constraints.NotNull;

/** Body for PATCH /menu/{id}/availability, backing the dashboard in-stock toggle. */
public class AvailabilityRequest {

    @NotNull(message = "available is required")
    private Boolean available;

    public Boolean getAvailable() { return available; }
    public void setAvailable(Boolean available) { this.available = available; }
}
