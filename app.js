(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const steps = $$(".step");

  const state = { name: "", date: null, theme: null, birthday: false, age: 0 };
  const MIN_YEAR = 1900;
  const MAX_YEAR = new Date().getFullYear();
  let pickerYear = new Date().getFullYear();
  let pickerMonth = new Date().getMonth();
  let selectedDate = null;
  let countdownTimer = null;

  function show(id) {
    const target = document.getElementById(id);
    if (!target) return false;
    steps.forEach(step => step.classList.remove("active"));
    target.classList.add("active");
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return true;
  }

  function setDisabled(id, disabled) {
    const el = document.getElementById(id);
    if (el) el.disabled = disabled;
  }

  function resetStepScroll() {
    const active = document.querySelector(".step.active");
    if (active) active.scrollTop = 0;
  }

  // ---------- Welcome ----------
  $("#enterWelcome")?.addEventListener("click", () => {
    $("#watermark")?.classList.add("visible");
    show("nameStep");
  });

  // ---------- Name ----------
  const nameInput = $("#name");
  nameInput?.addEventListener("input", () => setDisabled("nameContinue", !nameInput.value.trim()));
  $("#nameContinue")?.addEventListener("click", () => {
    const name = nameInput?.value.trim();
    if (!name) return;
    state.name = name;
    show("dateStep");
    resetStepScroll();
  });

  // ---------- Date picker ----------
  const calendar = $("#calendar");
  const dateDisplay = $("#dateDisplay");
  const yearGrid = $("#yearGrid");
  const yearSearch = $("#yearSearch");
  const yearSearchBtn = $("#yearSearchBtn");
  const monthGrid = $("#monthGrid");
  const chosenYear = $("#chosenYear");
  const monthLabel = $("#monthLabel");
  const daysBox = $("#days");

  function openCalendar() {
    calendar?.classList.add("open");
    calendar?.setAttribute("aria-hidden", "false");
    openPickerStep("yearPicker");
    renderYears();
  }

  function closeCalendar() {
    calendar?.classList.remove("open");
    calendar?.setAttribute("aria-hidden", "true");
  }

  dateDisplay?.addEventListener("click", () => {
    if (calendar?.classList.contains("open")) closeCalendar();
    else openCalendar();
  });
  $("#dateBack")?.addEventListener("click", closeCalendar);

  function openPickerStep(id) {
    $$(".picker-step").forEach(step => step.classList.remove("active"));
    const target = document.getElementById(id);
    if (target) target.classList.add("active");
  }

  function renderYears() {
    if (!yearGrid) return;
    yearGrid.innerHTML = "";
    const fragment = document.createDocumentFragment();
    for (let y = MAX_YEAR; y >= MIN_YEAR; y--) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "year-btn";
      btn.textContent = String(y);
      if (selectedDate?.getFullYear() === y) btn.classList.add("selected");
      btn.addEventListener("click", () => chooseYear(y));
      fragment.appendChild(btn);
    }
    yearGrid.appendChild(fragment);
  }

  function chooseYear(year) {
    if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) return;
    pickerYear = year;
    chosenYear.textContent = String(year);
    renderMonths();
    openPickerStep("monthPicker");
  }

  function renderMonths() {
    if (!monthGrid) return;
    const months = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleDateString("en-US", { month: "long" }));
    monthGrid.innerHTML = "";
    months.forEach((label, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "month-btn";
      btn.textContent = label;
      if (selectedDate && selectedDate.getFullYear() === pickerYear && selectedDate.getMonth() === i) btn.classList.add("selected");
      btn.addEventListener("click", () => chooseMonth(i));
      monthGrid.appendChild(btn);
    });
  }

  function chooseMonth(month) {
    pickerMonth = month;
    renderDays();
    openPickerStep("dayPicker");
  }

  function renderDays() {
    if (!daysBox || !monthLabel) return;
    monthLabel.textContent = new Date(pickerYear, pickerMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    daysBox.innerHTML = "";

    let firstDay = new Date(pickerYear, pickerMonth, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < firstDay; i++) {
      daysBox.appendChild(document.createElement("div"));
    }

    const totalDays = new Date(pickerYear, pickerMonth + 1, 0).getDate();
    const today = new Date();
    const fragment = document.createDocumentFragment();

    for (let day = 1; day <= totalDays; day++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "day click";
      cell.textContent = String(day);

      if (day === today.getDate() && pickerMonth === today.getMonth() && pickerYear === today.getFullYear()) cell.classList.add("today");
      if (selectedDate && day === selectedDate.getDate() && pickerMonth === selectedDate.getMonth() && pickerYear === selectedDate.getFullYear()) cell.classList.add("selected");

      cell.addEventListener("click", () => selectDate(pickerYear, pickerMonth, day));
      fragment.appendChild(cell);
    }
    daysBox.appendChild(fragment);
  }

  function selectDate(year, month, day) {
    const chosen = new Date(year, month, day, 12, 0, 0, 0);
    if (chosen > new Date()) {
      return;
    }
    selectedDate = chosen;
    state.date = chosen;
    dateDisplay.innerHTML = `${chosen.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })} <span>✓</span>`;
    setDisabled("dateContinue", false);
    closeCalendar();
  }

  yearSearchBtn?.addEventListener("click", () => {
    const year = Number(yearSearch.value.trim());
    if (year >= MIN_YEAR && year <= MAX_YEAR) {
      yearSearch.classList.remove("invalid");
      chooseYear(year);
    } else {
      yearSearch.classList.add("invalid");
      yearSearch.focus();
    }
  });

  yearSearch?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") yearSearchBtn?.click();
  });
  yearSearch?.addEventListener("input", () => yearSearch.classList.remove("invalid"));

  $("#backToYear")?.addEventListener("click", () => {
    renderYears();
    openPickerStep("yearPicker");
  });
  $("#backToMonth")?.addEventListener("click", () => {
    renderMonths();
    openPickerStep("monthPicker");
  });
  $("#nextMonth")?.addEventListener("click", () => {
    pickerMonth++;
    if (pickerMonth > 11) {
      pickerMonth = 0;
      if (pickerYear < MAX_YEAR) pickerYear++;
      else pickerMonth = 11;
    }
    renderDays();
  });

  $("#dateContinue")?.addEventListener("click", () => {
    if (!state.date) return;
    show("themeStep");
  });

  // Initial picker content.
  renderYears();

  // ---------- Gender ----------
  $$(".theme").forEach(button => {
    button.addEventListener("click", () => {
      $$(".theme").forEach(item => {
        item.classList.remove("selected");
        item.setAttribute("aria-pressed", "false");
      });
      button.classList.add("selected");
      button.setAttribute("aria-pressed", "true");
      state.theme = button.dataset.theme;
      document.body.classList.remove("female", "male");
      document.body.classList.add(state.theme);
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
    if (now.getMonth() < birthDate.getMonth() || (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate())) age--;
    return Math.max(0, age);
  }

  function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  }

  function makeBirthdayDate(year, birthDate) {
    const month = birthDate.getMonth();
    const day = birthDate.getDate();
    if (month === 1 && day === 29 && !isLeapYear(year)) return new Date(year, 1, 28, 23, 59, 59, 999);
    return new Date(year, month, day, 23, 59, 59, 999);
  }

  function nextBirthday(now, birthDate) {
    let year = now.getFullYear();
    let target = makeBirthdayDate(year, birthDate);
    if (target.getTime() <= now.getTime()) target = makeBirthdayDate(year + 1, birthDate);
    return target;
  }

  async function prepareExperience() {
    const now = new Date();
    state.birthday = now.getMonth() === state.date.getMonth() && now.getDate() === state.date.getDate();
    state.age = calculateAge(state.date, now);
    show("checkingStep");

    const bar = $("#checkbar");
    const text = $("#checkingText");
    const messages = ["Reading your date...", "Comparing today...", "Calculating your age...", "Preparing your theme..."];

    for (let i = 0; i < messages.length; i++) {
      if (text) text.textContent = messages[i];
      if (bar) bar.style.width = `${(i + 1) * 25}%`;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (state.birthday) {
      $("#bName").textContent = state.name;
      $("#age").textContent = state.age;
      $("#daysLived").textContent = Math.max(0, Math.floor((now - state.date) / 86400000)).toLocaleString();
      $("#birthdayIntro").textContent = state.theme === "female"
        ? "Today deserves a little extra sparkle. This page is yours, so enjoy every part of it."
        : "Today is your day. Take a breath, enjoy it, and make the next chapter worth remembering.";
      $$(".female-only").forEach(el => el.style.display = state.theme === "female" ? "block" : "none");
      $$(".male-only").forEach(el => el.style.display = state.theme === "male" ? "block" : "none");
      show("birthdayStep");
    } else {
      $("#nName").textContent = state.name;
      $("#normalAge").textContent = state.age;
      const next = nextBirthday(now, state.date);
      $("#nextBirthdayDate").textContent = next.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
      $("#nextDay").textContent = next.toLocaleDateString("en-US", { weekday: "long" });
      $("#dateJoke").textContent = `Your next birthday lands on a ${$("#nextDay").textContent}. The calendar has spoken.`;
      show("normalStep");
      startCountdown();
    }
  }

  // ---------- Normal path ----------
  $("#normalContinue")?.addEventListener("click", () => show("normalFunStep"));
  $("#normalFunContinue")?.addEventListener("click", () => {
    $("#finalTitle").textContent = `Your day will come, ${state.name}.`;
    $("#finalText").textContent = "Until then, keep collecting moments worth remembering. When the date arrives, this little page will know.";
    show("finalStep");
  });

  // ---------- Birthday path ----------
  $("#birthdayContinue")?.addEventListener("click", () => {
    $("#mName").textContent = state.name;
    show("messageStep");
  });
  $("#messageContinue")?.addEventListener("click", () => show("wishStep"));

  // ---------- Countdown ----------
  function startCountdown() {
    clearInterval(countdownTimer);
    const tick = () => {
      if (!state.date) return;
      const now = new Date();
      const target = nextBirthday(now, state.date);
      const totalSeconds = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const countdown = $("#countdown");
      if (countdown) countdown.textContent = `${days}d ${String(hours).padStart(2,"0")}h ${String(minutes).padStart(2,"0")}m ${String(seconds).padStart(2,"0")}s`;
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
      if (result) result.textContent = "Your wish is yours alone. Keep it safe.";
      if (continueButton) continueButton.hidden = false;
    }, 700);
  });

  $("#wishContinue")?.addEventListener("click", () => {
    $("#finalTitle").textContent = `Here's to another year, ${state.name}.`;
    $("#finalText").textContent = "Make it yours. Keep the good moments close, leave room for new ones, and enjoy the chapter that starts today.";
    show("finalStep");
  });

  // ---------- Share ----------
  const shareURL = "https://iam-steveee.github.io/surprise";
  if ($("#shareUrl")) $("#shareUrl").value = shareURL;

  $("#copy")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(shareURL);
      $("#copy").textContent = "Copied!";
      setTimeout(() => $("#copy").textContent = "Copy", 1500);
    } catch {
      window.prompt("Copy this link:", shareURL);
    }
  });

  $("#share")?.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "A Birthday Surprise", text: "I made a birthday surprise for you.", url: shareURL });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareURL);
      $("#share").textContent = "Link Copied!";
      setTimeout(() => $("#share").textContent = "Share Your Surprise →", 1600);
    } catch {
      window.prompt("Copy this link:", shareURL);
    }
  });

  $("#again")?.addEventListener("click", () => {
    clearInterval(countdownTimer);
    window.location.reload();
  });

  $$('button').forEach(button => button.setAttribute('type','button'));
  window.addEventListener("pageshow", () => {
    if (!document.querySelector(".step.active")) show("welcome");
  });
})();
