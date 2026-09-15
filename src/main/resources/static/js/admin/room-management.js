const BUILDING_API = "/api/admin/buildings";
const ROOM_API = "/api/admin/rooms";

let buildings = [];

document.addEventListener("DOMContentLoaded", function () {

    const username = getUsername();

    const welcomeUser = document.getElementById("welcomeUser");

    if (welcomeUser) {
        welcomeUser.textContent = "Xin chào, " + username;
    }

    loadBuildings();

    document
        .getElementById("addBuildingButton")
        .addEventListener("click", addBuilding);

    document
        .getElementById("addRoomButton")
        .addEventListener("click", addRoom);

    document
        .getElementById("buildingSelect")
        .addEventListener("change", function () {
            const buildingId = this.value;

            if (buildingId) {
                loadRoomsByBuilding(buildingId);
            } else {
                document.getElementById("roomList").innerHTML = "";
            }
        });
});

function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + getToken()
    };
}

function showMessage(message, type = "success") {
    const messageElement = document.getElementById("message");

    messageElement.textContent = message;
    messageElement.className = "message " + type;
}

async function loadBuildings() {

    try {
        const response = await fetch(BUILDING_API, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            showMessage("Bạn không có quyền truy cập!", "error");
            return;
        }

        if (!response.ok) {
            throw new Error("Không thể lấy danh sách tòa nhà");
        }

        buildings = await response.json();

        renderBuildings();
        renderBuildingSelect();

    } catch (error) {
        console.error(error);
        showMessage("Lỗi khi tải danh sách tòa nhà!", "error");
    }
}

function renderBuildings() {

    const buildingList = document.getElementById("buildingList");

    buildingList.innerHTML = "";

    if (buildings.length === 0) {
        buildingList.innerHTML = "<p>Chưa có tòa nhà nào.</p>";
        return;
    }

    buildings.forEach(function (building) {

        const item = document.createElement("div");
        item.className = "building-item";

        item.innerHTML = `
            <div class="building-info">
                <strong>
                    ${building.code} - ${building.name}
                </strong>

                <span>
                    ${building.description || "Không có mô tả"}
                </span>
            </div>

            <div class="item-actions">
                <button
                    class="delete-button"
                    onclick="deleteBuilding(${building.id})"
                >
                    Xóa
                </button>
            </div>
        `;

        buildingList.appendChild(item);
    });
}

function renderBuildingSelect() {

    const select = document.getElementById("buildingSelect");

    select.innerHTML = `
        <option value="">
            -- Chọn tòa nhà --
        </option>
    `;

    buildings.forEach(function (building) {

        const option = document.createElement("option");

        option.value = building.id;
        option.textContent =
            building.code + " - " + building.name;

        select.appendChild(option);
    });
}

async function addBuilding() {

    const code = document
        .getElementById("buildingCode")
        .value
        .trim();

    const name = document
        .getElementById("buildingName")
        .value
        .trim();

    const description = document
        .getElementById("buildingDescription")
        .value
        .trim();

    if (!code || !name || !description) {
        showMessage("Vui lòng nhập đầy đủ thông tin tòa nhà!", "error");
        return;
    }

    try {

        const response = await fetch(BUILDING_API, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                code: code,
                name: name,
                description: description
            })
        });

        const result = await response.text();

        if (!response.ok) {
            showMessage(result, "error");
            return;
        }

        showMessage("Thêm tòa nhà thành công!", "success");

        document.getElementById("buildingCode").value = "";
        document.getElementById("buildingName").value = "";
        document.getElementById("buildingDescription").value = "";

        loadBuildings();

    } catch (error) {
        console.error(error);
        showMessage("Lỗi khi thêm tòa nhà!", "error");
    }
}

async function deleteBuilding(buildingId) {

    const confirmDelete = confirm(
        "Bạn có chắc chắn muốn xóa tòa nhà này không?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(
            BUILDING_API + "/" + buildingId,
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

        showMessage("Xóa tòa nhà thành công!", "success");

        loadBuildings();

    } catch (error) {
        console.error(error);
        showMessage("Lỗi khi xóa tòa nhà!", "error");
    }
}

async function addRoom() {

    const buildingId = document
        .getElementById("buildingSelect")
        .value;

    const roomNumber = document
        .getElementById("roomNumber")
        .value
        .trim();

    const capacity = Number(
        document.getElementById("roomCapacity").value
    );

    const status = document
        .getElementById("roomStatus")
        .value;

    if (!buildingId) {
        showMessage("Vui lòng chọn tòa nhà!", "error");
        return;
    }

    if (!roomNumber || capacity <= 0) {
        showMessage("Vui lòng nhập số phòng và sức chứa hợp lệ!", "error");
        return;
    }

    try {

        const response = await fetch(
            ROOM_API + "?buildingId=" + buildingId,
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    roomNumber: roomNumber,
                    capacity: capacity,
                    status: status
                })
            }
        );

        const result = await response.text();

        if (!response.ok) {
            showMessage(result, "error");
            return;
        }

        showMessage("Thêm phòng thành công!", "success");

        document.getElementById("roomNumber").value = "";
        document.getElementById("roomCapacity").value = "";

        loadRoomsByBuilding(buildingId);

    } catch (error) {
        console.error(error);
        showMessage("Lỗi khi thêm phòng!", "error");
    }
}

async function loadRoomsByBuilding(buildingId) {

    try {

        const response = await fetch(
            ROOM_API + "/building/" + buildingId,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Không thể lấy danh sách phòng");
        }

        const rooms = await response.json();

        renderRooms(rooms);

    } catch (error) {
        console.error(error);
        showMessage("Lỗi khi tải danh sách phòng!", "error");
    }
}

function renderRooms(rooms) {

    const roomList = document.getElementById("roomList");

    roomList.innerHTML = "";

    if (rooms.length === 0) {
        roomList.innerHTML = "<p>Tòa nhà này chưa có phòng.</p>";
        return;
    }

    rooms.forEach(function (room) {

        const item = document.createElement("div");

        item.className = "room-item";

        item.innerHTML = `
            <div class="room-info">
                <strong>
                    Phòng ${room.roomNumber}
                </strong>

                <span>
                    Sức chứa: ${room.capacity} người
                </span>

                <span>
                    Trạng thái: ${room.status}
                </span>
            </div>

            <div class="item-actions">
                <button
                    class="delete-button"
                    onclick="deleteRoom(${room.id})"
                >
                    Xóa
                </button>
            </div>
        `;

        roomList.appendChild(item);
    });
}

async function deleteRoom(roomId) {

    const confirmDelete = confirm(
        "Bạn có chắc chắn muốn xóa phòng này không?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(
            ROOM_API + "/" + roomId,
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

        showMessage("Xóa phòng thành công!", "success");

        const buildingId =
            document.getElementById("buildingSelect").value;

        if (buildingId) {
            loadRoomsByBuilding(buildingId);
        }

    } catch (error) {
        console.error(error);
        showMessage("Lỗi khi xóa phòng!", "error");
    }
}