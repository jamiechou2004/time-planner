const storageKey = "apple-time-planner.tasks";
const languageKey = "apple-time-planner.language";

const translations = {
  zh: {
    appName: "时间规划",
    navToday: "今日",
    navTimeline: "时间轴",
    navFocus: "专注",
    heroTitle: "把一天安排得更清楚。",
    heroText: "用简洁的时间块、优先级和专注计时，把任务从脑子里移到清晰的计划里。",
    quickPlan: "快速安排",
    clearDone: "清理完成",
    currentTime: "当前时间",
    todayProgress: "今日进度",
    plannedTasks: "计划任务",
    completed: "已完成",
    plannedTime: "计划时长",
    topPriority: "最高优先级",
    addBlock: "新增时间块",
    taskLabel: "任务",
    taskPlaceholder: "例如：整理产品方案",
    startLabel: "开始",
    endLabel: "结束",
    priorityLabel: "优先级",
    priorityHigh: "高",
    priorityMedium: "中",
    priorityLow: "低",
    priorityNone: "无",
    addToPlan: "加入今日计划",
    todayTimeline: "今日时间轴",
    focusTimer: "专注计时",
    startTimer: "开始",
    pauseTimer: "暂停",
    resetTimer: "重置",
    emptyTimeline: "今天还没有计划。先添加一个时间块。",
    taskCount: (count) => `${count} 项`,
    minutes: (count) => `${count} 分钟`,
    hours: (hours, minutes) => (minutes ? `${hours} 小时 ${minutes} 分钟` : `${hours} 小时`),
    invalidTime: "结束时间需要晚于开始时间。",
    dateLocale: "zh-CN",
    dateOptions: { weekday: "long", month: "long", day: "numeric" },
    defaultTasks: [
      "晨间复盘与今日目标",
      "深度工作：核心任务推进",
      "消息处理与沟通",
      "晚间整理计划"
    ]
  },
  en: {
    appName: "Time Planner",
    navToday: "Today",
    navTimeline: "Timeline",
    navFocus: "Focus",
    heroTitle: "Plan your day with clarity.",
    heroText: "Use simple time blocks, priorities, and focus sessions to move tasks out of your head and into a clear plan.",
    quickPlan: "Quick Plan",
    clearDone: "Clear Done",
    currentTime: "Current Time",
    todayProgress: "Today Progress",
    plannedTasks: "Planned Tasks",
    completed: "Completed",
    plannedTime: "Planned Time",
    topPriority: "Top Priority",
    addBlock: "Add Time Block",
    taskLabel: "Task",
    taskPlaceholder: "Example: organize product plan",
    startLabel: "Start",
    endLabel: "End",
    priorityLabel: "Priority",
    priorityHigh: "High",
    priorityMedium: "Medium",
    priorityLow: "Low",
    priorityNone: "None",
    addToPlan: "Add to Today's Plan",
    todayTimeline: "Today's Timeline",
    focusTimer: "Focus Timer",
    startTimer: "Start",
    pauseTimer: "Pause",
    resetTimer: "Reset",
    emptyTimeline: "No plan yet. Add a time block to start.",
    taskCount: (count) => `${count} ${count === 1 ? "item" : "items"}`,
    minutes: (count) => `${count} min`,
    hours: (hours, minutes) => (minutes ? `${hours}h ${minutes}m` : `${hours}h`),
    invalidTime: "End time must be later than start time.",
    dateLocale: "en-US",
    dateOptions: { weekday: "long", month: "long", day: "numeric" },
    defaultTasks: [
      "Morning review and goals",
      "Deep work: core task progress",
      "Messages and communication",
      "Evening plan review"
    ]
  }
};

const priorityMap = {
  "高": "high",
  "中": "medium",
  "低": "low",
  high: "high",
  medium: "medium",
  low: "low"
};

const defaultTaskTemplate = [
  { start: "09:00", end: "09:30", priority: "high" },
  { start: "10:00", end: "12:00", priority: "high" },
  { start: "14:00", end: "14:45", priority: "medium" },
  { start: "17:30", end: "18:00", priority: "low" }
];

