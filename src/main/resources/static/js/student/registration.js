const BUILDING_API =
    "/api/student/registrations/buildings";

const ROOM_API =
    "/api/student/registrations/buildings";

const BED_API =
    "/api/student/registrations/rooms";

const REGISTRATION_API =
    "/api/student/registrations";


let selectedBuildingId = null;
let selectedRoomId = null;
let selectedBedId = null;

let selectedBuilding = null;
let selectedRoom = null;
let selectedBed = null;


/* ================= ELEMENT ================= */

const buildingList =
    document.getElementById("buildingList");

const roomList =
    document.getElementById("roomList");

const bedList =
    document.getElementById("bedList");

const selectedBuildingInfo =
    document.getElementById("selectedBuildingInfo");

const selectedRoomInfo =
    document.getElementById("selectedRoomInfo");

const summaryBuilding =
    document.getElementById("summaryBuilding");

const summaryRoom =
    document.getElementById("summaryRoom");

const summaryBed =
    document.getElementById("summaryBed");

const registerButton =
    document.getElementById("registerButton");

const messageBox =
    document.getElementById("message");

const myRegistrations =
    document.getElementById("myRegistrations");


/* ================= MESSAGE ================= */

function showMessage(
    message,
    type = "success"
) {

    messageBox.textContent =
        message;

    messageBox.className =
        "message " + type;

    setTimeout(() => {

        messageBox.textContent = "";

        messageBox.className =
            "message";

    }, 4000);
}


/* ================= LOAD BUILDINGS ================= */

async function loadBuildings() {

    try {

        const token =
            getToken();

        const response =
            await fetch(
                BUILDING_API,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        if (!response.ok) {

            if (response.status === 401) {

                showMessage(
                    "Phiên đăng nhập đã hết hạn!",
                    "error"
                );

                return;
            }

            if (response.status === 403) {

                showMessage(
                    "Bạn không có quyền đăng ký KTX!",
                    "error"
                );

                return;
            }

            throw new Error(
                "Không thể tải danh sách tòa!"
            );
        }


        const buildings =
            await response.json();

        renderBuildings(
            buildings
        );

    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Không thể kết nối đến máy chủ!",
            "error"
        );
    }
}


/* ================= RENDER BUILDINGS ================= */

function renderBuildings(
    buildings
) {

    buildingList.innerHTML = "";


    if (
        !buildings ||
        buildings.length === 0
    ) {

        buildingList.innerHTML = `
            <div class="empty-message">
                Hiện tại không có tòa nào còn phòng trống.
            </div>
        `;

        return;
    }


    buildings.forEach(
        building => {

            const item =
                document.createElement(
                    "div"
                );

            /*
             * Dùng lại room-item
             * để giữ nguyên giao diện hiện tại
             */
            item.className =
                "room-item";


            item.innerHTML = `

                <div class="room-number">
                    Tòa
                    ${escapeHtml(
                building.code || ""
            )}
                </div>

                <div class="room-info">

                    <div>
                        ${escapeHtml(
                building.name || ""
            )}
                    </div>

                    <div>
                        ${escapeHtml(
                building.description || ""
            )}
                    </div>

                </div>

            `;


            item.addEventListener(
                "click",
                function () {

                    selectBuilding(
                        building,
                        item
                    );

                }
            );


            buildingList.appendChild(
                item
            );

        }
    );
}


/* ================= SELECT BUILDING ================= */

function selectBuilding(
    building,
    element
) {

    selectedBuildingId =
        building.id;

    selectedBuilding =
        building;


    selectedRoomId = null;
    selectedBedId = null;

    selectedRoom = null;
    selectedBed = null;


    document
        .querySelectorAll(
            "#buildingList .room-item"
        )
        .forEach(item => {

            item.classList.remove(
                "selected"
            );

        });


    element.classList.add(
        "selected"
    );


    selectedBuildingInfo.textContent =
        "Tòa " +
        (
            building.code ||
            building.name ||
            ""
        );


    summaryBuilding.textContent =
        "Tòa " +
        (
            building.code ||
            building.name ||
            ""
        );


    summaryRoom.textContent =
        "Chưa chọn";

    summaryBed.textContent =
        "Chưa chọn";


    selectedRoomInfo.textContent =
        "Vui lòng chọn phòng trước";


    bedList.innerHTML = `
        <div class="empty-message">
            Chưa có phòng được chọn
        </div>
    `;


    registerButton.disabled =
        true;


    loadRoomsByBuilding(
        building.id
    );
}


/* ================= LOAD ROOMS ================= */

