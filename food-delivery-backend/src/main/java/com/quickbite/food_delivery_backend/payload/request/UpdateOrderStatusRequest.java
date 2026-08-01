package com.quickbite.food_delivery_backend.payload.request;

import com.quickbite.food_delivery_backend.models.EOrderStatus;

import jakarta.validation.constraints.NotNull;

/**
 * Replaces the raw String body the status endpoint used to accept. Binding straight to the
 * enum means an unknown value is rejected by Jackson before any handler code runs.
 */
public class UpdateOrderStatusRequest {

    @NotNull(message = "status is required")
    private EOrderStatus status;

    public EOrderStatus getStatus() { return status; }
    public void setStatus(EOrderStatus status) { this.status = status; }
}
