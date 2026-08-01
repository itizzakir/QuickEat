package com.quickbite.food_delivery_backend.payload.response;

import com.quickbite.food_delivery_backend.models.Restaurant;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Restaurant view for the public catalogue. The owner is never exposed.
 *
 * <p>{@code menu} is null on list responses and populated on the detail response, matching the
 * repository fetch plan — the listing must not ship the whole catalogue.
 */
public class RestaurantResponse {

    private final Long id;
    private final String name;
    private final String description;
    private final String address;
    private final String image;
    private final Double rating;
    private final Integer deliveryTime;
    private final String deliveryFee;
    private final String discount;
    private final String category;
    private final Boolean approved;
    private final List<MenuItemResponse> menu;

    private RestaurantResponse(Restaurant restaurant, boolean includeMenu) {
        this.id = restaurant.getId();
        this.name = restaurant.getName();
        this.description = restaurant.getDescription();
        this.address = restaurant.getAddress();
        this.image = restaurant.getImage();
        this.rating = restaurant.getRating();
        this.deliveryTime = restaurant.getDeliveryTime();
        this.deliveryFee = restaurant.getDeliveryFee();
        this.discount = restaurant.getDiscount();
        this.category = restaurant.getCategory();
        this.approved = restaurant.getApproved();
        this.menu = includeMenu
                ? restaurant.getMenu().stream().map(MenuItemResponse::from).collect(Collectors.toList())
                : null;
    }

    /** Listing view — no menu. */
    public static RestaurantResponse summary(Restaurant restaurant) {
        return restaurant == null ? null : new RestaurantResponse(restaurant, false);
    }

    /** Detail view — includes the menu, which the caller must have fetched. */
    public static RestaurantResponse detail(Restaurant restaurant) {
        return restaurant == null ? null : new RestaurantResponse(restaurant, true);
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getAddress() { return address; }
    public String getImage() { return image; }
    public Double getRating() { return rating; }
    public Integer getDeliveryTime() { return deliveryTime; }
    public String getDeliveryFee() { return deliveryFee; }
    public String getDiscount() { return discount; }
    public String getCategory() { return category; }
    public Boolean getApproved() { return approved; }
    public List<MenuItemResponse> getMenu() { return menu; }
}
