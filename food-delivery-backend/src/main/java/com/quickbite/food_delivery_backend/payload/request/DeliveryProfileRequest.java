package com.quickbite.food_delivery_backend.payload.request;

import jakarta.validation.constraints.NotBlank;

/** Vehicle and zone details a courier may maintain about themselves. */
public class DeliveryProfileRequest {

    @NotBlank(message = "vehicleType is required")
    private String vehicleType;

    @NotBlank(message = "vehicleModel is required")
    private String vehicleModel;

    @NotBlank(message = "licenseNumber is required")
    private String licenseNumber;

    @NotBlank(message = "vehicleRegistrationNumber is required")
    private String vehicleRegistrationNumber;

    @NotBlank(message = "deliveryZone is required")
    private String deliveryZone;

    private String idProofUrl;

    /** Optional on the profile PUT; omit to leave the current state alone. */
    private Boolean available;

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public String getVehicleRegistrationNumber() { return vehicleRegistrationNumber; }
    public void setVehicleRegistrationNumber(String value) { this.vehicleRegistrationNumber = value; }

    public String getDeliveryZone() { return deliveryZone; }
    public void setDeliveryZone(String deliveryZone) { this.deliveryZone = deliveryZone; }

    public String getIdProofUrl() { return idProofUrl; }
    public void setIdProofUrl(String idProofUrl) { this.idProofUrl = idProofUrl; }

    public Boolean getAvailable() { return available; }
    public void setAvailable(Boolean available) { this.available = available; }
}
