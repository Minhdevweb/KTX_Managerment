
const CONTRACT_API = "/api/admin/contracts";
const ELIGIBLE_API = `${CONTRACT_API}/eligible-registrations`;

const contractList = document.getElementById("contractList");
const registrationSelect = document.getElementById("registrationId");
const messageBox = document.getElementById("message");
const contractForm = document.getElementById("contractForm");
const createButton = document.getElementById("createButton");

// Hiển thị thông báo
function showMessage(message, type = "success") {
    messageBox.textContent = message;
    messageBox.className = `message ${type}`;
}

function clearMessage() {
    messageBox.textContent = "";
    messageBox.className = "message";
}

// Thêm JWT vào request
function authHeaders(json = false) {
    const token = typeof getToken === "function"
        ? getToken()
        : null;

    const headers = {};

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (json) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
}

// Đọc lỗi từ backend
async function errorMessage(response, fallback) {
    const text = await response.text();

    if (response.status === 401) {
        return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    }

    if (response.status === 403) {
        return "Tài khoản hiện tại không có quyền Admin hoặc token chưa đúng.";
    }

    return text || fallback;
}

// Tải các đơn đã duyệt nhưng chưa có hợp đồng
async function loadEligibleRegistrations() {
    registrationSelect.innerHTML =
        '<option value="">Đang tải danh sách...</option>';

    try {
        const response = await fetch(ELIGIBLE_API, {
            headers: authHeaders()
        });

        if (!response.ok) {
            throw new Error(
                await errorMessage(
                    response,
                    "Không thể tải đơn đăng ký."
                )
            );
        }

        const items = await response.json();

        registrationSelect.innerHTML =
            '<option value="">-- Chọn đơn đăng ký --</option>';

        if (!items.length) {
            registrationSelect.innerHTML =
                '<option value="">Không có đơn nào đủ điều kiện tạo hợp đồng</option>';
            return;
        }

        items.forEach(item => {
            const option = document.createElement("option");

            option.value = item.registrationId;

            const student =
                item.fullName ||
                item.username ||
                `Sinh viên #${item.studentId}`;

            const building =
                item.buildingName ||
                item.buildingCode ||
                "Chưa có tòa";

            option.textContent =
                `Đơn #${item.registrationId} - ${student} - ` +
                `${building}, phòng ${item.roomNumber || "?"}, ` +
                `giường ${item.bedNumber || "?"}`;

            registrationSelect.appendChild(option);
        });

    } catch (error) {
        registrationSelect.innerHTML =
            '<option value="">Không tải được danh sách</option>';

        showMessage(
            error.message || "Lỗi kết nối máy chủ.",
            "error"
        );
    }
}

// Ngăn nội dung từ dữ liệu hiển thị thành HTML
function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// Định dạng ngày
function formatDate(value) {
    if (!value) {
        return "—";
    }

    const parts = String(value).split("-");

    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    return value;
}

// Định dạng tiền Việt Nam
function formatMoney(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "—";
    }

    return amount.toLocaleString("vi-VN") + " VNĐ";
}


// Hiển thị danh sách hợp đồng
function renderContracts(items) {
    if (!Array.isArray(items) || items.length === 0) {
        contractList.innerHTML = `
            <tr>
                <td colspan="9" class="empty">
                    Chưa có hợp đồng nào.
                </td>
            </tr>
        `;
        return;
    }

    contractList.innerHTML = items.map((item, index) => {
        const student =
            item.fullName ||
            item.username ||
            `Sinh viên #${item.studentId || ""}`;

        const place =
            `${item.buildingName || item.buildingCode || "—"} / ` +
            `${item.roomNumber || "—"}`;

        const status = String(item.status || "ACTIVE").toUpperCase();

        let actionButton = "";

        if (status === "ACTIVE") {
            actionButton = `
                <button
                    type="button"
                    class="cancel-contract-button"
                    data-id="${Number(item.id)}"
                    data-number="${escapeHtml(item.contractNumber || "")}">
                    Hủy hợp đồng
                </button>
            `;
        } else {
            actionButton = `
                <span class="no-action">Không có thao tác</span>
            `;
        }

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(item.contractNumber)}</td>
                <td>${escapeHtml(student)}</td>
                <td>${escapeHtml(place)}</td>
                <td>${escapeHtml(item.bedNumber || "—")}</td>
                <td>
                    ${escapeHtml(formatDate(item.startDate))}
                    –
                    ${escapeHtml(formatDate(item.endDate))}
                </td>
                <td>${escapeHtml(formatMoney(item.monthlyFee))}</td>
                <td>
                    <span class="contract-status status-${escapeHtml(status.toLowerCase())}">
                        ${escapeHtml(status)}
                    </span>
                </td>
                <td>${actionButton}</td>
            </tr>
        `;
    }).join("");
}

// Tải danh sách hợp đồng
async function loadContracts() {
    contractList.innerHTML = `
        <tr>
            <td colspan="8" class="loading">
                Đang tải dữ liệu...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(CONTRACT_API, {
            headers: authHeaders()
        });

        if (!response.ok) {
            throw new Error(
                await errorMessage(
                    response,
                    "Không thể tải danh sách hợp đồng."
                )
            );
        }

        const items = await response.json();
        renderContracts(items);

    } catch (error) {
        contractList.innerHTML = `
            <tr>
                <td colspan="8" class="empty">
                    Không thể tải danh sách hợp đồng.
                </td>
            </tr>
        `;

        showMessage(
            error.message || "Lỗi kết nối máy chủ.",
            "error"
        );
    }
}

