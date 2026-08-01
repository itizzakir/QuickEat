import { axiosInstance, apiErrorMessage } from "./api";

/**
 * Sign-in / sign-up run through the shared axios instance so error bodies are parsed the same
 * way everywhere. These used to use bare fetch() and call response.json() on failures — which
 * threw a confusing parse error back when the backend returned an HTML error page.
 */

const login = async (email, password) => {
  try {
    const response = await axiosInstance.post("/auth/signin", { email, password });
    if (!response.data?.token) {
      throw new Error("Token missing in response");
    }
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Login failed"));
  }
};

const register = async (userData) => {
  // Map the UI's role vocabulary onto the backend enum. ADMIN is deliberately absent: the
  // public signup endpoint rejects it, and admins are created from the admin dashboard.
  let role = "ROLE_CUSTOMER";
  if (userData.role) {
    const r = userData.role.toUpperCase();
    if (r === "RESTAURANT" || r === "RESTAURANT_OWNER") role = "ROLE_RESTAURANT";
    else if (r === "DELIVERY" || r === "DELIVERY_PARTNER") role = "ROLE_DELIVERY";
  }

  const payload = {
    fullName: userData.name,
    email: userData.email,
    password: userData.password,
    role,
    mobile: userData.phone || userData.businessPhone,

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
    deliveryZone: userData.zone,
    idProofUrl: userData.idProofUrl,
  };

  try {
    const response = await axiosInstance.post("/auth/signup", payload);
    return response.data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Registration failed"));
  }
};

export const authService = {
  login,
  register,
};
