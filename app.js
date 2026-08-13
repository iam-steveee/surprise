const $ = (selector) => document.querySelector(selector);
const steps = [...document.querySelectorAll(".step")];

const state = {
    name: "",
    date: null,
    theme: null,
    birthday: false,
    age: 0,
    next: null
};

let selectedDate = null;
let calendarDate = new Date();
let countdownTimer = null;

function showStep(id) {
    const target = document.getElementById(id);

    if (!target) {
        console.error("Step not found:", id);
        return;
    }

    steps.forEach(step => step.classList.remove("active"));
    target.classList.add("active");
    window.scrollTo(0, 0);
}

/* Welcome */
$("#enterWelcome").addEventListener("click", () => {
    $("#watermark").classList.add("visible");
    showStep("nameStep");
});

/* Name */
$("#name").addEventListener("input", () => {
    $("#nameContinue").disabled = !$("#name").value.trim();
});

$("#nameContinue").addEventListener("click", () => {
    if (!$("#name").value.trim()) return;
    showStep("dateStep");
});

/* Calendar */
function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    $("#monthLabel").textContent =
        calendarDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
        });

    const days = $("#days");
    days.innerHTML = "";

    let firstDay = new Date(year, month, 1).getDay();

    // Monday = first day
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        empty.className = "day";
        days.appendChild(empty);
    }

    const today = new Date();

    for (let day = 1; day <= totalDays; day++) {
        const element = document.createElement("div");

        element.className = "day clickable";
        element.textContent = day;

        if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {
            element.classList.add("today");
        }

        if (
            selectedDate &&
            day === selectedDate.getDate() &&
            month === selectedDate.getMonth() &&
            year === selectedDate.getFullYear()
        ) {
            element.classList.add("selected");
        }

        element.addEventListener("click", () => {
            selectedDate = new Date(year, month, day);

            $("#dateDisplay").innerHTML =
                selectedDate.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }) + " <span>✓</span>";

            $("#dateContinue").disabled = false;

            renderCalendar();
        });

        days.appendChild(element);
    }
}

$("#dateDisplay").addEventListener("click", () => {
    $("#calendar").classList.toggle("open");
});

$("#prev").addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
});

$("#next").addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
});

$("#dateContinue").addEventListener("click", () => {
    if (!selectedDate) return;
    showStep("themeStep");
});

renderCalendar();

/* Theme */
document.querySelectorAll(".theme").forEach(button => {
    button.addEventListener("click", () => {

        document
            .querySelectorAll(".theme")
            .forEach(item => item.classList.remove("selected"));

        button.classList.add("selected");

        state.theme = button.dataset.theme;

        document.body.classList.remove("female", "male");

        if (state.theme === "female") {
            document.body.classList.add("female");
        }

        if (state.theme === "male") {
            document.body.classList.add("male");
        }

        $("#themeContinue").disabled = false;
    });
});

$("#themeContinue").addEventListener("click", () => {
    if (!state.theme) return;

    prepareExperience();
});

/* Date calculations */
function calculateAge(birthDate, now) {

    let age = now.getFullYear() - birthDate.getFullYear();

    if (
        now.getMonth() < birthDate.getMonth() ||
        (
            now.getMonth() === birthDate.getMonth() &&
            now.getDate() < birthDate.getDate()
        )
    ) {
        age--;
    }

    return age;
}

function getNextBirthday(now, birthDate) {

    let next = new Date(
        now.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds()
    );

    if (next <= now) {
        next = new Date(
            now.getFullYear() + 1,
            birthDate.getMonth(),
            birthDate.getDate(),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds()
        );
    }

    return next;
}