async function loadRoomsByBuilding(
    buildingId
) {

    try {

        roomList.innerHTML = `
            <div class="loading">
                Đang tải danh sách phòng...
            </div>
        `;


        const token =
            getToken();


        const response =
            await fetch(
                `${ROOM_API}/${buildingId}/rooms`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Không thể tải danh sách phòng!"
            );
        }


        const rooms =
            await response.json();


        renderRooms(
            rooms
        );

    } catch (error) {

        console.error(error);

        roomList.innerHTML = `
            <div class="empty-message">
                Không thể tải danh sách phòng.
            </div>
        `;

        showMessage(
            error.message,
            "error"
        );
    }
}


/* ================= RENDER ROOMS ================= */

function renderRooms(
    rooms
) {

    roomList.innerHTML = "";


    if (
        !rooms ||
        rooms.length === 0
    ) {

        roomList.innerHTML = `
            <div class="empty-message">
                Tòa này hiện không có phòng còn giường trống.
            </div>
        `;

        return;
    }


    rooms.forEach(
        room => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "room-item";


            item.innerHTML = `

                <div class="room-number">

                    Phòng
                    ${escapeHtml(
                room.roomNumber || ""
            )}

                </div>


                <div class="room-info">

                    <div>
                        Sức chứa:
                        ${room.capacity || 0}
                    </div>

                    <div>
                        Giường trống:
                        ${room.availableBeds || 0}
                    </div>

                </div>

            `;


            item.addEventListener(
                "click",
                function () {

                    selectRoom(
                        room,
                        item
                    );

                }
            );


            roomList.appendChild(
                item
            );

        }
    );
}


/* ================= SELECT ROOM ================= */

function selectRoom(
    room,
    element
) {

    selectedRoomId =
        room.id;

    selectedRoom =
        room;


    selectedBedId =
        null;

    selectedBed =
        null;


    document
        .querySelectorAll(
            "#roomList .room-item"
        )
        .forEach(item => {

            item.classList.remove(
                "selected"
            );

        });


    element.classList.add(
        "selected"
    );


    selectedRoomInfo.textContent =
        "Phòng " +
        (
            room.roomNumber ||
            ""
        );


    summaryRoom.textContent =
        "Phòng " +
        (
            room.roomNumber ||
            ""
        );


    summaryBed.textContent =
        "Chưa chọn";


    registerButton.disabled =
        true;


    loadBeds(
        room.id
    );
}


/* ================= LOAD BEDS ================= */

async function loadBeds(
    roomId
) {

    try {

        bedList.innerHTML = `
            <div class="loading">
                Đang tải danh sách giường...
            </div>
        `;


        const token =
            getToken();


        const response =
            await fetch(
                `${BED_API}/${roomId}/beds`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Không thể tải danh sách giường!"
            );
        }


        const beds =
            await response.json();


        renderBeds(
            beds
        );

    } catch (error) {

        console.error(error);

        bedList.innerHTML = `
            <div class="empty-message">
                Không thể tải danh sách giường.
            </div>
        `;

        showMessage(
            error.message,
            "error"
        );
    }
}


/* ================= RENDER BEDS ================= */

function renderBeds(
    beds
) {

    bedList.innerHTML = "";


    if (
        !beds ||
        beds.length === 0
    ) {

        bedList.innerHTML = `
            <div class="empty-message">
                Phòng này hiện không còn giường trống.
            </div>
        `;

        return;
    }


    beds.forEach(
        bed => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "bed-item";


            item.innerHTML = `

                <div class="bed-number">

                    Giường
                    ${escapeHtml(
                bed.bedNumber || ""
            )}

                </div>

            `;


            item.addEventListener(
                "click",
                function () {

                    selectBed(
                        bed,
                        item
                    );

                }
            );


            bedList.appendChild(
                item
            );

        }
    );
}


/* ================= SELECT BED ================= */

function selectBed(
    bed,
    element
) {

    selectedBedId =
        bed.id;

    selectedBed =
        bed;


    document
        .querySelectorAll(
            ".bed-item"
        )
        .forEach(item => {

            item.classList.remove(
                "selected"
            );

        });


    element.classList.add(
        "selected"
    );


    summaryBed.textContent =
        "Giường " +
        (
            bed.bedNumber ||
            ""
        );


    registerButton.disabled =
        false;
}


/* ================= REGISTER ================= */

