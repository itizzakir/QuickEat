package com.quickbite.food_delivery_backend.controllers;

import com.quickbite.food_delivery_backend.ApiTestSupport;
import com.quickbite.food_delivery_backend.models.MenuItem;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class MenuItemControllerTests extends ApiTestSupport {

    private Map<String, Object> dish() {
        return Map.of("name", "New Dish", "description", "Tasty", "price", 199.0,
                "vegetarian", true, "category", "Starters", "available", true,
                "image", "/images/food/samosa.jpg");
    }

    @Test
    @DisplayName("GET menu is public")
    void listIsPublic() throws Exception {
        mockMvc.perform(get("/api/restaurants/{id}/menu", restaurant.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("owner can create, update, toggle and delete a dish")
    void ownerManagesMenu() throws Exception {
        String ownerToken = token(owner);

        String created = mockMvc.perform(post("/api/restaurants/{id}/menu", restaurant.getId())
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(json(dish())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("New Dish"))
                .andExpect(jsonPath("$.restaurantId").value(restaurant.getId()))
                .andReturn().getResponse().getContentAsString();
        Long itemId = ((Number) objectMapper.readValue(created, Map.class).get("id")).longValue();

        mockMvc.perform(put("/api/restaurants/{r}/menu/{i}", restaurant.getId(), itemId)
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("name", "Renamed Dish", "price", 249.0))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed Dish"))
                .andExpect(jsonPath("$.price").value(249.0));

        mockMvc.perform(patch("/api/restaurants/{r}/menu/{i}/availability", restaurant.getId(), itemId)
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("available", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false));

        mockMvc.perform(delete("/api/restaurants/{r}/menu/{i}", restaurant.getId(), itemId)
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk());

        assertThat(menuItemRepository.findById(itemId)).isEmpty();
    }

    @Test
    @DisplayName("403: wrong role — a customer cannot add a dish")
    void customerCannotCreate() throws Exception {
        mockMvc.perform(post("/api/restaurants/{id}/menu", restaurant.getId())
                        .header("Authorization", token(customer))
                        .contentType(MediaType.APPLICATION_JSON).content(json(dish())))
                .andExpect(status().isForbidden());

        assertThat(menuItemRepository.findByRestaurantId(restaurant.getId())).hasSize(2);
    }

    @Test
    @DisplayName("403: right role, wrong owner — another restaurateur cannot touch this menu")
    void otherOwnerCannotManage() throws Exception {
        String intruder = token(otherOwner);

        mockMvc.perform(post("/api/restaurants/{id}/menu", restaurant.getId())
                        .header("Authorization", intruder)
                        .contentType(MediaType.APPLICATION_JSON).content(json(dish())))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/restaurants/{r}/menu/{i}/availability",
                        restaurant.getId(), burger.getId())
                        .header("Authorization", intruder)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("available", false))))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/restaurants/{r}/menu/{i}", restaurant.getId(), burger.getId())
                        .header("Authorization", intruder))
                .andExpect(status().isForbidden());

        assertThat(menuItemRepository.findById(burger.getId())).isPresent();
    }

    @Test
    @DisplayName("an owner cannot edit another restaurant's dish through their own URL")
    void cannotCrossRestaurantBoundary() throws Exception {
        MenuItem rivalDish = menuItem(otherRestaurant, "Rival Dish", 500.0);

        mockMvc.perform(put("/api/restaurants/{r}/menu/{i}", restaurant.getId(), rivalDish.getId())
                        .header("Authorization", token(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("name", "Hijacked", "price", 1.0))))
                .andExpect(status().isBadRequest());

        assertThat(menuItemRepository.findById(rivalDish.getId()).orElseThrow().getName())
                .isEqualTo("Rival Dish");
    }

    @Test
    @DisplayName("admin can manage any menu")
    void adminCanManageAnyMenu() throws Exception {
        mockMvc.perform(post("/api/restaurants/{id}/menu", restaurant.getId())
                        .header("Authorization", token(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(dish())))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("validation rejects a non-positive price")
    void validationRejectsBadPrice() throws Exception {
        mockMvc.perform(post("/api/restaurants/{id}/menu", restaurant.getId())
                        .header("Authorization", token(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("name", "Free Lunch", "price", 0.0))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.price").exists());
    }
}
