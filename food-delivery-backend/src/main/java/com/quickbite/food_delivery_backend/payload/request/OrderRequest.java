package com.quickbite.food_delivery_backend.payload.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Only {@code items} and {@code deliveryAddress} are trusted.
 *
 * <p>The customer comes from the JWT principal, the restaurant is derived from the items, and
 * the order total is recomputed server-side from current menu prices. {@code totalPrice} and
 * {@code restaurantId} are still accepted so existing clients keep working, but their values
 * are ignored — previously the client's total was persisted verbatim, so any order could be
 * bought for any price.
 */
public class OrderRequest {

    @NotEmpty(message = "An order must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;

    private String deliveryAddress;

    /** Ignored. Retained only so older payloads still deserialise. */
    private Double totalPrice;

    /** Ignored — the restaurant is derived from the ordered items. */
    private Long restaurantId;

    /** Ignored — the customer is taken from the authenticated principal. */
    private Long customerId;

    /** Free text for now (the checkout is a mock); defaults to "MOCK" when absent. */
    private String paymentMethod;

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public Double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }

    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
}
