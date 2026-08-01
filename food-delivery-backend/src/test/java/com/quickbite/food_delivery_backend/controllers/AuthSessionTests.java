package com.quickbite.food_delivery_backend.controllers;

import com.quickbite.food_delivery_backend.ApiTestSupport;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthSessionTests extends ApiTestSupport {

    @Test
    @DisplayName("sign-in carries restaurantId for a RESTAURANT account and omits it otherwise")
    void signInIncludesRestaurantIdForOwners() throws Exception {
        mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", owner.getEmail(), "password", PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.restaurantId").value(restaurant.getId()));

        mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", customer.getEmail(), "password", PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.restaurantId").doesNotExist());
    }

    @Test
    @DisplayName("GET /me returns the signed-in user, with restaurantId for owners")
    void meReturnsCurrentUser() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Authorization", token(customer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(customer.getEmail()))
                .andExpect(jsonPath("$.role").value("ROLE_CUSTOMER"))
                .andExpect(jsonPath("$.mobile").value("+91 90000 00000"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.restaurantId").doesNotExist());

        mockMvc.perform(get("/api/auth/me").header("Authorization", token(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.restaurantId").value(restaurant.getId()));
    }

    @Test
    @DisplayName("/me is not public even though it sits under the permitted /api/auth prefix")
    void meRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("a user can change their own password and must then use the new one")
    void changePasswordRoundTrip() throws Exception {
        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", token(customer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("currentPassword", PASSWORD,
                                "newPassword", "brand-new-password"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password updated successfully"));

        mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", customer.getEmail(), "password", PASSWORD))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", customer.getEmail(),
                                "password", "brand-new-password"))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("changing a password requires the current one and rejects a no-op change")
    void changePasswordGuards() throws Exception {
        String customerToken = token(customer);

        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("currentPassword", "not-my-password",
                                "newPassword", "something-else"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Current password is incorrect"));

        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("currentPassword", PASSWORD, "newPassword", PASSWORD))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value("New password must differ from the current one"));

        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("currentPassword", PASSWORD, "newPassword", "abc"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.newPassword").exists());
    }

    @Test
    @DisplayName("change-password is unreachable without a token")
    void changePasswordRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("currentPassword", "a", "newPassword", "bbbbbb"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("the OpenAPI document is served and lists the new endpoints")
    void openApiDocumentIsPublished() throws Exception {
        String doc = mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        org.assertj.core.api.Assertions.assertThat(doc)
                .contains("/api/auth/me")
                .contains("/api/auth/change-password")
                .contains("/api/restaurants/my")
                .contains("/api/restaurants/{restaurantId}/menu")
                .contains("/api/delivery/available")
                .contains("/api/delivery/orders/{orderId}/accept")
                .contains("/api/delivery/earnings")
                .contains("/api/delivery/profile")
                .contains("/api/admin/users")
                .contains("/api/admin/stats")
                .contains("/api/admin/delivery-partners");
    }
}
