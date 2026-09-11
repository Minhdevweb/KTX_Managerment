package com.ktx.ktx.controller;

import com.ktx.ktx.entity.Bed;
import com.ktx.ktx.entity.Room;
import com.ktx.ktx.repository.BedRepository;
import com.ktx.ktx.repository.RoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/beds")
public class BedController {

    private final BedRepository bedRepository;
    private final RoomRepository roomRepository;

    public BedController(
            BedRepository bedRepository,
            RoomRepository roomRepository
    ) {
        this.bedRepository = bedRepository;
        this.roomRepository = roomRepository;
    }

    // Lấy tất cả giường
    @GetMapping
    public ResponseEntity<List<Bed>> getAllBeds() {
        return ResponseEntity.ok(bedRepository.findAll());
    }

    // Lấy giường theo ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getBedById(@PathVariable Long id) {

        Optional<Bed> bed = bedRepository.findById(id);

        if (bed.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy giường!");
        }

        return ResponseEntity.ok(bed.get());
    }

    // Lấy tất cả giường trong một phòng
    @GetMapping("/room/{roomId}")
    public ResponseEntity<?> getBedsByRoom(
            @PathVariable Long roomId
    ) {

        if (!roomRepository.existsById(roomId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy phòng!");
        }

        return ResponseEntity.ok(
                bedRepository.findByRoomId(roomId)
        );
    }

    // Lấy giường theo trạng thái
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Bed>> getBedsByStatus(
            @PathVariable String status
    ) {

        return ResponseEntity.ok(
                bedRepository.findByStatus(status.toUpperCase())
        );
    }

    // Thêm giường
    @PostMapping
    public ResponseEntity<?> createBed(
            @RequestBody Bed bed,
            @RequestParam Long roomId
    ) {

        if (bed.getBedNumber() == null
                || bed.getBedNumber().trim().isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("Số giường không được để trống!");
        }

        if (bed.getStatus() == null
                || bed.getStatus().trim().isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("Trạng thái giường không được để trống!");
        }

        Optional<Room> room = roomRepository.findById(roomId);

        if (room.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy phòng!");
        }

        String bedNumber = bed.getBedNumber().trim();

        if (bedRepository.existsByRoomIdAndBedNumber(
                roomId,
                bedNumber
        )) {

            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Số giường đã tồn tại trong phòng này!");
        }

        bed.setId(null);
        bed.setBedNumber(bedNumber);
        bed.setStatus(bed.getStatus().trim().toUpperCase());
        bed.setRoom(room.get());

        Bed savedBed = bedRepository.save(bed);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedBed);
    }

    // Sửa giường
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBed(
            @PathVariable Long id,
            @RequestBody Bed bed,
            @RequestParam Long roomId
    ) {

        Optional<Bed> optionalBed = bedRepository.findById(id);

        if (optionalBed.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy giường!");
        }

        if (bed.getBedNumber() == null
                || bed.getBedNumber().trim().isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("Số giường không được để trống!");
        }

        if (bed.getStatus() == null
                || bed.getStatus().trim().isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("Trạng thái giường không được để trống!");
        }

        Optional<Room> room = roomRepository.findById(roomId);

        if (room.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy phòng!");
        }

        String bedNumber = bed.getBedNumber().trim();

        List<Bed> bedsInRoom = bedRepository.findByRoomId(roomId);

        for (Bed item : bedsInRoom) {

            if (item.getBedNumber().equalsIgnoreCase(bedNumber)
                    && !item.getId().equals(id)) {

                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Số giường đã tồn tại trong phòng này!");
            }
        }

        Bed existingBed = optionalBed.get();

        existingBed.setBedNumber(bedNumber);
        existingBed.setStatus(bed.getStatus().trim().toUpperCase());
        existingBed.setRoom(room.get());

        Bed updatedBed = bedRepository.save(existingBed);

        return ResponseEntity.ok(updatedBed);
    }

    // Xóa giường
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBed(@PathVariable Long id) {

        if (!bedRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy giường!");
        }

        bedRepository.deleteById(id);

        return ResponseEntity.ok("Xóa giường thành công!");
    }
}