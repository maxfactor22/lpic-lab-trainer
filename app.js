(() => {
  "use strict";

  const STORAGE_KEY = "lpic-lab-trainer.lesson-1.v1";
  const commandResults = {
    "uname": "Linux",
    "uname -s": "Linux",
    "uname -r": "6.8.0-44-generic",
    "uname -v": "#44-Ubuntu SMP PREEMPT_DYNAMIC Thu Aug 22 13:54:21 UTC 2026",
    "uname -a": "Linux linux-mint 6.8.0-44-generic #44-Ubuntu SMP PREEMPT_DYNAMIC Thu Aug 22 13:54:21 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
  };

  const taskByCommand = {
    "uname": "uname",
    "uname -s": "uname-s",
    "uname -r": "uname-r",
    "uname -v": "uname-v",
    "uname -a": "uname-a"
  };

  const correctAnswers = {
    release: "-r",
    build: "-v"
  };

  const defaultState = () => ({
    completedTasks: [],
    correctQuestions: [],
    challengeComplete: false
  });

  const loadState = () => {
    try {
      return { ...defaultState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
    } catch {
      return defaultState();
    }
  };

  let state = loadState();

  const terminal = document.querySelector("#terminal-output");
  const terminalForm = document.querySelector("#terminal-form");
  const terminalInput = document.querySelector("#terminal-input");
  const progressLabel = document.querySelector("#progress-label");
  const progressBar = document.querySelector("#progress-bar");
  const taskCount = document.querySelector("#task-count");
  const quizStatus = document.querySelector("#quiz-status");
  const completionCard = document.querySelector("#completion-card");

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function normalizeCommand(value) {
    return value.trim().replace(/\s+/g, " ");
  }

  function addTerminalLine(text, className = "") {
    const line = document.createElement("p");
    if (className) line.className = className;
    line.textContent = text;
    terminal.append(line);
    terminal.scrollTop = terminal.scrollHeight;
  }

  function runCommand(rawCommand) {
    const command = normalizeCommand(rawCommand);
    if (!command) return;

    addTerminalLine(`max@linux-mint:~$ ${command}`, "terminal-command");

    if (Object.hasOwn(commandResults, command)) {
      addTerminalLine(commandResults[command]);
      completeTask(taskByCommand[command]);
      return;
    }

    if (command === "help") {
      addTerminalLine("Supported commands: uname, uname -s, uname -r, uname -v, uname -a, help, clear", "terminal-muted");
      return;
    }

    if (command === "clear") {
      clearTerminal();
      return;
    }

    if (command.startsWith("uname")) {
      addTerminalLine(`uname: unsupported option or format in this lesson: ${command}`, "terminal-error");
      addTerminalLine("Try one of the options shown in the task list.", "terminal-muted");
      return;
    }

    addTerminalLine(`${command.split(" ")[0]}: command not found in this simulation`, "terminal-error");
  }

  function clearTerminal() {
    terminal.replaceChildren();
    addTerminalLine("Terminal cleared. Your completed tasks are still saved.", "terminal-muted");
  }

  function completeTask(taskId) {
    if (!state.completedTasks.includes(taskId)) {
      state.completedTasks.push(taskId);
      saveState();
      renderProgress();
      const task = document.querySelector(`[data-task="${taskId}"]`);
      task?.classList.add("just-completed");
      window.setTimeout(() => task?.classList.remove("just-completed"), 700);
    }
  }

  function renderProgress() {
    let currentAssigned = false;
    document.querySelectorAll(".task").forEach((task) => {
      const isDone = state.completedTasks.includes(task.dataset.task);
      const isCurrent = !isDone && !currentAssigned;
      if (isCurrent) currentAssigned = true;
      task.classList.toggle("completed", isDone);
      task.classList.toggle("current", isCurrent);
      const stateLabel = task.querySelector(".task-state");
      if (stateLabel) stateLabel.textContent = isDone ? "Done" : isCurrent ? "Up next" : "Not started";
    });

    document.querySelectorAll(".question").forEach((question) => {
      const questionId = question.dataset.question;
      if (state.correctQuestions.includes(questionId)) {
        const input = question.querySelector(`input[value="${correctAnswers[questionId]}"]`);
        if (input) input.checked = true;
        showQuestionFeedback(question, true);
      }
    });

    const guidedCount = state.completedTasks.length;
    const quizCount = state.correctQuestions.length;
    const totalComplete = guidedCount + quizCount + Number(state.challengeComplete);
    const totalTasks = 8;
    const percentage = Math.round((totalComplete / totalTasks) * 100);

    taskCount.textContent = `${guidedCount} / 5 complete`;
    quizStatus.textContent = `${quizCount} / 2 correct`;
    progressLabel.textContent = `${totalComplete} of ${totalTasks} tasks`;
    progressBar.style.width = `${percentage}%`;
    progressBar.parentElement.setAttribute("aria-valuenow", String(percentage));
    progressBar.parentElement.setAttribute("aria-valuetext", `${percentage}% complete`);
    document.documentElement.style.setProperty("--lesson-progress", `${percentage}%`);

    completionCard.hidden = totalComplete !== totalTasks;
  }

  function showQuestionFeedback(question, isCorrect) {
    const feedback = question.querySelector(".feedback");
    feedback.className = `feedback ${isCorrect ? "correct" : "incorrect"}`;
    feedback.textContent = isCorrect
      ? "Correct. Keep that option tied to its meaning."
      : "Not quite. Run the related command again and compare the output.";
  }

  terminalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runCommand(terminalInput.value);
    terminalInput.value = "";
    terminalInput.focus();
  });

  document.querySelector("#clear-terminal").addEventListener("click", () => {
    clearTerminal();
    terminalInput.focus();
  });

  document.querySelectorAll(".command-chip").forEach((button) => {
    button.addEventListener("click", () => {
      terminalInput.value = button.dataset.command;
      terminalInput.focus();
    });
  });

  document.querySelectorAll(".task-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      button.nextElementSibling.hidden = expanded;
    });
  });

  document.querySelectorAll(".question input").forEach((input) => {
    input.addEventListener("change", () => {
      const question = input.closest(".question");
      const questionId = question.dataset.question;
      const isCorrect = input.value === correctAnswers[questionId];
      showQuestionFeedback(question, isCorrect);

      if (isCorrect && !state.correctQuestions.includes(questionId)) {
        state.correctQuestions.push(questionId);
        saveState();
        renderProgress();
      }
    });
  });

  document.querySelector("#challenge-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#challenge-input");
    const feedback = document.querySelector("#challenge-feedback");
    const isCorrect = normalizeCommand(input.value) === "uname -a";

    feedback.className = `feedback ${isCorrect ? "correct" : "incorrect"}`;
    feedback.textContent = isCorrect
      ? "Correct. uname -a requests all available system information."
      : "That does not request the full summary. Review the guided commands, then try again.";

    if (isCorrect && !state.challengeComplete) {
      state.challengeComplete = true;
      saveState();
      renderProgress();
    }
  });

  document.querySelector("#reset-progress").addEventListener("click", () => {
    const confirmed = window.confirm("Reset all progress for Lesson 1?");
    if (!confirmed) return;

    state = defaultState();
    localStorage.removeItem(STORAGE_KEY);
    document.querySelectorAll('input[type="radio"]').forEach((input) => { input.checked = false; });
    document.querySelectorAll(".feedback").forEach((feedback) => {
      feedback.className = "feedback";
      feedback.textContent = "";
    });
    document.querySelector("#challenge-input").value = "";
    clearTerminal();
    renderProgress();
  });

  document.querySelector("#review-lesson").addEventListener("click", () => {
    document.querySelector("#mission").scrollIntoView({ behavior: "smooth" });
    terminalInput.focus({ preventScroll: true });
  });

  renderProgress();
})();
