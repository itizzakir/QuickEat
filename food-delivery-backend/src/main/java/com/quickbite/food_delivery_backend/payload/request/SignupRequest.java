package com.quickbite.food_delivery_backend.payload.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SignupRequest {
    @NotBlank
    @Size(min = 3, max = 20)
    private String fullName;
 
    @NotBlank
    @Size(max = 50)
    @Email
    private String email;
    
    private String role;
    
    @NotBlank
    @Size(min = 6, max = 40)
    private String password;
    
    private String mobile;
    
    // Address Details
    private String addressLine1;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    
    // Restaurant Details
    private String businessName;
    private String businessEmail;
    private String businessPhone;
    private String categories; // Comma separated
    private String imageUrl;
    
    // Delivery Details
    private String vehicleType;
    private String vehicleModel;
    private String licenseNumber;
    private String vehicleRegistrationNumber;
    private String deliveryZone;
    private String idProofUrl;
}