let currentLanguage = localStorage.getItem(languageKey) === "en" ? "en" : "zh";
let tasks = loadTasks();
let timerMinutes = 25;
let timerRemaining = timerMinutes * 60;
let timerTotal = timerRemaining;
let timerId = null;

const root = document.documentElement;
const form = document.querySelector("#plannerForm");
const timelineList = document.querySelector("#timelineList");
const clockTime = document.querySelector("#clockTime");
const dateText = document.querySelector("#dateText");
const progressText = document.querySelector("#progressText");
const progressFill = document.querySelector("#progressFill");
const totalTasks = document.querySelector("#totalTasks");
const doneTasks = document.querySelector("#doneTasks");
const totalHours = document.querySelector("#totalHours");
const topPriority = document.querySelector("#topPriority");
const taskCountPill = document.querySelector("#taskCountPill");
const timerText = document.querySelector("#timerText");
const timerToggle = document.querySelector("#timerToggle");
const timerReset = document.querySelector("#timerReset");
const langToggle = document.querySelector("#langToggle");

function text(key) {
  return translations[currentLanguage][key];
}

function createDefaultTasks(language = currentLanguage) {
  return defaultTaskTemplate.map((task, index) => ({
    ...task,
    id: crypto.randomUUID(),
    title: translations[language].defaultTasks[index],
    done: false
  }));
}

function normalizeTask(task) {
  return {
    ...task,
    priority: priorityMap[task.priority] || "medium"
  };
}

function loadTasks() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return createDefaultTasks();

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.map(normalizeTask) : createDefaultTasks();
  } catch {
    return createDefaultTasks();
  }
}

function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function minutesFromTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function priorityLabel(priority) {
  const key = {
    high: "priorityHigh",
    medium: "priorityMedium",
    low: "priorityLow"
  }[priority] || "priorityMedium";
  return text(key);
}

function durationLabel(start, end) {
  const minutes = Math.max(minutesFromTime(end) - minutesFromTime(start), 0);
  if (minutes < 60) return text("minutes")(minutes);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return text("hours")(hours, rest);
}

function priorityClass(priority) {
  return priority === "high" ? "high" : priority === "low" ? "low" : "medium";
}

function renderTasks() {
  const sorted = [...tasks].sort((a, b) => minutesFromTime(a.start) - minutesFromTime(b.start));
  timelineList.innerHTML = "";

  if (!sorted.length) {
    timelineList.innerHTML = `<div class="timeline-empty">${text("emptyTimeline")}</div>`;
  }

  sorted.forEach((task) => {
    const item = document.createElement("article");
    item.className = `task-card${task.done ? " is-done" : ""}`;
    item.innerHTML = `
      <div class="time-badge">${task.start}<br>${task.end}</div>
      <div>
        <span class="task-title">${escapeHtml(task.title)}</span>
        <div class="timeline-meta">
          <span class="priority ${priorityClass(task.priority)}">${priorityLabel(task.priority)}</span>
          <span>${durationLabel(task.start, task.end)}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="tiny-button" data-action="toggle" data-id="${task.id}" type="button" aria-label="${text("completed")}">${task.done ? "↺" : "✓"}</button>
        <button class="tiny-button" data-action="delete" data-id="${task.id}" type="button" aria-label="Delete">×</button>
      </div>
    `;
    timelineList.appendChild(item);
  });

  renderStats();
}

function renderStats() {
  const total = tasks.length;
  const done = tasks.filter((task) => task.done).length;
  const progress = total ? Math.round((done / total) * 100) : 0;
  const minutes = tasks.reduce((sum, task) => {
    return sum + Math.max(minutesFromTime(task.end) - minutesFromTime(task.start), 0);
  }, 0);

  totalTasks.textContent = total;
  doneTasks.textContent = done;
  totalHours.textContent = `${(minutes / 60).toFixed(minutes % 60 ? 1 : 0)}h`;
  progressText.textContent = `${progress}%`;
  progressFill.style.width = `${progress}%`;
  taskCountPill.textContent = text("taskCount")(total);
  topPriority.textContent = tasks.some((task) => task.priority === "high")
    ? text("priorityHigh")
    : tasks.some((task) => task.priority === "medium")
      ? text("priorityMedium")
      : tasks.some((task) => task.priority === "low")
        ? text("priorityLow")
        : text("priorityNone");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char];
  });
}

