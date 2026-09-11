package com.ktx.ktx.entity;

import jakarta.persistence.*;

@Entity
@Table (
        name = "rooms",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"building_id", "room_number" })
        }
)
public class Room {
    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

//    so phong
    @Column (name = "room_number", nullable = false)
    private String roomNumber;

//   số lượng giường tối đa
    @Column(nullable = false)
    private Integer capacity;

//    trang thái phòng
//    AVAILABLE, FULL, MAINTENANCE
    @Column(nullable = false)
    private String status;

//    phòng thuộc 1 tòa nhà ( 1 tòa nhiều phòng )
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id", nullable = false)
    private Building building;

    public Room() {

    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Building getBuilding() {
        return building;
    }

    public void setBuilding(Building building) {
        this.building = building;
    }
}
