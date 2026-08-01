package com.quickbite.food_delivery_backend.payload.request;

import jakarta.validation.constraints.NotNull;

/** Body for PATCH /api/admin/restaurants/{id}/approved. */
public class ApprovedRequest {

    @NotNull(message = "approved is required")
    private Boolean approved;

    public Boolean getApproved() { return approved; }
    public void setApproved(Boolean approved) { this.approved = approved; }
}