// Hủy hợp đồng
async function cancelContract(id, contractNumber) {
    const confirmed = window.confirm(
        `Bạn có chắc chắn muốn hủy hợp đồng ${contractNumber} không?\n\n` +
        "Hợp đồng sẽ được chuyển sang trạng thái CANCELLED."
    );

    if (!confirmed) return;

    clearMessage();

    try {
        const response = await fetch(
            `${CONTRACT_API}/${id}/cancel`,
            {
                method: "PUT",
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            throw new Error(
                await errorMessage(
                    response,
                    "Không thể hủy hợp đồng."
                )
            );
        }

        showMessage("Hủy hợp đồng thành công.");

        // Tải lại danh sách để cập nhật trạng thái
        await loadContracts();

        // Hiển thị lại thông báo thành công sau khi tải danh sách
        showMessage("Hủy hợp đồng thành công.");

    } catch (error) {
        showMessage(
            error.message || "Không thể kết nối máy chủ.",
            "error"
        );
    }
}

// Bắt sự kiện bấm nút Hủy hợp đồng
contractList.addEventListener("click", function (event) {
    const button = event.target.closest(".cancel-contract-button");

    if (!button) return;

    const id = Number(button.dataset.id);
    const contractNumber = button.dataset.number || "";

    if (!Number.isInteger(id) || id <= 0) {
        showMessage("ID hợp đồng không hợp lệ.", "error");
        return;
    }

    cancelContract(id, contractNumber);
});


// Tạo hợp đồng
contractForm.addEventListener("submit", async event => {
    event.preventDefault();
    clearMessage();

    const startDate =
        document.getElementById("startDate").value;

    const endDate =
        document.getElementById("endDate").value;

    const monthlyFee =
        document.getElementById("monthlyFee").value;

    if (!registrationSelect.value) {
        showMessage(
            "Vui lòng chọn đơn đăng ký đã được duyệt.",
            "error"
        );
        return;
    }

    if (endDate <= startDate) {
        showMessage(
            "Ngày kết thúc phải sau ngày bắt đầu.",
            "error"
        );
        return;
    }

    if (monthlyFee === "" || Number(monthlyFee) < 0) {
        showMessage(
            "Tiền thuê phải là số không âm.",
            "error"
        );
        return;
    }

    const payload = {
        registrationId: Number(registrationSelect.value),

        contractNumber:
            document.getElementById("contractNumber").value.trim()
            || null,

        startDate: startDate,
        endDate: endDate,
        monthlyFee: Number(monthlyFee)
    };

    createButton.disabled = true;
    createButton.textContent = "Đang tạo...";

    try {
        const response = await fetch(CONTRACT_API, {
            method: "POST",
            headers: authHeaders(true),
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(
                await errorMessage(
                    response,
                    "Không thể tạo hợp đồng."
                )
            );
        }

        await response.json();

        showMessage("Tạo hợp đồng thành công.");

        contractForm.reset();

        await Promise.all([
            loadContracts(),
            loadEligibleRegistrations()
        ]);

    } catch (error) {
        showMessage(
            error.message || "Không thể kết nối máy chủ.",
            "error"
        );

    } finally {
        createButton.disabled = false;
        createButton.textContent = "Tạo hợp đồng";
    }
});

// Làm mới danh sách
document.getElementById("refreshButton")
    .addEventListener("click", async () => {
        clearMessage();

        await Promise.all([
            loadContracts(),
            loadEligibleRegistrations()
        ]);
    });

// Khởi tạo trang
document.addEventListener("DOMContentLoaded", () => {
    Promise.all([
        loadContracts(),
        loadEligibleRegistrations()
    ]);
});
