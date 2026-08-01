package com.quickbite.food_delivery_backend.payload.response;

/**
 * Real numbers for the admin overview cards, which previously rendered hardcoded
 * 1,234 users / $45,678 revenue / 4.6 rating.
 */
public class AdminStatsResponse {

    private final long totalUsers;
    private final long totalCustomers;
    private final long totalRestaurants;
    private final long approvedRestaurants;
    private final long pendingRestaurants;
    private final long totalDeliveryPartners;
    private final long ordersToday;
    private final double revenueToday;
    private final long totalOrders;
    private final double averageRating;

    public AdminStatsResponse(long totalUsers, long totalCustomers, long totalRestaurants,
                              long approvedRestaurants, long pendingRestaurants,
                              long totalDeliveryPartners, long ordersToday, double revenueToday,
                              long totalOrders, double averageRating) {
        this.totalUsers = totalUsers;
        this.totalCustomers = totalCustomers;
        this.totalRestaurants = totalRestaurants;
        this.approvedRestaurants = approvedRestaurants;
        this.pendingRestaurants = pendingRestaurants;
        this.totalDeliveryPartners = totalDeliveryPartners;
        this.ordersToday = ordersToday;
        this.revenueToday = revenueToday;
        this.totalOrders = totalOrders;
        this.averageRating = averageRating;
    }

    public long getTotalUsers() { return totalUsers; }
    public long getTotalCustomers() { return totalCustomers; }
    public long getTotalRestaurants() { return totalRestaurants; }
    public long getApprovedRestaurants() { return approvedRestaurants; }
    public long getPendingRestaurants() { return pendingRestaurants; }
    public long getTotalDeliveryPartners() { return totalDeliveryPartners; }
    public long getOrdersToday() { return ordersToday; }
    public double getRevenueToday() { return revenueToday; }
    public long getTotalOrders() { return totalOrders; }
    public double getAverageRating() { return averageRating; }
}
