package com.quickbite.food_delivery_backend.models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    // OrderResponse exposes customerId/customerName instead of the whole User.
    @JsonIgnore
    private User user;

    @ManyToOne
    @JoinColumn(name = "restaurant_id", nullable = false)
    // The restaurant's menu and owner are LAZY; an order only needs the restaurant's own
    // details, so skip them rather than force-loading them for every order in a list.
    @JsonIgnoreProperties({ "menu", "owner" })
    private Restaurant restaurant;

    /** Set once a courier accepts the job; null while the order is still unclaimed. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_partner_id")
    @JsonIgnore
    private User deliveryPartner;

    private Double totalAmount;

    private Double deliveryFee;

    private String paymentMethod;

    @Enumerated(EnumType.STRING)
    private EOrderStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String deliveryAddress;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    public Order() {}

    public Order(User user, Restaurant restaurant, Double totalAmount, String deliveryAddress) {
        this.user = user;
        this.restaurant = restaurant;
        this.totalAmount = totalAmount;
        this.deliveryAddress = deliveryAddress;
        this.status = EOrderStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Restaurant getRestaurant() { return restaurant; }
    public void setRestaurant(Restaurant restaurant) { this.restaurant = restaurant; }

    public User getDeliveryPartner() { return deliveryPartner; }
    public void setDeliveryPartner(User deliveryPartner) { this.deliveryPartner = deliveryPartner; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public Double getDeliveryFee() { return deliveryFee; }
    public void setDeliveryFee(Double deliveryFee) { this.deliveryFee = deliveryFee; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public EOrderStatus getStatus() { return status; }
    public void setStatus(EOrderStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
    
    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
}
