package com.quickbite.food_delivery_backend.payload.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Fields an owner may edit about their own restaurant. Rating and approval are deliberately
 * absent: an owner must not be able to award themselves five stars or self-approve.
 */
public class RestaurantUpdateRequest {

    @NotBlank(message = "name is required")
    @Size(max = 120)
    private String name;

    @Size(max = 1000)
    private String description;

    private String address;
    private String image;
    private String category;

    @Min(value = 5, message = "deliveryTime must be at least 5 minutes")
    @Max(value = 180, message = "deliveryTime must be 180 minutes or less")
    private Integer deliveryTime;

    private String deliveryFee;
    private String discount;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getDeliveryTime() { return deliveryTime; }
    public void setDeliveryTime(Integer deliveryTime) { this.deliveryTime = deliveryTime; }

    public String getDeliveryFee() { return deliveryFee; }
    public void setDeliveryFee(String deliveryFee) { this.deliveryFee = deliveryFee; }

    public String getDiscount() { return discount; }
    public void setDiscount(String discount) { this.discount = discount; }
}
