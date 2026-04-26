package com.riderenting.bike.config;

import com.riderenting.bike.domain.Bike;
import com.riderenting.bike.domain.BikeStatus;
import com.riderenting.bike.repository.BikeRepository;
import java.math.BigDecimal;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BikeDataInitializer {

    @Bean
    CommandLineRunner seedBikes(BikeRepository bikeRepository) {
        return args -> {
            if (bikeRepository.count() > 0) {
                return;
            }

            Bike first = new Bike();
            first.setOwnerId(2L);
            first.setOwnerName("Sample Owner");
            first.setBrand("Yamaha");
            first.setModel("FZ-S");
            first.setRegistrationNumber("WP-CAB-4587");
            first.setEngineCapacityCc(150);
            first.setHourlyRate(new BigDecimal("4.50"));
            first.setDescription("Reliable city bike with helmet included.");
            first.setLocation("Colombo");
            first.setImageUrl("https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80");
            first.setStatus(BikeStatus.AVAILABLE);
            bikeRepository.save(first);

            Bike second = new Bike();
            second.setOwnerId(3L);
            second.setOwnerName("Trail Owner");
            second.setBrand("Honda");
            second.setModel("CB Hornet");
            second.setRegistrationNumber("CP-KLM-9012");
            second.setEngineCapacityCc(184);
            second.setHourlyRate(new BigDecimal("5.75"));
            second.setDescription("Comfortable rental for longer trips and weekend rides.");
            second.setLocation("Kandy");
            second.setImageUrl("https://images.unsplash.com/photo-1517846693594-1567da72af75?auto=format&fit=crop&w=900&q=80");
            second.setStatus(BikeStatus.AVAILABLE);
            bikeRepository.save(second);
        };
    }
}
