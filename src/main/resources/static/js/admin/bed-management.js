const API_BASE = "/api/admin";

const buildingSelect = document.getElementById("buildingSelect");
const roomSelect = document.getElementById("roomSelect");
const bedNumberInput = document.getElementById("bedNumber");
const bedStatusSelect = document.getElementById("bedStatus");
const addBedButton = document.getElementById("addBedButton");
const bedTableBody = document.getElementById("bedTableBody");
const bedCount = document.getElementById("bedCount");
const messageBox = document.getElementById("message");

let currentBeds = [];

document.addEventListener("DOMContentLoaded", function () {

    requireLogin();

    const username = getUsername();
    const welcomeUser = document.getElementById("welcomeUser");

    if (welcomeUser) {
        welcomeUser.textContent = "Xin chào, " + username;
    }

    loadBuildings();
});
function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + getToken()
    };
}

function showMessage(message, type = "success") {
    messageBox.textContent = message;
    messageBox.className = "message " + type;
}

function clearMessage() {
    messageBox.textContent = "";
    messageBox.className = "message";
}

/* =========================
   TÒA NHÀ
========================= */

async function loadBuildings() {

    try {

        const response = await fetch(`${API_BASE}/buildings`, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error("Không thể tải danh sách tòa nhà.");
        }

        const buildings = await response.json();

        buildingSelect.innerHTML =
            '<option value="">-- Chọn tòa nhà --</option>';

        buildings.forEach(building => {

            const option = document.createElement("option");

            option.value = building.id;
            option.textContent =
                building.code + " - " + building.name;

            buildingSelect.appendChild(option);

        });

        // Khôi phục tòa nhà sau khi reload
        const savedBuildingId =
            localStorage.getItem("selectedBuildingId");

        if (
            savedBuildingId &&
            buildings.some(
                building => String(building.id) === savedBuildingId
            )
        ) {
            buildingSelect.value = savedBuildingId;

            await loadRooms(savedBuildingId);
        }

    } catch (error) {

        showMessage(error.message, "error");

    }

}
// load room
async function loadRooms(buildingId) {

    try {

        const response = await fetch(
            `${API_BASE}/rooms/building/${buildingId}`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Không thể tải danh sách phòng.");
        }

        const rooms = await response.json();

        roomSelect.innerHTML =
            '<option value="">-- Chọn phòng --</option>';

        rooms.forEach(room => {

            const option = document.createElement("option");

            option.value = room.id;

            option.textContent =
                "Phòng " + room.roomNumber +
                " - Sức chứa: " + room.capacity;

            roomSelect.appendChild(option);

        });

        roomSelect.disabled = false;

        // Khôi phục phòng sau khi reload
        const savedRoomId =
            localStorage.getItem("selectedRoomId");

        if (
            savedRoomId &&
            rooms.some(
                room => String(room.id) === savedRoomId
            )
        ) {

            roomSelect.value = savedRoomId;

            await loadBeds(savedRoomId);

        }

    } catch (error) {

        showMessage(error.message, "error");

    }

}

/* =========================
   PHÒNG
========================= */

buildingSelect.addEventListener("change", async function () {

    const buildingId = this.value;

    localStorage.setItem(
        "selectedBuildingId",
        buildingId
    );

    localStorage.removeItem("selectedRoomId");

    roomSelect.innerHTML =
        '<option value="">-- Chọn phòng --</option>';

    roomSelect.disabled = true;

    clearTable();

    if (!buildingId) {
        return;
    }

    await loadRooms(buildingId);

});

roomSelect.addEventListener("change", function () {

    const roomId = this.value;

    localStorage.setItem(
        "selectedRoomId",
        roomId
    );

    clearMessage();
    clearTable();

    if (!roomId) {
        return;
    }

    loadBeds(roomId);

});

/* =========================
   GIƯỜNG
========================= */

async function loadBeds(roomId) {
    try {
        const response = await fetch(
            `${API_BASE}/beds/room/${roomId}`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Không thể tải danh sách giường.");
        }

        currentBeds = await response.json();

        renderBeds();

    } catch (error) {
        showMessage(error.message, "error");
    }
}

