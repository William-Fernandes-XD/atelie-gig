package com.ateliegg.repository;

import com.ateliegg.domain.entity.HeroFeature;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HeroFeatureRepository extends JpaRepository<HeroFeature, Long> {

    List<HeroFeature> findByHeroSectionIdOrderByDisplayOrderAscIdAsc(Long heroSectionId);

    void deleteByHeroSectionId(Long heroSectionId);
}
