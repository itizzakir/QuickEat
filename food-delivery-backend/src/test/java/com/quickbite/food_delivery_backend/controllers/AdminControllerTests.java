package com.quickbite.food_delivery_backend.controllers;

import com.quickbite.food_delivery_backend.ApiTestSupport;
import com.quickbite.food_delivery_backend.models.ERole;
import com.quickbite.food_delivery_backend.models.EOrderStatus;
import com.quickbite.food_delivery_backend.models.User;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminControllerTests extends ApiTestSupport {

    @Test
    @DisplayName("403: every non-admin role is refused on the whole admin API")
    void nonAdminsAreRefused() throws Exception {
        for (User u : new User[] { customer, owner, courier }) {
            String t = token(u);
            mockMvc.perform(get("/api/admin/users").header("Authorization", t))
                    .andExpect(status().isForbidden());
            mockMvc.perform(get("/api/admin/stats").header("Authorization", t))
                    .andExpect(status().isForbidden());
            mockMvc.perform(get("/api/admin/restaurants").header("Authorization", t))
                    .andExpect(status().isForbidden());
        }
        mockMvc.perform(get("/api/admin/users")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("user directory pages, filters by role and searches, and never leaks a hash")
    void userDirectory() throws Exception {
        String adminToken = token(admin);

        mockMvc.perform(get("/api/admin/users").header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(6))
                .andExpect(jsonPath("$.content[0].password").doesNotExist());

        mockMvc.perform(get("/api/admin/users").header("Authorization", adminToken)
                        .param("role", "ROLE_DELIVERY"))
                .andExpect(jsonPath("$.totalElements").value(2));

        mockMvc.perform(get("/api/admin/users").header("Authorization", adminToken)
                        .param("search", "olive"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].email").value("olive@test.dev"));

        String body = mockMvc.perform(get("/api/admin/users").header("Authorization", adminToken))
                .andReturn().getResponse().getContentAsString();
        assertThat(body).doesNotContain("$2a$");
    }

    @Test
    @DisplayName("admin creates a user with any role, including ADMIN")
    void adminCreatesAdmin() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", token(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("fullName", "Second Admin",
                                "email", "second.admin@test.dev",
                                "password", "password123",
                                "role", "ROLE_ADMIN"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("ROLE_ADMIN"));

        User created = userRepository.findByEmail("second.admin@test.dev").orElseThrow();
        assertThat(created.getRole()).isEqualTo(ERole.ROLE_ADMIN);
        // Stored hashed, and the new admin can actually sign in with the password given.
        assertThat(created.getPassword()).startsWith("$2a$");
        mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "second.admin@test.dev",
                                "password", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ROLE_ADMIN"));
    }

    @Test
    @DisplayName("409: creating a user with a taken email is refused")
    void duplicateEmailRefused() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", token(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("fullName", "Clone", "email", customer.getEmail(),
                                "password", "password123", "role", "ROLE_CUSTOMER"))))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("suspending a user blocks their sign-in; reinstating restores it")
    void suspendAndReinstate() throws Exception {
        String adminToken = token(admin);

        mockMvc.perform(patch("/api/admin/users/{id}/enabled", customer.getId())
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("enabled", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));

        mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", customer.getEmail(), "password", PASSWORD))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("This account has been suspended"));

        mockMvc.perform(patch("/api/admin/users/{id}/enabled", customer.getId())
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("enabled", true))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", customer.getEmail(), "password", PASSWORD))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("guard rail: an admin cannot disable or delete their own account")
    void adminCannotLockThemselvesOut() throws Exception {
        String adminToken = token(admin);

        mockMvc.perform(patch("/api/admin/users/{id}/enabled", admin.getId())
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("enabled", false))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("You cannot disable your own account"));

        mockMvc.perform(delete("/api/admin/users/{id}", admin.getId())
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("You cannot delete your own account"));

        assertThat(userRepository.findById(admin.getId()).orElseThrow().isActive()).isTrue();
    }

    @Test
    @DisplayName("guard rail: the last remaining admin cannot be deleted")
    void lastAdminCannotBeDeleted() throws Exception {
        User secondAdmin = user("Second Admin", "second@test.dev", ERole.ROLE_ADMIN);
        String secondToken = token(secondAdmin);

        // Two admins exist, so deleting one is allowed.
        mockMvc.perform(delete("/api/admin/users/{id}", admin.getId())
                        .header("Authorization", secondToken))
                .andExpect(status().isOk());

        // Now only secondAdmin remains and cannot remove themselves either way.
        mockMvc.perform(delete("/api/admin/users/{id}", secondAdmin.getId())
                        .header("Authorization", secondToken))
                .andExpect(status().isBadRequest());

        assertThat(userRepository.findByRole(ERole.ROLE_ADMIN)).hasSize(1);
    }

    @Test
    @DisplayName("409: a user with order history is not hard-deleted")
    void userWithOrdersCannotBeDeleted() throws Exception {
        order(customer, restaurant, EOrderStatus.DELIVERED, courier);

        mockMvc.perform(delete("/api/admin/users/{id}", customer.getId())
                        .header("Authorization", token(admin)))
                .andExpect(status().isConflict());

        assertThat(userRepository.findById(customer.getId())).isPresent();
    }

    @Test
    @DisplayName("a user without history is deleted")
    void cleanUserIsDeleted() throws Exception {
        User spare = user("Spare Customer", "spare@test.dev", ERole.ROLE_CUSTOMER);

        mockMvc.perform(delete("/api/admin/users/{id}", spare.getId())
                        .header("Authorization", token(admin)))
                .andExpect(status().isOk());

        assertThat(userRepository.findById(spare.getId())).isEmpty();
    }

    @Test
    @DisplayName("restaurants can be approved and unapproved")
    void approveRestaurant() throws Exception {
        restaurant.setApproved(Boolean.FALSE);
        restaurantRepository.save(restaurant);

        mockMvc.perform(patch("/api/admin/restaurants/{id}/approved", restaurant.getId())
                        .header("Authorization", token(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("approved", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approved").value(true));

        assertThat(restaurantRepository.findById(restaurant.getId()).orElseThrow().getApproved())
                .isTrue();
    }

    @Test
    @DisplayName("409: a restaurant with orders is not deleted")
    void restaurantWithOrdersCannotBeDeleted() throws Exception {
        order(customer, restaurant, EOrderStatus.PENDING, null);

        mockMvc.perform(delete("/api/admin/restaurants/{id}", restaurant.getId())
                        .header("Authorization", token(admin)))
                .andExpect(status().isConflict());

        mockMvc.perform(delete("/api/admin/restaurants/{id}", otherRestaurant.getId())
                        .header("Authorization", token(admin)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("delivery partners are listed with their vehicle details")
    void deliveryPartnerDirectory() throws Exception {
        mockMvc.perform(put("/api/delivery/profile")
                .header("Authorization", token(courier))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("vehicleType", "MOTORCYCLE", "vehicleModel", "Activa",
                        "licenseNumber", "L1", "vehicleRegistrationNumber", "R1",
                        "deliveryZone", "Sonari"))));

        mockMvc.perform(get("/api/admin/delivery-partners").header("Authorization", token(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[?(@.email=='dan@test.dev')].deliveryZone").value("Sonari"));
    }

    @Test
    @DisplayName("stats are computed from real rows, not hardcoded")
    void statsAreReal() throws Exception {
        order(customer, restaurant, EOrderStatus.DELIVERED, courier);   // 350
        order(customer, restaurant, EOrderStatus.PENDING, null);        // 350
        order(customer, restaurant, EOrderStatus.CANCELLED, null);      // excluded from revenue

        mockMvc.perform(get("/api/admin/stats").header("Authorization", token(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(6))
                .andExpect(jsonPath("$.totalCustomers").value(1))
                .andExpect(jsonPath("$.totalRestaurants").value(2))
                .andExpect(jsonPath("$.totalDeliveryPartners").value(2))
                .andExpect(jsonPath("$.ordersToday").value(3))
                .andExpect(jsonPath("$.revenueToday").value(700.0))
                .andExpect(jsonPath("$.totalOrders").value(3))
                .andExpect(jsonPath("$.averageRating").value(4.4));
    }

    @Test
    @DisplayName("admin edits a user without touching the password when it is blank")
    void updateKeepsPasswordWhenBlank() throws Exception {
        String originalHash = userRepository.findById(customer.getId()).orElseThrow().getPassword();

        Map<String, Object> payload = new HashMap<>();
        payload.put("fullName", "Cara Renamed");
        payload.put("email", customer.getEmail());
        payload.put("role", "ROLE_CUSTOMER");
        payload.put("password", "");

        mockMvc.perform(put("/api/admin/users/{id}", customer.getId())
                        .header("Authorization", token(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Cara Renamed"));

        assertThat(userRepository.findById(customer.getId()).orElseThrow().getPassword())
                .isEqualTo(originalHash);
    }
}
