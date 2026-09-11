package com.ktx.ktx.entity;

import jakarta.persistence.*;

@Entity
@Table (
        name = "buildings",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "code")
        }
)
public class Building {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

//    ma toa nha A,B,C
    @Column(nullable = false, unique = false)
    private String code;

//    ten toa nha
    @Column(nullable = false)
    private String name;

//    mo ta
    @Column(nullable = false)
    private String description;

    public Building() {

    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
