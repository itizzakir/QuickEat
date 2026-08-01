const API_URL = "/api/auth/";

const login = async (email, password) => {
  try {
    const response = await fetch(API_URL + "signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (response.ok) {
      if (data.token) {
        // Return user data structured like the app expects
        return data;
      } else {
         throw new Error("Token missing in response");
      }
    } else {
      throw new Error(data.message || "Login failed");
    }
  } catch (error) {
    console.error("AuthService Login Error:", error);
    throw error;
  }
};

const register = async (userData) => {
  // Map frontend role to backend ERole
  let role = "ROLE_CUSTOMER";
  if (userData.role) {
      const r = userData.role.toUpperCase();
      if (r === 'RESTAURANT' || r === 'RESTAURANT_OWNER') role = "ROLE_RESTAURANT";
      else if (r === 'DELIVERY' || r === 'DELIVERY_PARTNER') role = "ROLE_DELIVERY";
      else if (r === 'ADMIN') role = "ROLE_ADMIN";
  }

  // Construct payload with all potential fields
  const payload = {
      fullName: userData.name,
      email: userData.email,
      password: userData.password,
      role: role,
      mobile: userData.phone || userData.businessPhone, // Use business phone for restaurant if main phone empty
      
      // Address
      addressLine1: userData.addressLine1,
      city: userData.city,
      state: userData.state,
      postalCode: userData.postalCode,
      country: userData.country,
      
      // Restaurant
      businessName: userData.businessName,
      businessEmail: userData.businessEmail,
      businessPhone: userData.businessPhone,
      categories: userData.categories,
      imageUrl: userData.imageUrl,
      
      // Delivery
      vehicleType: userData.vehicleType,
      vehicleModel: userData.vehicleModel,
      licenseNumber: userData.licenseNumber,
      vehicleRegistrationNumber: userData.vehicleRegistrationNumber,
      deliveryZone: userData.zone, // mapped from 'zone' to 'deliveryZone'
      idProofUrl: userData.idProofUrl
  };

  try {
    const response = await fetch(API_URL + "signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }
    
    return data;
  } catch (error) {
    console.error("AuthService Register Error:", error);
    throw error;
  }
};

export const authService = {
  login,
  register
};