/* Experience preparation */
async function prepareExperience() {

    state.name = $("#name").value.trim();
    state.date = selectedDate;

    if (!state.name || !state.date || !state.theme) {
        return;
    }

    const now = new Date();

    state.birthday =
        now.getMonth() === state.date.getMonth() &&
        now.getDate() === state.date.getDate();

    state.age = calculateAge(state.date, now);
    state.next = getNextBirthday(now, state.date);

    showStep("checkingStep");

    const bar = $("#checkbar");
    const text = $("#checkingText");

    const messages = [
        "Reading your date...",
        "Comparing today...",
        "Calculating your age...",
        "Preparing your theme..."
    ];

    for (let i = 0; i < messages.length; i++) {

        text.textContent = messages[i];

        bar.style.width =
            ((i + 1) / messages.length * 100) + "%";

        await new Promise(resolve => setTimeout(resolve, 650));
    }

    if (state.birthday) {

        $("#bName").textContent = state.name;
        $("#age").textContent = state.age;

        $("#daysLived").textContent =
            Math.floor(
                (now - state.date) / 86400000
            ).toLocaleString();

        document.querySelectorAll(".female-only").forEach(image => {
            image.style.display =
                state.theme === "female" ? "block" : "none";
        });

        document.querySelectorAll(".male-only").forEach(image => {
            image.style.display =
                state.theme === "male" ? "block" : "none";
        });

        showStep("birthdayStep");

    } else {

        $("#nName").textContent = state.name;
        $("#normalAge").textContent = state.age;

        $("#nextBirthdayDate").textContent =
            state.next.toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });

        showStep("normalStep");

        startCountdown();
    }
}

/* Countdown */
function startCountdown() {

    clearInterval(countdownTimer);

    function update() {

        const now = new Date();
        const target = getNextBirthday(now, state.date);

        const totalSeconds =
            Math.max(0, Math.floor((target - now) / 1000));

        const days =
            Math.floor(totalSeconds / 86400);

        const hours =
            Math.floor((totalSeconds % 86400) / 3600);

        const minutes =
            Math.floor((totalSeconds % 3600) / 60);

        const seconds =
            totalSeconds % 60;

        $("#countdown").textContent =
            `${days}d ${String(hours).padStart(2, "0")}h ` +
            `${String(minutes).padStart(2, "0")}m ` +
            `${String(seconds).padStart(2, "0")}s`;
    }

    update();

    countdownTimer = setInterval(update, 1000);
}

/* Birthday → Message */
$("#birthdayContinue").addEventListener("click", () => {

    $("#mName").textContent = state.name;

    showStep("messageStep");
});

/* Message → Wish */
$("#messageContinue").addEventListener("click", () => {
    showStep("wishStep");
});

/* Normal → Fun */
$("#normalContinue").addEventListener("click", () => {
    showStep("normalFunStep");
});

/* Normal Fun → Final */
$("#normalFunContinue").addEventListener("click", () => {

    $("#finalTitle").textContent =
        `Your day will come, ${state.name}.`;

    $("#finalText").textContent =
        "Until then, keep collecting moments worth remembering. " +
        "When the date arrives, this little page will know.";

    showStep("finalStep");
});

/* Wish */
$("#wish").addEventListener("click", () => {

    $("#wish").disabled = true;
    $("#wish").textContent = "✦ Wish Received";

    setTimeout(() => {

        $("#wishResult").textContent =
            "Your wish is yours alone. Keep it safe.";

        $("#wishContinue").hidden = false;

    }, 700);
});

/* Wish → Final */
$("#wishContinue").addEventListener("click", () => {

    $("#finalTitle").textContent =
        `Here's to another year, ${state.name}.`;

    $("#finalText").textContent =
        "Make it yours. Keep the good moments close, " +
        "leave room for new ones, and enjoy the chapter " +
        "that starts today.";

    showStep("finalStep");
});

/* Share */
const shareURL =
    "https://iam-steveee.github.io/surprise";

$("#shareUrl").value = shareURL;

$("#copy").addEventListener("click", async () => {

    try {

        await navigator.clipboard.writeText(shareURL);

        $("#copy").textContent = "Copied!";

        setTimeout(() => {
            $("#copy").textContent = "Copy";
        }, 1500);

    } catch {

        prompt("Copy this link:", shareURL);
    }
});

$("#share").addEventListener("click", async () => {

    if (navigator.share) {

        try {

            await navigator.share({
                title: "A Birthday Surprise",
                text: "I made a birthday surprise for you.",
                url: shareURL
            });

        } catch {}

    } else {

        try {
            await navigator.clipboard.writeText(shareURL);
            $("#share").textContent = "Link Copied!";
        } catch {
            prompt("Copy this link:", shareURL);
        }
    }
});

/* Start Again */
$("#again").addEventListener("click", () => {

    clearInterval(countdownTimer);

    location.reload();
});
