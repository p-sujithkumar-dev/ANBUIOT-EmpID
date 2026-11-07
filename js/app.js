// ==========================================
// ANBU IoT - Employee Digital ID Card
// Localhost + GitHub Pages Compatible
// ==========================================

const DATA_PATH = "./data/";

const EMPLOYEE_COLORS = {
    purple: "#A78BFA",
    blue: "#38BDF8",
    green: "#34D399",
    red: "#FB7185",
    orange: "#F59E0B"
};

let settings = {};
let typingTimer = null;

// ==========================================
// DOM ELEMENTS
// ==========================================

const elements = {
    card: document.getElementById("employeeCard"),
    employeeName: document.getElementById("employeeName"),
    employeeId: document.getElementById("employeeId"),
    designation: document.getElementById("typedDesignation"),
    department: document.getElementById("departmentWatermark"),
    email: document.getElementById("emailText"),
    emailLink: document.getElementById("emailLink"),
    phone: document.getElementById("phoneText"),
    phoneLink: document.getElementById("phoneLink"),
    profileImage: document.getElementById("profileImage"),
    companyLogo: document.getElementById("companyLogo"),
    socialLinks: document.getElementById("socialLinks"),
    barcode: document.getElementById("employeeBarcode"),
    barcodeLabel: document.getElementById("barcodeLabel")
};

// ==========================================
// JSON FETCH
// ==========================================

async function loadJSON(fileName) {
    try {
        const response = await fetch(
            new URL(`${DATA_PATH}${fileName}`, window.location.href)
        );

        if (!response.ok) {
            throw new Error(`${fileName} not found`);
        }

        return await response.json();

    } catch (error) {
        console.error("JSON Loading Error:", error);
        return null;
    }
}

// ==========================================
// MAIN INITIALIZATION
// ==========================================

async function loadEmployeeCard() {

    clearEmployeeCard();

    const params = new URLSearchParams(window.location.search);
    const employeeId = params.get("emp_id");

    // No employee ID
    if (!employeeId || !employeeId.trim()) {
        console.warn("Employee ID not provided.");
        return;
    }

    const [employees, theme, loadedSettings] = await Promise.all([
        loadJSON("employees.json"),
        loadJSON("theme.json"),
        loadJSON("settings.json")
    ]);

    settings = loadedSettings || {};

    if (!Array.isArray(employees)) {
        console.error("Invalid employees.json format.");
        return;
    }

    if (theme) {
        applyTheme(theme);
    }

    applySettings();

    const employee = employees.find(
        emp => emp.employeeId?.toUpperCase() === employeeId.trim().toUpperCase()
    );

    // Invalid employee ID
    if (!employee) {
        console.warn("Employee not found:", employeeId);
        clearEmployeeCard();
        return;
    }

    applyEmployeeColor(employee.themeColor);

    renderEmployee(employee);

    setupTiltEffect();
}

// ==========================================
// CLEAR CARD
// ==========================================

function clearEmployeeCard() {

    stopTypingAnimation();

    if (elements.employeeName) {
        elements.employeeName.textContent = "";
    }

    if (elements.employeeId) {
        elements.employeeId.textContent = "";
    }

    if (elements.designation) {
        elements.designation.textContent = "";
    }

    if (elements.department) {
        elements.department.textContent = "";
    }

    if (elements.email) {
        elements.email.textContent = "";
    }

    if (elements.phone) {
        elements.phone.textContent = "";
    }

    if (elements.emailLink) {
        elements.emailLink.removeAttribute("href");
    }

    if (elements.phoneLink) {
        elements.phoneLink.removeAttribute("href");
    }

    if (elements.profileImage) {
        elements.profileImage.removeAttribute("src");
        elements.profileImage.alt = "";
    }

    if (elements.socialLinks) {
        elements.socialLinks.innerHTML = "";
    }

    if (elements.barcode && typeof JsBarcode !== "undefined") {
        elements.barcode.innerHTML = "";
    }

    if (elements.barcodeLabel) {
        elements.barcodeLabel.textContent = "";
    }

    if (elements.companyLogo) {
        elements.companyLogo.src = "./assets/company-logo.png";
    }
}

// ==========================================
// APPLY GLOBAL THEME
// ==========================================

function applyTheme(theme) {

    const root = document.documentElement;

    if (theme.accent) {
        root.style.setProperty("--accent", theme.accent);
    }

    if (theme.cardStart) {
        root.style.setProperty("--card-start", theme.cardStart);
    }

    if (theme.cardEnd) {
        root.style.setProperty("--card-end", theme.cardEnd);
    }

    if (theme.pageBackground) {
        root.style.setProperty("--page-background", theme.pageBackground);
    }

    if (theme.text) {
        root.style.setProperty("--text", theme.text);
    }

    if (theme.muted) {
        root.style.setProperty("--muted", theme.muted);
    }

    if (theme.barcodeColor) {
        root.style.setProperty("--barcode-color", theme.barcodeColor);
    }
}

// ==========================================
// APPLY SETTINGS
// ==========================================

function applySettings() {

    const root = document.documentElement;

    if (settings.cardWidth) {
        root.style.setProperty("--card-width", settings.cardWidth);
    }

    if (settings.cardMinHeight) {
        root.style.setProperty("--card-min-height", settings.cardMinHeight);
    }
}

// ==========================================
// EMPLOYEE COLOR
// ==========================================

