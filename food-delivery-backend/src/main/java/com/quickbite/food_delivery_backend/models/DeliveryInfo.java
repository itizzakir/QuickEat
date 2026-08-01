package com.quickbite.food_delivery_backend.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "delivery_info")
@Data
@NoArgsConstructor
public class DeliveryInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String vehicleType;

    @Column(nullable = false)
    private String vehicleModel;

    @Column(nullable = false)
    private String licenseNumber;

    @Column(nullable = false)
    private String vehicleRegistrationNumber;

    @Column(nullable = false)
    private String deliveryZone;
    
    private String idProofUrl;

    public DeliveryInfo(User user, String vehicleType, String vehicleModel, String licenseNumber, 
                        String vehicleRegistrationNumber, String deliveryZone, String idProofUrl) {
        this.user = user;
        this.vehicleType = vehicleType;
        this.vehicleModel = vehicleModel;
        this.licenseNumber = licenseNumber;
        this.vehicleRegistrationNumber = vehicleRegistrationNumber;
        this.deliveryZone = deliveryZone;
        this.idProofUrl = idProofUrl;
    }
    
    // Manual Getters and Setters if lombok fails
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
    
    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }
    
    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    
    public String getVehicleRegistrationNumber() { return vehicleRegistrationNumber; }
    public void setVehicleRegistrationNumber(String vehicleRegistrationNumber) { this.vehicleRegistrationNumber = vehicleRegistrationNumber; }
    
    public String getDeliveryZone() { return deliveryZone; }
    public void setDeliveryZone(String deliveryZone) { this.deliveryZone = deliveryZone; }
    
    public String getIdProofUrl() { return idProofUrl; }
    public void setIdProofUrl(String idProofUrl) { this.idProofUrl = idProofUrl; }
}
