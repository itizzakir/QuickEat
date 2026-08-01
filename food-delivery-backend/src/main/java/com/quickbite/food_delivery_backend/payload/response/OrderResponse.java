package com.quickbite.food_delivery_backend.payload.response;

import com.quickbite.food_delivery_backend.models.Order;
import com.quickbite.food_delivery_backend.models.OrderItem;
import com.quickbite.food_delivery_backend.models.Restaurant;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class OrderResponse {

    private final Long id;
    private final Long customerId;
    private final String customerName;
    private final RestaurantRef restaurant;
    private final String customerMobile;
    private final Double totalAmount;
    private final Double deliveryFee;
    private final String paymentMethod;
    private final String status;
    private final List<String> allowedNextStatuses;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final String deliveryAddress;
    private final Long deliveryPartnerId;
    private final String deliveryPartnerName;
    private final List<Item> items;

    private OrderResponse(Order order) {
        this.id = order.getId();
        this.customerId = order.getUser() != null ? order.getUser().getId() : null;
        this.customerName = order.getUser() != null ? order.getUser().getFullName() : null;
        this.customerMobile = order.getUser() != null ? order.getUser().getMobile() : null;
        this.restaurant = order.getRestaurant() != null ? new RestaurantRef(order.getRestaurant()) : null;
        this.totalAmount = order.getTotalAmount();
        this.deliveryFee = order.getDeliveryFee();
        this.paymentMethod = order.getPaymentMethod();
        this.status = order.getStatus() != null ? order.getStatus().name() : null;
        // Lets a dashboard render exactly the buttons that will be accepted.
        this.allowedNextStatuses = order.getStatus() == null
                ? List.of()
                : order.getStatus().nextStates().stream().map(Enum::name).collect(Collectors.toList());
        this.createdAt = order.getCreatedAt();
        this.updatedAt = order.getUpdatedAt();
        this.deliveryAddress = order.getDeliveryAddress();
        this.deliveryPartnerId = order.getDeliveryPartner() != null
                ? order.getDeliveryPartner().getId() : null;
        this.deliveryPartnerName = order.getDeliveryPartner() != null
                ? order.getDeliveryPartner().getFullName() : null;
        this.items = order.getItems().stream().map(Item::new).collect(Collectors.toList());
    }

    public static OrderResponse from(Order order) {
        return order == null ? null : new OrderResponse(order);
    }

    public Long getId() { return id; }
    public Long getCustomerId() { return customerId; }
    public String getCustomerName() { return customerName; }
    public RestaurantRef getRestaurant() { return restaurant; }
    public String getCustomerMobile() { return customerMobile; }
    public Double getTotalAmount() { return totalAmount; }
    public Double getDeliveryFee() { return deliveryFee; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getStatus() { return status; }
    public List<String> getAllowedNextStatuses() { return allowedNextStatuses; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public Long getDeliveryPartnerId() { return deliveryPartnerId; }
    public String getDeliveryPartnerName() { return deliveryPartnerName; }
    public List<Item> getItems() { return items; }

    /** Just enough of the restaurant to render an order row — no menu, no owner. */
    public static class RestaurantRef {
        private final Long id;
        private final String name;
        private final String image;

        private RestaurantRef(Restaurant restaurant) {
            this.id = restaurant.getId();
            this.name = restaurant.getName();
            this.image = restaurant.getImage();
        }

        public Long getId() { return id; }
        public String getName() { return name; }
        public String getImage() { return image; }
    }

    public static class Item {
        private final Long id;
        private final MenuItemResponse menuItem;
        private final Integer quantity;
        private final Double price;

        private Item(OrderItem orderItem) {
            this.id = orderItem.getId();
            this.menuItem = MenuItemResponse.from(orderItem.getMenuItem());
            this.quantity = orderItem.getQuantity();
            this.price = orderItem.getPrice();
        }

        public Long getId() { return id; }
        public MenuItemResponse getMenuItem() { return menuItem; }
        public Integer getQuantity() { return quantity; }
        public Double getPrice() { return price; }
    }
}
