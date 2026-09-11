package com.ktx.ktx.controller;

import com.ktx.ktx.entity.Building;
import com.ktx.ktx.repository.BuildingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/buildings")
public class BuildingController {

    private final BuildingRepository buildingRepository;

    public BuildingController(BuildingRepository buildingRepository) {
        this.buildingRepository = buildingRepository;
    }

    // Lấy danh sách tất cả tòa nhà
    @GetMapping
    public ResponseEntity<List<Building>> getAllBuildings() {
        return ResponseEntity.ok(buildingRepository.findAll());
    }

    // Lấy thông tin một tòa nhà
    @GetMapping("/{id}")
    public ResponseEntity<?> getBuildingById(@PathVariable Long id) {

        Optional<Building> building =
                buildingRepository.findById(id);

        if (building.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy tòa nhà!");
        }

        return ResponseEntity.ok(building.get());
    }

    // Thêm tòa nhà
    @PostMapping
    public ResponseEntity<?> createBuilding(
            @RequestBody Building building) {

        if (building.getCode() == null
                || building.getCode().trim().isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .body("Mã tòa nhà không được để trống!");
        }

        if (building.getName() == null
                || building.getName().trim().isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .body("Tên tòa nhà không được để trống!");
        }

        String code = building.getCode().trim();

        if (buildingRepository.existsByCode(code)) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("Mã tòa nhà đã tồn tại!");
        }

        building.setId(null);
        building.setCode(code);
        building.setName(building.getName().trim());

        Building savedBuilding =
                buildingRepository.save(building);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedBuilding);
    }

    // Cập nhật tòa nhà
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBuilding(
            @PathVariable Long id,
            @RequestBody Building building) {

        Optional<Building> optionalBuilding =
                buildingRepository.findById(id);

        if (optionalBuilding.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy tòa nhà!");
        }

        if (building.getCode() == null
                || building.getCode().trim().isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .body("Mã tòa nhà không được để trống!");
        }

        if (building.getName() == null
                || building.getName().trim().isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .body("Tên tòa nhà không được để trống!");
        }

        Building existingBuilding =
                optionalBuilding.get();

        String code = building.getCode().trim();

        Optional<Building> buildingWithSameCode =
                buildingRepository.findByCode(code);

        if (buildingWithSameCode.isPresent()
                && !buildingWithSameCode.get()
                .getId().equals(id)) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("Mã tòa nhà đã được sử dụng!");
        }

        existingBuilding.setCode(code);
        existingBuilding.setName(building.getName().trim());
        existingBuilding.setDescription(
                building.getDescription()
        );

        Building updatedBuilding =
                buildingRepository.save(existingBuilding);

        return ResponseEntity.ok(updatedBuilding);
    }

    // Xóa tòa nhà
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBuilding(
            @PathVariable Long id) {

        if (!buildingRepository.existsById(id)) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy tòa nhà!");
        }

        buildingRepository.deleteById(id);

        return ResponseEntity.ok(
                "Xóa tòa nhà thành công!"
        );
    }
}