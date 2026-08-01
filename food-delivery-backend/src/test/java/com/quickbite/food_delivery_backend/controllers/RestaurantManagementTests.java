package com.quickbite.food_delivery_backend.controllers;

import com.quickbite.food_delivery_backend.ApiTestSupport;
import com.quickbite.food_delivery_backend.models.EOrderStatus;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RestaurantManagementTests extends ApiTestSupport {

    private Map<String, Object> edit() {
        return Map.of("name", "Test Kitchen Renamed", "description", "Now with more burgers",
                "address", "1 Test Street", "image", "/images/food/burger-board.jpg",
                "category", "Burgers, American", "deliveryTime", 25, "deliveryFee", "FREE");
    }

    @Test
    @DisplayName("GET /my returns the owner's own restaurant with its menu")
    void ownerSeesOwnRestaurant() throws Exception {
        mockMvc.perform(get("/api/restaurants/my").header("Authorization", token(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(restaurant.getId()))
                .andExpect(jsonPath("$.name").value("Test Kitchen"))
                .andExpect(jsonPath("$.menu.length()").value(2));
    }

    @Test
    @DisplayName("GET /my is 403 for a customer and 401 without a token")
    void myRestaurantIsRestricted() throws Exception {
        mockMvc.perform(get("/api/restaurants/my").header("Authorization", token(customer)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/restaurants/my"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("/my is routed as a literal, not swallowed by /{id}")
    void myDoesNotCollideWithIdPath() throws Exception {
        mockMvc.perform(get("/api/restaurants/{id}", restaurant.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Kitchen"));
    }

    @Test
    @DisplayName("owner can edit their restaurant")
    void ownerCanEdit() throws Exception {
        mockMvc.perform(put("/api/restaurants/{id}", restaurant.getId())
                        .header("Authorization", token(owner))
                        .contentType(MediaType.APPLICATION_JSON).content(json(edit())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Kitchen Renamed"))
                .andExpect(jsonPath("$.deliveryFee").value("FREE"));

        assertThat(restaurantRepository.findById(restaurant.getId()).orElseThrow().getDeliveryTime())
                .isEqualTo(25);
    }

    @Test
    @DisplayName("403: right role, wrong owner — a rival cannot edit this restaurant")
    void otherOwnerCannotEdit() throws Exception {
        mockMvc.perform(put("/api/restaurants/{id}", restaurant.getId())
                        .header("Authorization", token(otherOwner))
                        .contentType(MediaType.APPLICATION_JSON).content(json(edit())))
                .andExpect(status().isForbidden());

        assertThat(restaurantRepository.findById(restaurant.getId()).orElseThrow().getName())
                .isEqualTo("Test Kitchen");
    }

    @Test
    @DisplayName("403: wrong role — a customer cannot edit a restaurant")
    void customerCannotEdit() throws Exception {
        mockMvc.perform(put("/api/restaurants/{id}", restaurant.getId())
                        .header("Authorization", token(customer))
                        .contentType(MediaType.APPLICATION_JSON).content(json(edit())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("an owner cannot self-approve or self-rate through the edit endpoint")
    void editCannotChangeApprovalOrRating() throws Exception {
        restaurant.setApproved(Boolean.FALSE);
        restaurantRepository.save(restaurant);

        mockMvc.perform(put("/api/restaurants/{id}", restaurant.getId())
                        .header("Authorization", token(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("name", "Test Kitchen", "approved", true,
                                "rating", 5.0))))
                .andExpect(status().isOk());

        var reloaded = restaurantRepository.findById(restaurant.getId()).orElseThrow();
        assertThat(reloaded.getApproved()).isFalse();
        assertThat(reloaded.getRating()).isEqualTo(4.4);
    }

    @Test
    @DisplayName("owner sees a paged order feed, newest first")
    void ownerSeesOrders() throws Exception {
        order(customer, restaurant, EOrderStatus.PENDING, null);
        order(customer, restaurant, EOrderStatus.CONFIRMED, null);
        order(customer, otherRestaurant, EOrderStatus.PENDING, null);

        mockMvc.perform(get("/api/restaurants/{id}/orders", restaurant.getId())
                        .header("Authorization", token(owner))
                        .param("page", "0").param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].items.length()").value(1))
                .andExpect(jsonPath("$.content[0].customerName").value("Cara Customer"));
    }

    @Test
    @DisplayName("403: a rival owner cannot read this restaurant's order feed")
    void otherOwnerCannotReadOrders() throws Exception {
        order(customer, restaurant, EOrderStatus.PENDING, null);

        mockMvc.perform(get("/api/restaurants/{id}/orders", restaurant.getId())
                        .header("Authorization", token(otherOwner)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/restaurants/{id}/orders", restaurant.getId())
                        .header("Authorization", token(customer)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("the order feed is not reachable anonymously despite living under a public prefix")
    void orderFeedIsNotPublic() throws Exception {
        mockMvc.perform(get("/api/restaurants/{id}/orders", restaurant.getId()))
                .andExpect(status().isUnauthorized());
    }
}
