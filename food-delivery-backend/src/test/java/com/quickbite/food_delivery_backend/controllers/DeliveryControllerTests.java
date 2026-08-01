package com.quickbite.food_delivery_backend.controllers;

import com.quickbite.food_delivery_backend.ApiTestSupport;
import com.quickbite.food_delivery_backend.models.EOrderStatus;
import com.quickbite.food_delivery_backend.models.Order;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class DeliveryControllerTests extends ApiTestSupport {

    @Test
    @DisplayName("the job board lists only unclaimed, ready-for-pickup orders")
    void availableListsUnclaimedReadyOrders() throws Exception {
        Order ready = order(customer, restaurant, EOrderStatus.READY_FOR_PICKUP, null);
        order(customer, restaurant, EOrderStatus.PREPARING, null);          // not ready
        order(customer, restaurant, EOrderStatus.READY_FOR_PICKUP, courier); // already claimed

        mockMvc.perform(get("/api/delivery/available").header("Authorization", token(courier)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(ready.getId()));
    }

    @Test
    @DisplayName("a courier accepts a job and it disappears from the board")
    void acceptClaimsTheOrder() throws Exception {
        Order ready = order(customer, restaurant, EOrderStatus.READY_FOR_PICKUP, null);

        mockMvc.perform(post("/api/delivery/orders/{id}/accept", ready.getId())
                        .header("Authorization", token(courier)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deliveryPartnerId").value(courier.getId()));

        mockMvc.perform(get("/api/delivery/available").header("Authorization", token(otherCourier)))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("409: a second courier accepting an already-claimed job loses the race")
    void secondAcceptConflicts() throws Exception {
        Order ready = order(customer, restaurant, EOrderStatus.READY_FOR_PICKUP, null);

        mockMvc.perform(post("/api/delivery/orders/{id}/accept", ready.getId())
                        .header("Authorization", token(courier)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/delivery/orders/{id}/accept", ready.getId())
                        .header("Authorization", token(otherCourier)))
                .andExpect(status().isConflict());

        assertThat(orderRepository.findById(ready.getId()).orElseThrow()
                .getDeliveryPartner().getId()).isEqualTo(courier.getId());
    }

    @Test
    @DisplayName("409: a job that is not ready for pickup cannot be accepted")
    void cannotAcceptOrderThatIsNotReady() throws Exception {
        Order preparing = order(customer, restaurant, EOrderStatus.PREPARING, null);

        mockMvc.perform(post("/api/delivery/orders/{id}/accept", preparing.getId())
                        .header("Authorization", token(courier)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("the assigned courier walks the order to DELIVERED")
    void assignedCourierAdvancesStatus() throws Exception {
        Order claimed = order(customer, restaurant, EOrderStatus.READY_FOR_PICKUP, courier);
        String courierToken = token(courier);

        patchStatus(claimed.getId(), courierToken, "PICKED_UP").andExpect(status().isOk());
        patchStatus(claimed.getId(), courierToken, "OUT_FOR_DELIVERY").andExpect(status().isOk());
        patchStatus(claimed.getId(), courierToken, "DELIVERED")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DELIVERED"));

        assertThat(orderRepository.findById(claimed.getId()).orElseThrow().getStatus())
                .isEqualTo(EOrderStatus.DELIVERED);
    }

    @Test
    @DisplayName("an illegal jump is rejected even for the assigned courier")
    void illegalTransitionRejected() throws Exception {
        Order claimed = order(customer, restaurant, EOrderStatus.READY_FOR_PICKUP, courier);

        patchStatus(claimed.getId(), token(courier), "DELIVERED")
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("403: right role, wrong courier — an unassigned partner cannot advance the order")
    void otherCourierCannotAdvance() throws Exception {
        Order claimed = order(customer, restaurant, EOrderStatus.READY_FOR_PICKUP, courier);

        patchStatus(claimed.getId(), token(otherCourier), "PICKED_UP")
                .andExpect(status().isForbidden());

        assertThat(orderRepository.findById(claimed.getId()).orElseThrow().getStatus())
                .isEqualTo(EOrderStatus.READY_FOR_PICKUP);
    }

    @Test
    @DisplayName("403: wrong role — customers and restaurants cannot use the delivery API")
    void wrongRolesAreRefused() throws Exception {
        mockMvc.perform(get("/api/delivery/available").header("Authorization", token(customer)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/delivery/available").header("Authorization", token(owner)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/delivery/my-deliveries").header("Authorization", token(customer)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("my-deliveries splits active from completed, scoped to the caller")
    void myDeliveriesIsScopedToCaller() throws Exception {
        order(customer, restaurant, EOrderStatus.OUT_FOR_DELIVERY, courier);
        order(customer, restaurant, EOrderStatus.DELIVERED, courier);
        order(customer, restaurant, EOrderStatus.DELIVERED, otherCourier);

        mockMvc.perform(get("/api/delivery/my-deliveries").header("Authorization", token(courier)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active.length()").value(1))
                .andExpect(jsonPath("$.completed.length()").value(1));
    }

    @Test
    @DisplayName("earnings count only this courier's delivered orders")
    void earningsAreScopedAndSummed() throws Exception {
        order(customer, restaurant, EOrderStatus.DELIVERED, courier);       // fee 29
        order(customer, restaurant, EOrderStatus.DELIVERED, courier);       // fee 29
        order(customer, restaurant, EOrderStatus.OUT_FOR_DELIVERY, courier); // not counted
        order(customer, restaurant, EOrderStatus.DELIVERED, otherCourier);   // not mine

        mockMvc.perform(get("/api/delivery/earnings").header("Authorization", token(courier)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deliveriesToday").value(2))
                .andExpect(jsonPath("$.earningsToday").value(58.0))
                .andExpect(jsonPath("$.deliveriesThisWeek").value(2));
    }

    @Test
    @DisplayName("profile round-trips through the DeliveryInfo entity")
    void profileRoundTrip() throws Exception {
        String courierToken = token(courier);

        // No row yet for a courier who signed up before these details were captured.
        mockMvc.perform(get("/api/delivery/profile").header("Authorization", courierToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(courier.getId()))
                .andExpect(jsonPath("$.vehicleType").doesNotExist());

        mockMvc.perform(put("/api/delivery/profile")
                        .header("Authorization", courierToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "vehicleType", "MOTORCYCLE",
                                "vehicleModel", "Honda Activa 6G",
                                "licenseNumber", "JH05 2019",
                                "vehicleRegistrationNumber", "JH05CJ4821",
                                "deliveryZone", "Bistupur"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vehicleModel").value("Honda Activa 6G"));

        mockMvc.perform(get("/api/delivery/profile").header("Authorization", courierToken))
                .andExpect(jsonPath("$.deliveryZone").value("Bistupur"));

        assertThat(deliveryInfoRepository.findByUserId(courier.getId())).isPresent();
    }

    @Test
    @DisplayName("profile validation rejects a blank vehicle type")
    void profileValidation() throws Exception {
        mockMvc.perform(put("/api/delivery/profile")
                        .header("Authorization", token(courier))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("vehicleModel", "Activa"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.vehicleType").exists());
    }

    private org.springframework.test.web.servlet.ResultActions patchStatus(
            Long orderId, String token, String status) throws Exception {
        return mockMvc.perform(patch("/api/delivery/orders/{id}/status", orderId)
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"" + status + "\"}"));
    }
}
