const ROOM_API =
    "/api/student/registrations/rooms";

const BED_API =
    "/api/student/registrations/rooms";

const REGISTRATION_API =
    "/api/student/registrations";

let selectedRoomId = null;
let selectedBedId = null;

let selectedRoom = null;
let selectedBed = null;


/* ================= ELEMENT ================= */

const roomList =
    document.getElementById("roomList");

const bedList =
    document.getElementById("bedList");

const selectedRoomInfo =
    document.getElementById("selectedRoomInfo");

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

function showMessage(message, type = "success") {

    messageBox.textContent = message;

    messageBox.className =
        "message " + type;

    setTimeout(() => {

        messageBox.textContent = "";

        messageBox.className = "message";

    }, 4000);
}


/* ================= LOAD ROOMS ================= */

async function loadRooms() {

    try {

        const token = getToken();

        const response = await fetch(
            ROOM_API,
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
                "Không thể tải danh sách phòng!"
            );
        }

        const rooms =
            await response.json();

        renderRooms(rooms);

    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Không thể kết nối đến máy chủ!",
            "error"
        );
    }
}


/* ================= RENDER ROOMS ================= */

function renderRooms(rooms) {

    roomList.innerHTML = "";

    if (!rooms || rooms.length === 0) {

        roomList.innerHTML = `
            <div class="empty-message">
                Hiện tại không có phòng còn giường trống.
            </div>
        `;

        return;
    }


    rooms.forEach(room => {

        const item =
            document.createElement("div");

        item.className = "room-item";

        item.innerHTML = `

            <div class="room-number">
                Phòng ${escapeHtml(
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
                    ${
            room.availableBeds
                ? room.availableBeds.length
                : 0
        }
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


        roomList.appendChild(item);

    });
}


/* ================= SELECT ROOM ================= */

function selectRoom(room, element) {

    selectedRoomId =
        room.id;

    selectedRoom =
        room;

    selectedBedId =
        null;

    selectedBed =
        null;


    document
        .querySelectorAll(".room-item")
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
        (room.roomNumber || "");


    summaryRoom.textContent =
        "Phòng " +
        (room.roomNumber || "");


    summaryBed.textContent =
        "Chưa chọn";


    registerButton.disabled =
        true;


    loadBeds(
        room.id
    );
}


/* ================= LOAD BEDS ================= */

async function loadBeds(roomId) {

    try {

        const token = getToken();

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

        renderBeds(beds);

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

function renderBeds(beds) {

    bedList.innerHTML = "";

    if (!beds || beds.length === 0) {

        bedList.innerHTML = `
            <div class="empty-message">
                Phòng này hiện không còn giường trống.
            </div>
        `;

        return;
    }


    beds.forEach(bed => {

        const item =
            document.createElement("div");

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


        bedList.appendChild(item);

    });
}


/* ================= SELECT BED ================= */

function selectBed(bed, element) {

    selectedBedId =
        bed.id;

    selectedBed =
        bed;


    document
        .querySelectorAll(".bed-item")
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
        (bed.bedNumber || "");


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

            loadRooms();

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

    myRegistrations.innerHTML = "";


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
                getStatusClass(status);


            const statusText =
                getStatusText(status);


            item.innerHTML = `

                <div class="registration-info">

                    <strong>
                        Phòng:
                        ${
                registration.room
                    ? (
                        registration.room.roomNumber
                        || ""
                    )
                    : ""
            }
                    </strong>

                    <span>
                        Giường:
                        ${
                registration.bed
                    ? (
                        registration.bed.bedNumber
                        || ""
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

function getStatusClass(status) {

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


function getStatusText(status) {

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

function formatDate(date) {

    if (!date) {
        return "";
    }

    try {

        return new Date(date)
            .toLocaleString("vi-VN");

    } catch (error) {

        return date;
    }
}


/* ================= RESET ================= */

function resetSelection() {

    selectedRoomId = null;
    selectedBedId = null;

    selectedRoom = null;
    selectedBed = null;


    selectedRoomInfo.textContent =
        "Vui lòng chọn phòng trước";


    summaryRoom.textContent =
        "Chưa chọn";


    summaryBed.textContent =
        "Chưa chọn";


    bedList.innerHTML = `
        <div class="empty-message">
            Chưa có phòng được chọn
        </div>
    `;


    document
        .querySelectorAll(".room-item")
        .forEach(item => {

            item.classList.remove(
                "selected"
            );

        });
}


/* ================= ESCAPE HTML ================= */

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return "";
    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ================= INIT ================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadRooms();

        loadMyRegistrations();

    }
);