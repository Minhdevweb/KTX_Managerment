document.addEventListener("DOMContentLoaded", function () {

    loadRoomInfo();

});


async function loadRoomInfo() {

    const loading = document.getElementById("loading");
    const noRoom = document.getElementById("noRoom");
    const roomInfo = document.getElementById("roomInfo");
    const errorMessage = document.getElementById("errorMessage");

    try {

        const token = getToken();

        const response = await fetch(
            "/api/student/registrations/room",
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );


        if (response.status === 401) {

            logout(false);
            return;

        }


        if (!response.ok) {

            throw new Error(
                "Không thể lấy thông tin phòng"
            );

        }


        const data = await response.json();


        loading.style.display = "none";


        // =========================
        // CHƯA CÓ PHÒNG
        // =========================

        if (!data.hasRoom) {

            noRoom.style.display = "block";

            document.getElementById("noRoomMessage")
                .textContent =
                data.message ||
                "Bạn chưa được phân phòng KTX.";

            return;

        }


        // =========================
        // CÓ PHÒNG
        // =========================

        roomInfo.style.display = "block";


        document.getElementById("buildingName")
            .textContent =
            data.buildingName || "-";


        document.getElementById("buildingCode")
            .textContent =
            data.buildingCode || "-";


        document.getElementById("roomNumber")
            .textContent =
            data.roomNumber || "-";


        document.getElementById("bedNumber")
            .textContent =
            data.bedNumber || "-";


        document.getElementById("capacity")
            .textContent =
            data.capacity != null
                ? data.capacity + " người"
                : "-";


        document.getElementById("roomStatus")
            .textContent =
            convertRoomStatus(data.roomStatus);


        document.getElementById("bedStatus")
            .textContent =
            convertBedStatus(data.bedStatus);


        const username =
            getUsername();

        const welcomeUser =
            document.getElementById("welcomeUser");

        if (welcomeUser && username) {
            welcomeUser.textContent = username;
        }

    } catch (error) {

        console.error(error);

        loading.style.display = "none";

        errorMessage.style.display = "block";

    }

}


/* =========================
   CHUYỂN TRẠNG THÁI PHÒNG
   ========================= */

function convertRoomStatus(status) {

    if (!status) {
        return "-";
    }

    switch (status.toUpperCase()) {

        case "AVAILABLE":
            return "Còn chỗ";

        case "FULL":
            return "Đã đầy";

        case "MAINTENANCE":
            return "Bảo trì";

        default:
            return status;

    }

}


/* =========================
   CHUYỂN TRẠNG THÁI GIƯỜNG
   ========================= */

function convertBedStatus(status) {

    if (!status) {
        return "-";
    }

    switch (status.toUpperCase()) {

        case "AVAILABLE":
            return "Còn trống";

        case "OCCUPIED":
            return "Đã sử dụng";

        case "MAINTENANCE":
            return "Bảo trì";

        default:
            return status;

    }

}