function applyEmployeeColor(colorName) {

    const color = EMPLOYEE_COLORS[colorName] || EMPLOYEE_COLORS.purple;

    const root = document.documentElement;

    root.style.setProperty("--accent", color);

    const rgb = hexToRGB(color);

    root.style.setProperty(
        "--accent-rgb",
        `${rgb.r}, ${rgb.g}, ${rgb.b}`
    );
}

function hexToRGB(hex) {

    const value = hex.replace("#", "");

    return {
        r: parseInt(value.substring(0, 2), 16),
        g: parseInt(value.substring(2, 4), 16),
        b: parseInt(value.substring(4, 6), 16)
    };
}

// ==========================================
// RENDER EMPLOYEE DETAILS
// ==========================================

function renderEmployee(employee) {

    elements.employeeName.textContent = employee.name || "";

    elements.employeeId.textContent = employee.employeeId || "";

    elements.department.textContent = employee.department || "";

    elements.email.textContent = employee.email || "";

    elements.phone.textContent =
        employee.phoneDisplay || employee.phone || "";

    // Email
    if (employee.email) {
        elements.emailLink.href = `mailto:${employee.email}`;
    }

    // Phone
    if (employee.phone) {
        elements.phoneLink.href = `tel:${employee.phone}`;
    }

    // Profile image
    if (employee.profileImage) {
        setImage(elements.profileImage, employee.profileImage);
    }

    // Company logo
    if (employee.companyLogo) {
        setImage(elements.companyLogo, employee.companyLogo);
    }

    // Designation animation
    startTypingAnimation(employee.designation || "");

    // Social media
    renderSocialLinks(employee.socials || []);

    // Barcode
    generateBarcode(employee);
}

// ==========================================
// IMAGE HANDLING
// ==========================================

function setImage(imageElement, imagePath) {

    if (!imageElement || !imagePath) return;

    imageElement.onerror = function () {
        this.style.display = "none";
    };

    imageElement.onload = function () {
        this.style.display = "";
    };

    imageElement.src = imagePath;
}

// ==========================================
// SOCIAL MEDIA BUTTONS
// ==========================================

function renderSocialLinks(socials) {

    elements.socialLinks.innerHTML = "";

    if (!Array.isArray(socials)) return;

    socials.forEach(social => {

        if (!social.url || !social.url.trim()) {
            return;
        }

        let validURL;

        try {
            validURL = new URL(social.url);

            if (!["http:", "https:"].includes(validURL.protocol)) {
                return;
            }

        } catch {
            return;
        }

        const button = document.createElement("a");

        button.className = "social-btn";

        button.href = validURL.href;

        button.target = "_blank";

        button.rel = "noopener noreferrer";

        button.title = social.name || "Social Media";

        const icon = document.createElement("i");

        icon.className = social.icon || "fa-solid fa-link";

        button.appendChild(icon);

        elements.socialLinks.appendChild(button);
    });
}

// ==========================================
// TYPING ANIMATION
// ==========================================

function stopTypingAnimation() {

    if (typingTimer) {
        clearTimeout(typingTimer);
        typingTimer = null;
    }
}

function startTypingAnimation(text) {

    stopTypingAnimation();

    const target = elements.designation;

    if (!target) return;

    if (!settings.enableTypingAnimation) {
        target.textContent = text;
        return;
    }

    let index = 0;
    let deleting = false;

    const typingSpeed = Number(settings.typingSpeed) || 85;
    const deleteSpeed = Number(settings.deleteSpeed) || 40;
    const pause = Number(settings.typingPause) || 1800;

    function type() {

        if (!deleting) {

            target.textContent = text.substring(0, index + 1);

            index++;

            if (index === text.length) {

                deleting = true;

                typingTimer = setTimeout(type, pause);

                return;
            }

            typingTimer = setTimeout(type, typingSpeed);

        } else {

            target.textContent = text.substring(0, index - 1);

            index--;

            if (index === 0) {

                deleting = false;

                typingTimer = setTimeout(type, 500);

                return;
            }

            typingTimer = setTimeout(type, deleteSpeed);
        }
    }

    type();
}

// ==========================================
// BARCODE GENERATION
// ==========================================

function generateBarcode(employee) {

    if (!elements.barcode) return;

    if (settings.enableBarcode === false) {
        elements.barcode.style.display = "none";
        return;
    }

    elements.barcode.style.display = "";

    if (typeof JsBarcode === "undefined") {
        console.warn("JsBarcode library not loaded.");
        return;
    }

    const color =
        EMPLOYEE_COLORS[employee.themeColor] ||
        "#A78BFA";

    JsBarcode(elements.barcode, employee.employeeId, {
        format: "CODE128",
        lineColor: color,
        background: "transparent",
        width: 1.8,
        height: 45,
        displayValue: false,
        margin: 0
    });

    if (elements.barcodeLabel) {
        elements.barcodeLabel.textContent = employee.employeeId;
    }
}

// ==========================================
// 3D TILT EFFECT
// ==========================================

function setupTiltEffect() {

    const card = elements.card;

    if (!card) return;

    if (settings.enableCursorEffect === false) {
        card.style.transform = "";
        return;
    }

    card.addEventListener("mousemove", handleTilt);

    card.addEventListener("mouseleave", () => {
        card.style.transform = "";
    });
}

function handleTilt(event) {

    const card = elements.card;

    const rect = card.getBoundingClientRect();

    const x = event.clientX - rect.left;

    const y = event.clientY - rect.top;

    const centerX = rect.width / 2;

    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -5;

    const rotateY = ((x - centerX) / centerX) * 5;

    card.style.transform =
        `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}

// ==========================================
// START APPLICATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    loadEmployeeCard();
});