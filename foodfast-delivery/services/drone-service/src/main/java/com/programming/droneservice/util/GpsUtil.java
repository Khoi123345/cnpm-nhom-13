package com.programming.droneservice.util;

/**
 * Utility class để tính toán khoảng cách GPS, battery consumption, ETA
 */
public class GpsUtil {
    
    private static final double EARTH_RADIUS_KM = 6371.0;
    
    /**
     * Tính khoảng cách giữa 2 điểm GPS bằng công thức Haversine
     * 
     * @param lat1 Vĩ độ điểm 1
     * @param lng1 Kinh độ điểm 1
     * @param lat2 Vĩ độ điểm 2
     * @param lng2 Kinh độ điểm 2
     * @return Khoảng cách (km)
     */
    public static double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return EARTH_RADIUS_KM * c;
    }
    
    /**
     * Tính pin tiêu hao dựa trên khoảng cách
     * 
     * @param distanceKm Khoảng cách (km)
     * @param batteryConsumptionPerKm Pin tiêu hao mỗi km (%)
     * @return Pin tiêu hao (%)
     */
    public static double calculateBatteryConsumption(double distanceKm, double batteryConsumptionPerKm) {
        return distanceKm * batteryConsumptionPerKm;
    }
    
    /**
     * Tính thời gian dự kiến (phút)
     * 
     * @param distanceKm Khoảng cách (km)
     * @param speedKmh Tốc độ (km/h)
     * @return Thời gian (phút)
     */
    public static int calculateETA(double distanceKm, double speedKmh) {
        double hours = distanceKm / speedKmh;
        return (int) Math.ceil(hours * 60);
    }
    
    /**
     * Kiểm tra xem drone có đủ pin để bay khoảng cách này không
     * 
     * @param currentBattery Pin hiện tại (%)
     * @param distanceKm Khoảng cách (km)
     * @param batteryConsumptionPerKm Pin tiêu hao mỗi km (%)
     * @return true nếu đủ pin (còn ít nhất 20% sau khi bay)
     */
    public static boolean hasSufficientBattery(double currentBattery, double distanceKm, double batteryConsumptionPerKm) {
        double requiredBattery = calculateBatteryConsumption(distanceKm, batteryConsumptionPerKm);
        double remainingBattery = currentBattery - requiredBattery;
        return remainingBattery >= 20.0; // Luôn giữ ít nhất 20% pin dự phòng
    }
}
