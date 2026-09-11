package com.ktx.ktx.entity;

import jakarta.persistence.*;

@Entity
@Table (
        name = "beds",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"room_id", "bed_number"})
        }
)
public class Bed {
    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

//    số tên giường
    @Column ( name = "bed_number", nullable = false)
    private String bedNumber;

//    AVAILABLE, OCCUPIED, MAINTENANCE
    @Column(nullable = false)
    private String status;

//    Giường thuộc 1 phòng
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id",  nullable = false)
    private Room room;

    public Bed(){

    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBedNumber() {
        return bedNumber;
    }

    public void setBedNumber(String bedNumber) {
        this.bedNumber = bedNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }
}
