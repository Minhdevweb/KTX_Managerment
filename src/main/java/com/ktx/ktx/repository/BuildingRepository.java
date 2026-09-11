package com.ktx.ktx.repository;

import com.ktx.ktx.entity.Building;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BuildingRepository extends JpaRepository<Building, Long> {

    Optional<Building> findByCode(String code);

    boolean existsByCode(String code);

}