function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  const date = now.toLocaleDateString(text("dateLocale"), text("dateOptions"));
  const dayProgress = ((now.getHours() * 60 + now.getMinutes()) / 1440) * 100;

  clockTime.textContent = time;
  dateText.textContent = date;
  document.querySelector(".clock-ring").style.setProperty("--clock-angle", `${dayProgress}%`);
}

function renderTimer() {
  const minutes = Math.floor(timerRemaining / 60).toString().padStart(2, "0");
  const seconds = (timerRemaining % 60).toString().padStart(2, "0");
  const progress = ((timerTotal - timerRemaining) / timerTotal) * 100;

  timerText.textContent = `${minutes}:${seconds}`;
  document.querySelector(".timer").style.setProperty("--timer-angle", `${progress}%`);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
  timerToggle.textContent = text("startTimer");
}

function applyLanguage() {
  const dictionary = translations[currentLanguage];
  document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : "en";
  document.title = dictionary.appName;
  langToggle.textContent = currentLanguage === "zh" ? "EN" : "中";

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    const value = dictionary[key];
    if (typeof value === "string") element.textContent = value;
  });

  document.querySelector("#taskTitle").placeholder = dictionary.taskPlaceholder;
  timerToggle.textContent = timerId ? dictionary.pauseTimer : dictionary.startTimer;
  timerReset.textContent = dictionary.resetTimer;
  updateClock();
  renderTasks();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = document.querySelector("#taskTitle").value.trim();
  const start = document.querySelector("#taskStart").value;
  const end = document.querySelector("#taskEnd").value;
  const priority = document.querySelector("#taskPriority").value;

  if (minutesFromTime(end) <= minutesFromTime(start)) {
    alert(text("invalidTime"));
    return;
  }

  tasks.push({ id: crypto.randomUUID(), title, start, end, priority, done: false });
  saveTasks();
  renderTasks();
  form.reset();
  document.querySelector("#taskStart").value = start;
  document.querySelector("#taskEnd").value = end;
});

timelineList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === "toggle") {
    tasks = tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task));
  }
  if (action === "delete") {
    tasks = tasks.filter((task) => task.id !== id);
  }

  saveTasks();
  renderTasks();
});

document.querySelector("#quickPlanButton").addEventListener("click", () => {
  document.querySelector("#planner").scrollIntoView({ behavior: "smooth", block: "center" });
  document.querySelector("#taskTitle").focus();
});

document.querySelector("#clearDoneButton").addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  saveTasks();
  renderTasks();
});

document.querySelector("#sampleButton").addEventListener("click", () => {
  tasks = createDefaultTasks();
  saveTasks();
  renderTasks();
});

document.querySelector("#themeToggle").addEventListener("click", () => {
  root.classList.toggle("dark");
  localStorage.setItem("apple-time-planner.theme", root.classList.contains("dark") ? "dark" : "light");
});

langToggle.addEventListener("click", () => {
  currentLanguage = currentLanguage === "zh" ? "en" : "zh";
  localStorage.setItem(languageKey, currentLanguage);
  applyLanguage();
});

timerToggle.addEventListener("click", () => {
  if (timerId) {
    stopTimer();
    return;
  }

  timerToggle.textContent = text("pauseTimer");
  timerId = setInterval(() => {
    timerRemaining = Math.max(timerRemaining - 1, 0);
    renderTimer();
    if (timerRemaining === 0) stopTimer();
  }, 1000);
});

timerReset.addEventListener("click", () => {
  stopTimer();
  timerRemaining = timerTotal;
  renderTimer();
});

document.querySelectorAll(".mode").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".mode").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    timerMinutes = Number(button.dataset.minutes);
    timerTotal = timerMinutes * 60;
    timerRemaining = timerTotal;
    stopTimer();
    renderTimer();
  });
});

if (localStorage.getItem("apple-time-planner.theme") === "dark") {
  root.classList.add("dark");
}

applyLanguage();
renderTimer();
setInterval(updateClock, 1000);
