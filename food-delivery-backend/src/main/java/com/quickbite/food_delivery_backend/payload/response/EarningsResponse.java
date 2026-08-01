package com.quickbite.food_delivery_backend.payload.response;

/** Delivery earnings, summed from the delivery fee actually recorded on each completed order. */
public class EarningsResponse {

    private final long deliveriesToday;
    private final double earningsToday;
    private final long deliveriesThisWeek;
    private final double earningsThisWeek;

    public EarningsResponse(long deliveriesToday, double earningsToday,
                            long deliveriesThisWeek, double earningsThisWeek) {
        this.deliveriesToday = deliveriesToday;
        this.earningsToday = earningsToday;
        this.deliveriesThisWeek = deliveriesThisWeek;
        this.earningsThisWeek = earningsThisWeek;
    }

    public long getDeliveriesToday() { return deliveriesToday; }
    public double getEarningsToday() { return earningsToday; }
    public long getDeliveriesThisWeek() { return deliveriesThisWeek; }
    public double getEarningsThisWeek() { return earningsThisWeek; }
}
