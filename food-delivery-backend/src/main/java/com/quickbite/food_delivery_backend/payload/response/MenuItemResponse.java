package com.quickbite.food_delivery_backend.payload.response;

import com.quickbite.food_delivery_backend.models.MenuItem;

public class MenuItemResponse {

    private final Long id;
    private final String name;
    private final String description;
    private final Double price;
    private final Boolean vegetarian;
    private final String category;
    private final Boolean available;
    private final String image;
    private final Long restaurantId;

    private MenuItemResponse(MenuItem item) {
        this.id = item.getId();
        this.name = item.getName();
        this.description = item.getDescription();
        this.price = item.getPrice();
        this.vegetarian = item.getVegetarian();
        this.category = item.getCategory();
        this.available = item.getAvailable();
        this.image = item.getImage();
        // Reading the id off a lazy proxy does not trigger a load, so this is safe on a
        // detached MenuItem.
        this.restaurantId = item.getRestaurant() != null ? item.getRestaurant().getId() : null;
    }

    public static MenuItemResponse from(MenuItem item) {
        return item == null ? null : new MenuItemResponse(item);
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public Double getPrice() { return price; }
    public Boolean getVegetarian() { return vegetarian; }
    public String getCategory() { return category; }
    public Boolean getAvailable() { return available; }
    public String getImage() { return image; }
    public Long getRestaurantId() { return restaurantId; }
}