registerButton.addEventListener(
    "click",
    async function () {

        if (
            !selectedRoomId ||
            !selectedBedId
        ) {

            showMessage(
                "Vui lòng chọn phòng và giường!",
                "error"
            );

            return;
        }


        const confirmRegister =
            confirm(
                "Bạn có chắc chắn muốn đăng ký phòng và giường này?"
            );


        if (!confirmRegister) {
            return;
        }


        try {

            registerButton.disabled =
                true;

            registerButton.textContent =
                "ĐANG ĐĂNG KÝ...";


            const token =
                getToken();


            const response =
                await fetch(
                    REGISTRATION_API,
                    {
                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                "Bearer " + token
                        },

                        body: JSON.stringify({

                            roomId:
                            selectedRoomId,

                            bedId:
                            selectedBedId

                        })
                    }
                );


            const responseText =
                await response.text();


            if (!response.ok) {

                showMessage(
                    responseText ||
                    "Đăng ký KTX thất bại!",
                    "error"
                );

                return;
            }


            showMessage(
                "Đăng ký KTX thành công! Đang chờ admin xét duyệt.",
                "success"
            );


            resetSelection();

            loadBuildings();

            loadMyRegistrations();


        } catch (error) {

            console.error(error);

            showMessage(
                "Không thể kết nối đến máy chủ!",
                "error"
            );

        } finally {

            registerButton.disabled =
                true;

            registerButton.textContent =
                "ĐĂNG KÝ KTX";
        }

    }
);


/* ================= MY REGISTRATIONS ================= */

async function loadMyRegistrations() {

    try {

        const token =
            getToken();


        const response =
            await fetch(
                `${REGISTRATION_API}/my`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Không thể tải đăng ký của bạn!"
            );
        }


        const registrations =
            await response.json();


        renderMyRegistrations(
            registrations
        );

    } catch (error) {

        console.error(error);

        myRegistrations.innerHTML = `
            <div class="empty-message">
                Không thể tải danh sách đăng ký.
            </div>
        `;
    }
}


/* ================= RENDER MY REGISTRATIONS ================= */

function renderMyRegistrations(
    registrations
) {

    myRegistrations.innerHTML =
        "";


    if (
        !registrations ||
        registrations.length === 0
    ) {

        myRegistrations.innerHTML = `
            <div class="empty-message">
                Bạn chưa có đăng ký KTX nào.
            </div>
        `;

        return;
    }


    registrations.forEach(
        registration => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "registration-item";


            const status =
                registration.status ||
                "PENDING";


            const statusClass =
                getStatusClass(
                    status
                );


            const statusText =
                getStatusText(
                    status
                );


            item.innerHTML = `

                <div class="registration-info">

                    <strong>

                        Tòa:
                        ${
                registration.room &&
                registration.room.building
                    ? (
                        registration.room
                            .building
                            .code || ""
                    )
                    : ""
            }

                        -

                        Phòng:
                        ${
                registration.room
                    ? (
                        registration.room
                            .roomNumber || ""
                    )
                    : ""
            }

                    </strong>


                    <span>

                        Giường:
                        ${
                registration.bed
                    ? (
                        registration.bed
                            .bedNumber || ""
                    )
                    : ""
            }

                    </span>


                    <span>

                        Ngày đăng ký:
                        ${
                formatDate(
                    registration.createdAt
                )
            }

                    </span>

                </div>


                <span
                    class="status ${statusClass}"
                >
                    ${statusText}
                </span>

            `;


            myRegistrations.appendChild(
                item
            );

        }
    );
}


/* ================= STATUS ================= */

function getStatusClass(
    status
) {

    switch (
        String(status).toUpperCase()
        ) {

        case "APPROVED":
            return "status-approved";

        case "REJECTED":
            return "status-rejected";

        default:
            return "status-pending";
    }
}


function getStatusText(
    status
) {

    switch (
        String(status).toUpperCase()
        ) {

        case "APPROVED":
            return "Đã duyệt";

        case "REJECTED":
            return "Từ chối";

        default:
            return "Chờ duyệt";
    }
}


/* ================= FORMAT DATE ================= */

function formatDate(
    date
) {

    if (!date) {
        return "";
    }


    try {

        return new Date(date)
            .toLocaleString(
                "vi-VN"
            );

    } catch (error) {

        return date;
    }
}


/* ================= RESET ================= */

function resetSelection() {

    selectedBuildingId = null;
    selectedRoomId = null;
    selectedBedId = null;

    selectedBuilding = null;
    selectedRoom = null;
    selectedBed = null;


    selectedBuildingInfo.textContent =
        "Vui lòng chọn tòa trước";


    selectedRoomInfo.textContent =
        "Vui lòng chọn phòng trước";


    summaryBuilding.textContent =
        "Chưa chọn";


    summaryRoom.textContent =
        "Chưa chọn";


    summaryBed.textContent =
        "Chưa chọn";


    roomList.innerHTML = `
        <div class="empty-message">
            Chưa có tòa được chọn
        </div>
    `;


    bedList.innerHTML = `
        <div class="empty-message">
            Chưa có phòng được chọn
        </div>
    `;


    document
        .querySelectorAll(
            ".room-item"
        )
        .forEach(item => {

            item.classList.remove(
                "selected"
            );

        });


    registerButton.disabled =
        true;
}


/* ================= ESCAPE HTML ================= */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            "\"",
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


/* ================= INIT ================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadBuildings();

        loadMyRegistrations();

    }
);