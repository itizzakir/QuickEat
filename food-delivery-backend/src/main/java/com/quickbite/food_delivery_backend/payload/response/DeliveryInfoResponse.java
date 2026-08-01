package com.quickbite.food_delivery_backend.payload.response;

import com.quickbite.food_delivery_backend.models.DeliveryInfo;
import com.quickbite.food_delivery_backend.models.User;

/** The delivery partner's vehicle and zone details, written at signup and never read back until now. */
public class DeliveryInfoResponse {

    private final Long id;
    private final Long userId;
    private final String fullName;
    private final String email;
    private final String mobile;
    private final String avatarUrl;
    private final String vehicleType;
    private final String vehicleModel;
    private final String licenseNumber;
    private final String vehicleRegistrationNumber;
    private final String deliveryZone;
    private final String idProofUrl;
    private final boolean active;
    private final boolean available;

    private DeliveryInfoResponse(User user, DeliveryInfo info) {
        this.id = info != null ? info.getId() : null;
        this.userId = user != null ? user.getId() : null;
        this.fullName = user != null ? user.getFullName() : null;
        this.email = user != null ? user.getEmail() : null;
        this.mobile = user != null ? user.getMobile() : null;
        this.avatarUrl = user != null ? user.getAvatarUrl() : null;
        this.active = user != null && user.isActive();
        this.vehicleType = info != null ? info.getVehicleType() : null;
        this.vehicleModel = info != null ? info.getVehicleModel() : null;
        this.licenseNumber = info != null ? info.getLicenseNumber() : null;
        this.vehicleRegistrationNumber = info != null ? info.getVehicleRegistrationNumber() : null;
        this.deliveryZone = info != null ? info.getDeliveryZone() : null;
        this.idProofUrl = info != null ? info.getIdProofUrl() : null;
        this.available = info == null || info.isAvailable();
    }

    public static DeliveryInfoResponse of(User user, DeliveryInfo info) {
        return new DeliveryInfoResponse(user, info);
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getMobile() { return mobile; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getVehicleType() { return vehicleType; }
    public String getVehicleModel() { return vehicleModel; }
    public String getLicenseNumber() { return licenseNumber; }
    public String getVehicleRegistrationNumber() { return vehicleRegistrationNumber; }
    public String getDeliveryZone() { return deliveryZone; }
    public String getIdProofUrl() { return idProofUrl; }
    public boolean isActive() { return active; }
    public boolean isAvailable() { return available; }
}
