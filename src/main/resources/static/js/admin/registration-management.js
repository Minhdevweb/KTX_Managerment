const API_URL =
    "/api/admin/registrations";


const registrationList =
    document.getElementById(
        "registrationList"
    );

const messageBox =
    document.getElementById("message");


const allButton =
    document.getElementById("allButton");

const pendingButton =
    document.getElementById("pendingButton");

const approvedButton =
    document.getElementById("approvedButton");

const rejectedButton =
    document.getElementById("rejectedButton");


let allRegistrations = [];

let currentFilter = "ALL";


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

        messageBox.textContent =
            "";

        messageBox.className =
            "message";

    }, 4000);
}


/* ================= LOAD ================= */

async function loadRegistrations() {

    try {

        const token =
            getToken();


        if (!token) {

            showMessage(
                "Không tìm thấy token đăng nhập!",
                "error"
            );

            return;
        }


        registrationList.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="loading"
                >
                    Đang tải dữ liệu...
                </td>
            </tr>
        `;


        const response =
            await fetch(
                API_URL,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        if (!response.ok) {

            if (
                response.status === 401
            ) {

                showMessage(
                    "Phiên đăng nhập đã hết hạn!",
                    "error"
                );

                return;
            }


            if (
                response.status === 403
            ) {

                showMessage(
                    "Bạn không có quyền quản lý đăng ký KTX!",
                    "error"
                );

                return;
            }


            throw new Error(
                "Không thể tải danh sách đăng ký!"
            );
        }


        allRegistrations =
            await response.json();


        renderRegistrations();

    } catch (error) {

        console.error(error);

        registrationList.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty"
                >
                    Không thể tải dữ liệu.
                </td>
            </tr>
        `;


        showMessage(
            error.message ||
            "Không thể kết nối đến máy chủ!",
            "error"
        );
    }
}


/* ================= RENDER ================= */

function renderRegistrations() {

    registrationList.innerHTML =
        "";


    let registrations =
        allRegistrations;


    if (
        currentFilter !== "ALL"
    ) {

        registrations =
            allRegistrations.filter(
                registration =>
                    String(
                        registration.status
                    ).toUpperCase()
                    === currentFilter
            );

    }


    if (
        !registrations ||
        registrations.length === 0
    ) {

        registrationList.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty"
                >
                    Không có đăng ký nào.
                </td>
            </tr>
        `;

        return;
    }


    registrations.forEach(
        (registration, index) => {

            const row =
                document.createElement(
                    "tr"
                );


            const status =
                String(
                    registration.status ||
                    "PENDING"
                ).toUpperCase();


            const studentName =
                registration.fullName ||
                "Chưa cập nhật";

            const username =
                registration.username ||
                "";

            const email =
                registration.email ||
                "Chưa cập nhật";

            const roomNumber =
                registration.roomNumber ||
                "";

            const bedNumber =
                registration.bedNumber ||
                "";


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>


                <td>

                    <div class="student-name">

                        ${escapeHtml(
                studentName ||
                "Chưa cập nhật"
            )}

                    </div>

                    <div class="student-username">

                        Username:
                        ${escapeHtml(
                username ||
                ""
            )}

                    </div>

                </td>


                <td>

                    ${escapeHtml(
                email||
                "Chưa cập nhật"
            )}

                </td>


                <td>

                    ${escapeHtml(
                roomNumber ||
                ""
            )}

                </td>


                <td>

                    ${escapeHtml(
                bedNumber ||
                ""
            )}

                </td>


                <td>

                    ${formatDate(
                registration.createdAt
            )}

                </td>


                <td>

                    <span
                        class="status
                        ${getStatusClass(status)}"
                    >
                        ${getStatusText(status)}
                    </span>

                </td>


                <td>

                    ${renderActions(
                registration,
                status
            )}

                </td>

            `;


            registrationList.appendChild(
                row
            );

        }
    );
}


/* ================= ACTION ================= */

function renderActions(
    registration,
    status
) {

    if (status !== "PENDING") {

        return `
            <span class="no-action">
                Đã xử lý
            </span>
        `;
    }


    return `

        <div class="action-area">

            <button
                class="approve-button"
                onclick="approveRegistration(
                    ${registration.id}
                )"
            >
                Duyệt
            </button>


            <button
                class="reject-button"
                onclick="rejectRegistration(
                    ${registration.id}
                )"
            >
                Từ chối
            </button>

        </div>

    `;
}


/* ================= APPROVE ================= */

async function approveRegistration(
    id
) {

    const confirmed =
        confirm(
            "Bạn có chắc chắn muốn duyệt đăng ký này?"
        );


    if (!confirmed) {

        return;
    }


    try {

        const token =
            getToken();


        const response =
            await fetch(
                `${API_URL}/${id}/approve`,
                {
                    method: "PUT",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        const responseText =
            await response.text();


        if (!response.ok) {

            showMessage(
                responseText ||
                "Không thể duyệt đăng ký!",
                "error"
            );

            return;
        }


        showMessage(
            "Duyệt đăng ký thành công!",
            "success"
        );


        await loadRegistrations();


    } catch (error) {

        console.error(error);

        showMessage(
            "Không thể kết nối đến máy chủ!",
            "error"
        );
    }
}


/* ================= REJECT ================= */

async function rejectRegistration(
    id
) {

    const confirmed =
        confirm(
            "Bạn có chắc chắn muốn từ chối đăng ký này?"
        );


    if (!confirmed) {

        return;
    }


    try {

        const token =
            getToken();


        const response =
            await fetch(
                `${API_URL}/${id}/reject`,
                {
                    method: "PUT",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        const responseText =
            await response.text();


        if (!response.ok) {

            showMessage(
                responseText ||
                "Không thể từ chối đăng ký!",
                "error"
            );

            return;
        }


        showMessage(
            "Đã từ chối đăng ký!",
            "success"
        );


        await loadRegistrations();


    } catch (error) {

        console.error(error);

        showMessage(
            "Không thể kết nối đến máy chủ!",
            "error"
        );
    }
}


/* ================= FILTER ================= */

function setFilter(
    filter
) {

    currentFilter =
        filter;


    document
        .querySelectorAll(
            ".filter-button"
        )
        .forEach(button => {

            button.classList.remove(
                "active"
            );

        });


    if (filter === "ALL") {

        allButton.classList.add(
            "active"
        );

    } else if (
        filter === "PENDING"
    ) {

        pendingButton.classList.add(
            "active"
        );

    } else if (
        filter === "APPROVED"
    ) {

        approvedButton.classList.add(
            "active"
        );

    } else if (
        filter === "REJECTED"
    ) {

        rejectedButton.classList.add(
            "active"
        );

    }


    renderRegistrations();
}


allButton.addEventListener(
    "click",
    () => setFilter("ALL")
);

pendingButton.addEventListener(
    "click",
    () => setFilter("PENDING")
);

approvedButton.addEventListener(
    "click",
    () => setFilter("APPROVED")
);

rejectedButton.addEventListener(
    "click",
    () => setFilter("REJECTED")
);


/* ================= STATUS ================= */

function getStatusClass(
    status
) {

    switch (status) {

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

    switch (status) {

        case "APPROVED":
            return "Đã duyệt";

        case "REJECTED":
            return "Từ chối";

        default:
            return "Chờ duyệt";
    }
}


/* ================= DATE ================= */

function formatDate(
    date
) {

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


/* ================= ESCAPE ================= */

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

        loadRegistrations();

    }
);