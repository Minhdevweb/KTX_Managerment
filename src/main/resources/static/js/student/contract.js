
const CONTRACT_API = "/api/student/contracts";

const contractList = document.getElementById("contractList");
const loading = document.getElementById("loading");
const emptyState = document.getElementById("emptyState");
const contractContent = document.getElementById("contractContent");
const message = document.getElementById("message");
const detailSection = document.getElementById("detailSection");
const contractDetail = document.getElementById("contractDetail");

let contracts = [];

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char];
    });
}

function formatDate(value) {
    if (!value) return "—";

    const parts = String(value).split("-");
    if (parts.length !== 3) return escapeHtml(value);

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatMoney(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return "—";

    return amount.toLocaleString("vi-VN") + " VNĐ";
}

function getStatusInfo(status) {
    const normalized = String(status || "").toUpperCase();

    switch (normalized) {
        case "ACTIVE":
            return {
                label: "Đang hiệu lực",
                className: "status-active"
            };

        case "EXPIRED":
            return {
                label: "Đã hết hạn",
                className: "status-expired"
            };

        case "CANCELLED":
            return {
                label: "Đã hủy",
                className: "status-cancelled"
            };

        default:
            return {
                label: status || "Chưa xác định",
                className: "status-other"
            };
    }
}

function showError(text) {
    message.textContent = text;
    message.className = "message error";
    message.hidden = false;
}

function hideError() {
    message.textContent = "";
    message.hidden = true;
}

function getAuthHeaders() {
    const token = typeof getToken === "function" ? getToken() : null;

    if (!token) {
        throw new Error("Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.");
    }

    return {
        "Authorization": "Bearer " + token,
        "Accept": "application/json"
    };
}

function renderContracts() {
    contractList.innerHTML = "";

    document.getElementById("totalContracts").textContent =
        contracts.length;

    document.getElementById("latestContract").textContent =
        contracts.length > 0
            ? (contracts[0].contractNumber || "—")
            : "—";

    contracts.forEach(function (contract, index) {
        const status = getStatusInfo(contract.status);

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <span class="contract-number">
                    ${escapeHtml(contract.contractNumber || "—")}
                </span>
            </td>

            <td>
                <div class="location-info">
                    <div><strong>Tòa:</strong>
                        ${escapeHtml(contract.buildingName || "—")}
                    </div>
                    <div><strong>Phòng:</strong>
                        ${escapeHtml(contract.roomNumber || "—")}
                    </div>
                    <div><strong>Giường:</strong>
                        ${escapeHtml(contract.bedNumber || "—")}
                    </div>
                </div>
            </td>

            <td>
                <div class="date-info">
                    <div><strong>Từ:</strong>
                        ${formatDate(contract.startDate)}
                    </div>
                    <div><strong>Đến:</strong>
                        ${formatDate(contract.endDate)}
                    </div>
                </div>
            </td>

            <td>
                <span class="fee-info">
                    ${formatMoney(contract.monthlyFee)}
                </span>
            </td>

            <td>
                <span class="status-badge ${status.className}">
                    ${escapeHtml(status.label)}
                </span>
            </td>

            <td>
                <button type="button"
                        class="detail-button"
                        data-index="${index}">
                    Xem chi tiết
                </button>
            </td>
        `;

        contractList.appendChild(row);
    });

    contractContent.hidden = false;
    emptyState.hidden = true;
}

function showContractDetail(index) {
    const contract = contracts[index];

    if (!contract) return;

    const status = getStatusInfo(contract.status);

    const details = [
        ["Mã hợp đồng", contract.contractNumber],
        ["Họ và tên", contract.fullName],
        ["Tên đăng nhập", contract.username],
        ["Email", contract.email],
        ["Số điện thoại", contract.phone],
        ["Tòa nhà", contract.buildingName],
        ["Mã tòa", contract.buildingCode],
        ["Phòng", contract.roomNumber],
        ["Giường", contract.bedNumber],
        ["Mã đơn đăng ký", contract.registrationId],
        ["Ngày bắt đầu", formatDate(contract.startDate)],
        ["Ngày kết thúc", formatDate(contract.endDate)],
        ["Tiền thuê mỗi tháng", formatMoney(contract.monthlyFee)],
        ["Trạng thái hợp đồng", status.label],
        ["Ngày tạo hợp đồng", contract.createdAt
            ? escapeHtml(String(contract.createdAt).replace("T", " "))
            : "—"]
    ];

    contractDetail.innerHTML = details.map(function (item) {
        return `
            <div class="detail-item">
                <span>${escapeHtml(item[0])}</span>
                <strong>${escapeHtml(item[1] ?? "—")}</strong>
            </div>
        `;
    }).join("");

    detailSection.hidden = false;
    detailSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

async function loadContracts() {
    loading.hidden = false;
    emptyState.hidden = true;
    contractContent.hidden = true;
    detailSection.hidden = true;
    hideError();

    try {
        const response = await fetch(CONTRACT_API, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }

        if (response.status === 403) {
            throw new Error("Tài khoản hiện tại không có quyền xem hợp đồng sinh viên.");
        }

        if (!response.ok) {
            throw new Error("Không thể tải hợp đồng. Mã lỗi: " + response.status);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Dữ liệu hợp đồng trả về không đúng định dạng.");
        }

        contracts = data;
        loading.hidden = true;

        if (contracts.length === 0) {
            contractContent.hidden = true;
            emptyState.hidden = false;
            return;
        }

        renderContracts();

    } catch (error) {
        loading.hidden = true;
        showError(error.message || "Đã xảy ra lỗi khi tải hợp đồng.");
    }
}

contractList.addEventListener("click", function (event) {
    const button = event.target.closest(".detail-button");

    if (!button) return;

    showContractDetail(Number(button.dataset.index));
});

document.getElementById("refreshButton")
    .addEventListener("click", loadContracts);

document.getElementById("closeDetailButton")
    .addEventListener("click", function () {
        detailSection.hidden = true;
    });

document.addEventListener("DOMContentLoaded", function () {
    const welcomeUser = document.getElementById("welcomeUser");

    if (welcomeUser && typeof getUsername === "function") {
        const username = getUsername();
        welcomeUser.textContent = username
            ? "Xin chào, " + username
            : "";
    }

    loadContracts();
});
