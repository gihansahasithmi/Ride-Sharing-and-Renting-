package com.riderenting.admin.service;

import com.riderenting.admin.dto.AdminDtos.DashboardResponse;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

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

        Map<String, Object> authStats = getMap(client, authServiceUrl + "/api/auth/stats");
        Map<String, Object> bikeStats = getMap(client, bikeServiceUrl + "/api/bikes/stats");
        Map<String, Object> rentalStats = getMap(client, rentalServiceUrl + "/api/rentals/stats");

        List<?> users = getList(client, authServiceUrl + "/api/auth/users");
        List<?> bikes = asList(bikeStats.get("bikes"));
        List<?> rentals = asList(rentalStats.get("rentals"));

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

        BigDecimal revenue = asBigDecimal(rentalStats.get("totalRevenue"));

        return new DashboardResponse(userCounts, bikeCounts, rentalCounts, revenue, users, bikes, rentals);
    }

    private long asLong(Object value) {
        return value == null ? 0 : Long.parseLong(String.valueOf(value));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getMap(RestClient client, String uri) {
        try {
            Map<String, Object> response = client.get()
                    .uri(uri)
                    .retrieve()
                    .body(Map.class);
            return response == null ? Map.of() : response;
        } catch (RestClientException ex) {
            return Map.of();
        }
    }

    @SuppressWarnings("unchecked")
    private List<?> getList(RestClient client, String uri) {
        try {
            List<?> response = client.get()
                    .uri(uri)
                    .retrieve()
                    .body(List.class);
            return response == null ? List.of() : response;
        } catch (RestClientException ex) {
            return List.of();
        }
    }

    private List<?> asList(Object value) {
        return value instanceof List<?> list ? list : List.of();
    }

    private BigDecimal asBigDecimal(Object value) {
        return value == null ? BigDecimal.ZERO : new BigDecimal(String.valueOf(value));
    }
}
