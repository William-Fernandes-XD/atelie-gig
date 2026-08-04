package com.ateliegg.repository;

import com.ateliegg.domain.entity.HeroSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface HeroSectionRepository extends JpaRepository<HeroSection, Long> {

    @Query("SELECT h FROM HeroSection h LEFT JOIN FETCH h.features WHERE h.active = true")
    Optional<HeroSection> findActiveWithFeatures();
}
