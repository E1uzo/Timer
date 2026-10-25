(function () {
  "use strict";

  const RADIUS = 90;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const MAX_MINUTES = 99;
  const TICK_MS = 250;

  const ring = document.getElementById("progressRing");
  const timeDisplay = document.getElementById("timeDisplay");
  const statusDot = document.getElementById("statusDot");
  const minutesInput = document.getElementById("minutesInput");
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resetBtn = document.getElementById("resetBtn");

  const state = {
    status: "idle",
    totalSeconds: 0,
    secondsLeft: 0,
  };

  let intervalId = null;
  let lastTickAt = 0;
  let lastMinuteNotified = -1;

  ring.style.strokeDasharray = String(CIRCUMFERENCE);
  ring.style.strokeDashoffset = String(CIRCUMFERENCE);

  function formatTime(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function render() {
    timeDisplay.textContent = formatTime(state.secondsLeft);

    const progress =
      state.totalSeconds > 0 ? state.secondsLeft / state.totalSeconds : 0;
    ring.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - progress));

    ring.setAttribute(
      "stroke",
      state.status === "finished" ? "#e74c3c" : "#3498db"
    );

    statusDot.classList.toggle("visible", state.status === "running");

    const isRunning = state.status === "running";
    const isPaused = state.status === "paused";
    const isIdle = state.status === "idle";
    const isFinished = state.status === "finished";

    minutesInput.disabled = isRunning || isPaused;

    startBtn.hidden = !(isIdle || isFinished);
    startBtn.textContent = isFinished ? "Заново" : "Старт";

    pauseBtn.hidden = !(isRunning || isPaused);
    pauseBtn.textContent = isRunning ? "Пауза" : "Продолжить";

    resetBtn.disabled = isIdle;
  }

  function tick() {
    const now = Date.now();
    const elapsedSec = Math.floor((now - lastTickAt) / 1000);

    if (elapsedSec < 1) return;

    lastTickAt += elapsedSec * 1000;

    const prev = state.secondsLeft;
    state.secondsLeft = Math.max(0, prev - elapsedSec);

    const prevMinute = Math.floor(prev / 60);
    const curMinute = Math.floor(state.secondsLeft / 60);
    if (
      curMinute < prevMinute &&
      state.secondsLeft > 0 &&
      lastMinuteNotified !== curMinute
    ) {
      lastMinuteNotified = curMinute;
      notify("Осталось " + curMinute + " мин.");
    }

    if (state.secondsLeft === 0) {
      finish();
      return;
    }

    render();
  }

  function startLoop() {
    stopLoop();
    lastTickAt = Date.now();
    intervalId = window.setInterval(tick, TICK_MS);
  }

  function stopLoop() {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  function startTimer() {
    let minutes = parseInt(minutesInput.value, 10);
    if (!Number.isFinite(minutes) || minutes < 1) minutes = 1;
    if (minutes > MAX_MINUTES) minutes = MAX_MINUTES;
    minutesInput.value = String(minutes);

    state.totalSeconds = minutes * 60;
    state.secondsLeft = state.totalSeconds;
    state.status = "running";
    lastMinuteNotified = Math.floor(state.secondsLeft / 60);

    startLoop();
    render();
  }

  function pauseTimer() {
    if (state.status === "running") {
      stopLoop();
      state.status = "paused";
      render();
    } else if (state.status === "paused") {
      state.status = "running";
      startLoop();
      render();
    }
  }

  function resetTimer() {
    stopLoop();
    state.status = "idle";
    state.totalSeconds = 0;
    state.secondsLeft = 0;
    lastMinuteNotified = -1;
    render();
  }

  function finish() {
    stopLoop();
    state.status = "finished";
    state.secondsLeft = 0;
    render();
    notify("Таймер завершён!");
  }

  function notify(text) {
    console.log("[Timer]", text);
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Таймер", { body: text });
      } catch (e) {}
    }
  }

  function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(function () {});
    }
  }

  startBtn.addEventListener("click", function () {
    requestNotificationPermission();
    startTimer();
  });

  pauseBtn.addEventListener("click", pauseTimer);
  resetBtn.addEventListener("click", resetTimer);

  minutesInput.addEventListener("change", function () {
    let v = parseInt(minutesInput.value, 10);
    if (!Number.isFinite(v)) v = 1;
    v = Math.min(Math.max(v, 1), MAX_MINUTES);
    minutesInput.value = String(v);
  });

  window.addEventListener("beforeunload", function (e) {
    if (state.status === "running") {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  render();
})();