function renderBeds() {
    bedTableBody.innerHTML = "";

    bedCount.textContent = currentBeds.length + " giường";

    if (currentBeds.length === 0) {
        bedTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-row">
                    Phòng này chưa có giường.
                </td>
            </tr>
        `;

        return;
    }

    currentBeds.forEach(bed => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${bed.id}</td>
            <td>${bed.bedNumber}</td>
            <td>${getStatusBadge(bed.status)}</td>
            <td>${bed.room ? bed.room.roomNumber : "—"}</td>
            <td>
                <button
                    class="action-button edit-button"
                    onclick="editBed(${bed.id})">
                    Sửa
                </button>

                <button
                    class="action-button delete-button"
                    onclick="deleteBed(${bed.id})">
                    Xóa
                </button>
            </td>
        `;

        bedTableBody.appendChild(row);
    });
}

function getStatusBadge(status) {
    let text = status;
    let className = "status-badge";

    if (status === "AVAILABLE") {
        text = "Trống";
        className += " status-available";
    } else if (status === "OCCUPIED") {
        text = "Đang sử dụng";
        className += " status-occupied";
    } else if (status === "MAINTENANCE") {
        text = "Bảo trì";
        className += " status-maintenance";
    }

    return `<span class="${className}">${text}</span>`;
}

/* =========================
   THÊM GIƯỜNG
========================= */

addBedButton.addEventListener("click", async function () {
    const roomId = roomSelect.value;
    const bedNumber = bedNumberInput.value.trim();
    const status = bedStatusSelect.value;

    clearMessage();

    if (!roomId) {
        showMessage("Vui lòng chọn phòng.", "error");
        return;
    }

    if (!bedNumber) {
        showMessage("Vui lòng nhập số giường.", "error");
        return;
    }

    const bedData = {
        bedNumber: bedNumber,
        status: status
    };

    try {
        const response = await fetch(
            `${API_BASE}/beds?roomId=${roomId}`,
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(bedData)
            }
        );

        const result = await response.text();

        if (!response.ok) {
            showMessage(result, "error");
            return;
        }

        showMessage("Thêm giường thành công.", "success");

        bedNumberInput.value = "";
        bedStatusSelect.value = "AVAILABLE";

        loadBeds(roomId);

    } catch (error) {
        showMessage("Có lỗi xảy ra khi thêm giường.", "error");
    }
});

/* =========================
   SỬA GIƯỜNG
========================= */

async function editBed(bedId) {
    const bed = currentBeds.find(item => item.id === bedId);

    if (!bed) {
        showMessage("Không tìm thấy giường.", "error");
        return;
    }

    const newBedNumber = prompt(
        "Nhập số giường mới:",
        bed.bedNumber
    );

    if (newBedNumber === null) {
        return;
    }

    const trimmedBedNumber = newBedNumber.trim();

    if (!trimmedBedNumber) {
        showMessage("Số giường không được để trống.", "error");
        return;
    }

    const newStatus = prompt(
        "Nhập trạng thái: AVAILABLE, OCCUPIED hoặc MAINTENANCE",
        bed.status
    );

    if (newStatus === null) {
        return;
    }

    const status = newStatus.trim().toUpperCase();

    if (!["AVAILABLE", "OCCUPIED", "MAINTENANCE"].includes(status)) {
        showMessage("Trạng thái không hợp lệ.", "error");
        return;
    }

    const roomId = roomSelect.value;

    const bedData = {
        bedNumber: trimmedBedNumber,
        status: status
    };

    try {
        const response = await fetch(
            `${API_BASE}/beds/${bedId}?roomId=${roomId}`,
            {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(bedData)
            }
        );

        const result = await response.text();

        if (!response.ok) {
            showMessage(result, "error");
            return;
        }

        showMessage("Cập nhật giường thành công.", "success");

        loadBeds(roomId);

    } catch (error) {
        showMessage("Có lỗi xảy ra khi cập nhật giường.", "error");
    }
}

/* =========================
   XÓA GIƯỜNG
========================= */

async function deleteBed(bedId) {
    const confirmed = confirm(
        "Bạn có chắc muốn xóa giường này không?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/beds/${bedId}`,
            {
                method: "DELETE",
                headers: getAuthHeaders()
            }
        );

        const result = await response.text();

        if (!response.ok) {
            showMessage(result, "error");
            return;
        }

        showMessage("Xóa giường thành công.", "success");

        loadBeds(roomSelect.value);

    } catch (error) {
        showMessage("Có lỗi xảy ra khi xóa giường.", "error");
    }
}

/* =========================
   TIỆN ÍCH
========================= */

function clearTable() {
    currentBeds = [];
    bedCount.textContent = "0 giường";

    bedTableBody.innerHTML = `
        <tr>
            <td colspan="5" class="empty-row">
                Vui lòng chọn phòng để xem giường.
            </td>
        </tr>
    `;
}