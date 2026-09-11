package com.ktx.ktx.controller;

import com.ktx.ktx.entity.Building;
import com.ktx.ktx.entity.Room;
import com.ktx.ktx.repository.BuildingRepository;
import com.ktx.ktx.repository.RoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/rooms")
public class RoomController {

    private final RoomRepository roomRepository;
    private final BuildingRepository buildingRepository;

    public RoomController(
            RoomRepository roomRepository,
            BuildingRepository buildingRepository
    ) {
        this.roomRepository = roomRepository;
        this.buildingRepository = buildingRepository;
    }

    // Lấy tất cả phòng
    @GetMapping
    public ResponseEntity<List<Room>> getAllRooms() {
        return ResponseEntity.ok(roomRepository.findAll());
    }

    // Lấy phòng theo ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getRoomById(@PathVariable Long id) {

        Optional<Room> room = roomRepository.findById(id);

        if (room.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy phòng!");
        }

        return ResponseEntity.ok(room.get());
    }

    // Lấy tất cả phòng thuộc một tòa nhà
    @GetMapping("/building/{buildingId}")
    public ResponseEntity<?> getRoomsByBuilding(
            @PathVariable Long buildingId
    ) {

        if (!buildingRepository.existsById(buildingId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy tòa nhà!");
        }

        return ResponseEntity.ok(
                roomRepository.findByBuildingId(buildingId)
        );
    }

    // Lấy phòng theo trạng thái
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Room>> getRoomsByStatus(
            @PathVariable String status
    ) {

        return ResponseEntity.ok(
                roomRepository.findByStatus(status.toUpperCase())
        );
    }

    // Thêm phòng
    @PostMapping
    public ResponseEntity<?> createRoom(
            @RequestBody Room room,
            @RequestParam Long buildingId
    ) {

        if (room.getRoomNumber() == null
                || room.getRoomNumber().trim().isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("Số phòng không được để trống!");
        }

        if (room.getCapacity() == null || room.getCapacity() <= 0) {

            return ResponseEntity.badRequest()
                    .body("Sức chứa phòng phải lớn hơn 0!");
        }

        if (room.getStatus() == null
                || room.getStatus().trim().isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("Trạng thái phòng không được để trống!");
        }

        Optional<Building> building =
                buildingRepository.findById(buildingId);

        if (building.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy tòa nhà!");
        }

        String roomNumber = room.getRoomNumber().trim();

        if (roomRepository.existsByBuildingIdAndRoomNumber(
                buildingId,
                roomNumber
        )) {

            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Số phòng đã tồn tại trong tòa nhà này!");
        }

        room.setId(null);
        room.setRoomNumber(roomNumber);
        room.setStatus(room.getStatus().trim().toUpperCase());
        room.setBuilding(building.get());

        Room savedRoom = roomRepository.save(room);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedRoom);
    }

    // Sửa phòng
    @PutMapping("/{id}")
    public ResponseEntity<?> updateRoom(
            @PathVariable Long id,
            @RequestBody Room room,
            @RequestParam Long buildingId
    ) {

        Optional<Room> optionalRoom =
                roomRepository.findById(id);

        if (optionalRoom.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy phòng!");
        }

        if (room.getRoomNumber() == null
                || room.getRoomNumber().trim().isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("Số phòng không được để trống!");
        }

        if (room.getCapacity() == null || room.getCapacity() <= 0) {

            return ResponseEntity.badRequest()
                    .body("Sức chứa phòng phải lớn hơn 0!");
        }

        if (room.getStatus() == null
                || room.getStatus().trim().isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("Trạng thái phòng không được để trống!");
        }

        Optional<Building> building =
                buildingRepository.findById(buildingId);

        if (building.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy tòa nhà!");
        }

        String roomNumber = room.getRoomNumber().trim();

        List<Room> roomsInBuilding =
                roomRepository.findByBuildingId(buildingId);

        for (Room item : roomsInBuilding) {

            if (item.getRoomNumber().equalsIgnoreCase(roomNumber)
                    && !item.getId().equals(id)) {

                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Số phòng đã tồn tại trong tòa nhà này!");
            }
        }

        Room existingRoom = optionalRoom.get();

        existingRoom.setRoomNumber(roomNumber);
        existingRoom.setCapacity(room.getCapacity());
        existingRoom.setStatus(room.getStatus().trim().toUpperCase());
        existingRoom.setBuilding(building.get());

        Room updatedRoom = roomRepository.save(existingRoom);

        return ResponseEntity.ok(updatedRoom);
    }

    // Xóa phòng
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRoom(@PathVariable Long id) {

        if (!roomRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy phòng!");
        }

        roomRepository.deleteById(id);

        return ResponseEntity.ok("Xóa phòng thành công!");
    }
}