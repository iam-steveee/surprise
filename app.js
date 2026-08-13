(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const steps = $$(".step");

  const state = {
    name: "",
    date: null,
    theme: null,
    birthday: false,
    age: 0
  };

  let selectedDate = null;
  let calendarView = new Date();
  let countdownTimer = null;

  function show(id) {
    const target = document.getElementById(id);
    if (!target) {
      console.error("Navigation target not found:", id);
      return false;
    }

    steps.forEach(step => step.classList.remove("active"));
    target.classList.add("active");

    // Keep the current page usable on phones.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return true;
  }

  function setDisabled(id, disabled) {
    const el = document.getElementById(id);
    if (el) el.disabled = disabled;
  }

  // ---------- Welcome ----------
  $("#enterWelcome")?.addEventListener("click", () => {
    $("#watermark")?.classList.add("visible");
    show("nameStep");
  });

  // ---------- Name ----------
  const nameInput = $("#name");
  nameInput?.addEventListener("input", () => {
    setDisabled("nameContinue", !nameInput.value.trim());
  });

  $("#nameContinue")?.addEventListener("click", () => {
    if (!nameInput?.value.trim()) return;
    state.name = nameInput.value.trim();
    show("dateStep");
  });

  // ---------- Calendar ----------
  $("#dateDisplay")?.addEventListener("click", () => {
    $("#calendar")?.classList.toggle("open");
  });

  $("#prev")?.addEventListener("click", (event) => {
    event.preventDefault();
    calendarView.setMonth(calendarView.getMonth() - 1);
    renderCalendar();
  });

  $("#next")?.addEventListener("click", (event) => {
    event.preventDefault();
    calendarView.setMonth(calendarView.getMonth() + 1);
    renderCalendar();
  });

  function renderCalendar() {
    const year = calendarView.getFullYear();
    const month = calendarView.getMonth();
    const label = $("#monthLabel");
    const daysBox = $("#days");

    if (!label || !daysBox) return;

    label.textContent = calendarView.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    });

    daysBox.innerHTML = "";

    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.className = "day";
      daysBox.appendChild(empty);
    }

    const today = new Date();

    for (let day = 1; day <= totalDays; day++) {
      const cell = document.createElement("div");
      cell.className = "day click";
      cell.textContent = day;

      if (
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
      ) {
        cell.classList.add("today");
      }

      if (
        selectedDate &&
        day === selectedDate.getDate() &&
        month === selectedDate.getMonth() &&
        year === selectedDate.getFullYear()
      ) {
        cell.classList.add("selected");
      }

      cell.addEventListener("click", () => {
        selectedDate = new Date(year, month, day);

        $("#dateDisplay").innerHTML =
          selectedDate.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric"
          }) + " <span>✓</span>";

        setDisabled("dateContinue", false);
        renderCalendar();
      });

      daysBox.appendChild(cell);
    }
  }

  renderCalendar();

  $("#dateContinue")?.addEventListener("click", () => {
    if (!selectedDate) return;
    state.date = selectedDate;
    show("themeStep");
  });

  // ---------- Theme ----------
  $$(".theme").forEach(button => {
    button.addEventListener("click", () => {
      $$(".theme").forEach(item => item.classList.remove("selected"));
      button.classList.add("selected");

      state.theme = button.dataset.theme;

      document.body.classList.remove("female", "male");
      if (state.theme === "female") document.body.classList.add("female");
      if (state.theme === "male") document.body.classList.add("male");

      setDisabled("themeContinue", false);
    });
  });

  $("#themeContinue")?.addEventListener("click", () => {
    if (!state.theme || !state.date || !state.name) return;
    prepareExperience();
  });

  // ---------- Date calculations ----------
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

    return Math.max(0, age);
  }

  function nextBirthday(now, birthDate) {
    let target = new Date(
      now.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate(),
      0, 0, 0, 0
    );

    if (target <= now) {
      target = new Date(
        now.getFullYear() + 1,
        birthDate.getMonth(),
        birthDate.getDate(),
        0, 0, 0, 0
      );
    }

    return target;
  }

  async function prepareExperience() {
    const now = new Date();

    state.birthday =
      now.getMonth() === state.date.getMonth() &&
      now.getDate() === state.date.getDate();

    state.age = calculateAge(state.date, now);

    show("checkingStep");

    const bar = $("#checkbar");
    const text = $("#checkingText");

    const messages = [
      "Reading your date...",
      "Comparing today...",
      "Calculating your age...",
      "Preparing your theme..."
    ];

    for (let i = 0; i < messages.length; i++) {
      if (text) text.textContent = messages[i];
      if (bar) bar.style.width = `${(i + 1) * 25}%`;
      await new Promise(resolve => setTimeout(resolve, 650));
    }

    if (state.birthday) {
      $("#bName").textContent = state.name;
      $("#age").textContent = state.age;
      $("#daysLived").textContent =
        Math.floor((now - state.date) / 86400000).toLocaleString();

      $$(".female-only").forEach(el => {
        el.style.display = state.theme === "female" ? "block" : "none";
      });

      $$(".male-only").forEach(el => {
        el.style.display = state.theme === "male" ? "block" : "none";
      });

      show("birthdayStep");
    } else {
      $("#nName").textContent = state.name;
      $("#normalAge").textContent = state.age;

      const next = nextBirthday(now, state.date);

      $("#nextBirthdayDate").textContent =
        next.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric"
        });

      const dayName = next.toLocaleDateString("en-US", {
        weekday: "long"
      });

      $("#nextDay").textContent = dayName;
      $("#dateJoke").textContent =
        `Your next birthday lands on a ${dayName}. The calendar has spoken.`;

      show("normalStep");
      startCountdown();
    }
  }

  // ---------- Normal path ----------
  $("#normalContinue")?.addEventListener("click", () => {
    show("normalFunStep");
  });

  $("#normalFunContinue")?.addEventListener("click", () => {
    $("#finalTitle").textContent =
      `Your day will come, ${state.name}.`;

    $("#finalText").textContent =
      "Until then, keep collecting moments worth remembering. " +
      "When the date arrives, this little page will know.";

    show("finalStep");
  });

  // ---------- Birthday path ----------
  $("#birthdayContinue")?.addEventListener("click", () => {
    $("#mName").textContent = state.name;
    show("messageStep");
  });

  $("#messageContinue")?.addEventListener("click", () => {
    show("wishStep");
  });

  // ---------- Countdown ----------
  function startCountdown() {
    clearInterval(countdownTimer);

    const tick = () => {
      if (!state.date) return;

      const now = new Date();
      const target = nextBirthday(now, state.date);
      const totalSeconds = Math.max(
        0,
        Math.floor((target.getTime() - now.getTime()) / 1000)
      );

      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const countdown = $("#countdown");
      if (countdown) {
        countdown.textContent =
          `${days}d ${String(hours).padStart(2, "0")}h ` +
          `${String(minutes).padStart(2, "0")}m ` +
          `${String(seconds).padStart(2, "0")}s`;
      }
    };

    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  // ---------- Wish ----------
  $("#wish")?.addEventListener("click", () => {
    const button = $("#wish");
    const result = $("#wishResult");
    const continueButton = $("#wishContinue");

    button.disabled = true;
    button.textContent = "✦ Wish Received";

    setTimeout(() => {
      if (result) {
        result.textContent =
          "Your wish is yours alone. Keep it safe.";
      }

      if (continueButton) {
        continueButton.hidden = false;
      }
    }, 700);
  });

  $("#wishContinue")?.addEventListener("click", () => {
    $("#finalTitle").textContent =
      `Here's to another year, ${state.name}.`;

    $("#finalText").textContent =
      "Make it yours. Keep the good moments close, " +
      "leave room for new ones, and enjoy the chapter " +
      "that starts today.";

    show("finalStep");
  });

  // ---------- Share ----------
  const shareURL = "https://iam-steveee.github.io/surprise";

  if ($("#shareUrl")) {
    $("#shareUrl").value = shareURL;
  }

  $("#copy")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(shareURL);
      $("#copy").textContent = "Copied!";

      setTimeout(() => {
        $("#copy").textContent = "Copy";
      }, 1500);
    } catch {
      window.prompt("Copy this link:", shareURL);
    }
  });

  $("#share")?.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "A Birthday Surprise",
          text: "I made a birthday surprise for you.",
          url: shareURL
        });
      } catch {
        // User cancelled the native share sheet.
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareURL);
        $("#share").textContent = "Link Copied!";
      } catch {
        window.prompt("Copy this link:", shareURL);
      }
    }
  });

  $("#again")?.addEventListener("click", () => {
    clearInterval(countdownTimer);
    window.location.reload();
  });

  // Prevent accidental form-like button behavior.
  $$("button").forEach(button => {
    button.setAttribute("type", "button");
  });

  // If a browser restores the page from its cache, make sure the
  // first interaction still has the correct state.
  window.addEventListener("pageshow", () => {
    if (!document.querySelector(".step.active")) {
      show("welcome");
    }
  });

})();
