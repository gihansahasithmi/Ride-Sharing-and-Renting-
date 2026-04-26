package com.riderenting.admin.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record DashboardResponse(
            Map<String, Long> userCounts,
            Map<String, Long> bikeCounts,
            Map<String, Object> rentalCounts,
            BigDecimal revenue,
            List<?> users,
            List<?> bikes,
            List<?> rentals
    ) {
    }
}
