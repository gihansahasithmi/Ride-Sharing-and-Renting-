package com.riderenting.admin.service;

import com.riderenting.admin.dto.AdminDtos.DashboardResponse;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class AdminService {

    private final RestClient.Builder restClientBuilder;
    private final String authServiceUrl;
    private final String bikeServiceUrl;
    private final String rentalServiceUrl;

    public AdminService(RestClient.Builder restClientBuilder,
                        @Value("${services.auth-service.url}") String authServiceUrl,
                        @Value("${services.bike-service.url}") String bikeServiceUrl,
                        @Value("${services.rental-service.url}") String rentalServiceUrl) {
        this.restClientBuilder = restClientBuilder;
        this.authServiceUrl = authServiceUrl;
        this.bikeServiceUrl = bikeServiceUrl;
        this.rentalServiceUrl = rentalServiceUrl;
    }

    @SuppressWarnings("unchecked")
    public DashboardResponse getDashboard() {
        RestClient client = restClientBuilder.build();

        Map<String, Object> authStats = client.get()
                .uri(authServiceUrl + "/api/auth/stats")
                .retrieve()
                .body(Map.class);
        Map<String, Object> bikeStats = client.get()
                .uri(bikeServiceUrl + "/api/bikes/stats")
                .retrieve()
                .body(Map.class);
        Map<String, Object> rentalStats = client.get()
                .uri(rentalServiceUrl + "/api/rentals/stats")
                .retrieve()
                .body(Map.class);
        Map<String, Object> bikeStatsPayload = client.get()
                .uri(bikeServiceUrl + "/api/bikes/stats")
                .retrieve()
                .body(Map.class);

        List<?> users = client.get()
                .uri(authServiceUrl + "/api/auth/users")
                .retrieve()
                .body(List.class);
        List<?> bikes = bikeStatsPayload != null && bikeStatsPayload.containsKey("bikes")
                ? (List<?>) bikeStatsPayload.get("bikes")
                : List.of();
        List<?> rentals = client.get()
                .uri(rentalServiceUrl + "/api/rentals")
                .retrieve()
                .body(List.class);

        Map<String, Long> userCounts = new LinkedHashMap<>();
        userCounts.put("users", asLong(authStats.get("totalUsers")));
        userCounts.put("owners", asLong(authStats.get("totalOwners")));
        userCounts.put("drivers", asLong(authStats.get("totalDrivers")));
        userCounts.put("admins", asLong(authStats.get("totalAdmins")));

        Map<String, Long> bikeCounts = new LinkedHashMap<>();
        bikeCounts.put("total", asLong(bikeStats.get("totalBikes")));
        bikeCounts.put("available", asLong(bikeStats.get("availableBikes")));
        bikeCounts.put("rented", asLong(bikeStats.get("rentedBikes")));

        Map<String, Object> rentalCounts = new LinkedHashMap<>();
        rentalCounts.put("total", asLong(rentalStats.get("totalRentals")));
        rentalCounts.put("pendingPayments", asLong(rentalStats.get("pendingPayments")));
        rentalCounts.put("approvedRentals", asLong(rentalStats.get("approvedRentals")));

        BigDecimal revenue = new BigDecimal(String.valueOf(rentalStats.get("totalRevenue")));

        return new DashboardResponse(userCounts, bikeCounts, rentalCounts, revenue, users, bikes, rentals);
    }

    private long asLong(Object value) {
        return value == null ? 0 : Long.parseLong(String.valueOf(value));
    }
}
