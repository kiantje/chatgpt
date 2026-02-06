const grid = document.getElementById("game-grid");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("close");
const playBtn = document.getElementById("play");
const resetBtn = document.getElementById("reset");
const titleEl = document.getElementById("game-title");
const descEl = document.getElementById("game-desc");
const uiEl = document.getElementById("game-ui");
const resultEl = document.getElementById("result");
const winsEl = document.getElementById("wins");
const playsEl = document.getElementById("plays");
const streakEl = document.getElementById("streak");

const baseTypes = [
  {
    type: "guess",
    label: "Guess Glide",
    description: "Pick the correct number between 1 and 5.",
  },
  {
    type: "math",
    label: "Quick Math",
    description: "Solve a tiny math equation in one shot.",
  },
  {
    type: "reaction",
    label: "Reaction Spark",
    description: "Wait for green, then click as fast as you can.",
  },
  {
    type: "click",
    label: "Click Sprint",
    description: "Click the button 10 times before the timer ends.",
  },
  {
    type: "memory",
    label: "Memory Flash",
    description: "Memorize a short number sequence, then repeat it.",
  },
  {
    type: "scramble",
    label: "Word Scramble",
    description: "Unscramble a short word.",
  },
  {
    type: "color",
    label: "Color Match",
    description: "Pick the label that matches the displayed color.",
  },
  {
    type: "typing",
    label: "Typing Dash",
    description: "Type a short phrase exactly.",
  },
  {
    type: "coin",
    label: "Coin Flip",
    description: "Call the flip correctly.",
  },
  {
    type: "pattern",
    label: "Pattern Pulse",
    description: "Spot the missing number in a simple pattern.",
  },
];

const words = ["nova", "pixel", "orbit", "spark", "ghost", "pulse", "vivid", "ember"];
const phrases = [
  "sky jump",
  "fast lane",
  "neon wave",
  "drift mode",
  "blue comet",
  "silent run",
];
const colors = [
  { name: "Crimson", value: "#ff5b6c" },
  { name: "Ocean", value: "#4dd2ff" },
  { name: "Lime", value: "#8cff6a" },
  { name: "Gold", value: "#ffd166" },
  { name: "Violet", value: "#b18bff" },
];

const games = Array.from({ length: 100 }, (_, index) => {
  const base = baseTypes[index % baseTypes.length];
  return {
    id: index + 1,
    name: `${base.label} ${index + 1}`,
    description: base.description,
    type: base.type,
  };
});

let activeGame = null;
let gameState = {};
let plays = 0;
let wins = 0;
let streak = 0;

function updateScoreboard(isWin) {
  plays += 1;
  if (isWin) {
    wins += 1;
    streak += 1;
  } else {
    streak = 0;
  }
  winsEl.textContent = wins;
  playsEl.textContent = plays;
  streakEl.textContent = streak;
}

function openGame(game) {
  activeGame = game;
  titleEl.textContent = `${game.name}`;
  descEl.textContent = game.description;
  resultEl.textContent = "";
  resultEl.classList.remove("fail");
  uiEl.innerHTML = "";
  gameState = {};
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  buildUI(game.type);
}

function closeGame() {
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
  activeGame = null;
  gameState = {};
}

function buildUI(type) {
  if (type === "guess") {
    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.max = "5";
    input.placeholder = "Enter 1-5";
    uiEl.appendChild(input);
    gameState.input = input;
  }

  if (type === "math") {
    const a = rand(3, 12);
    const b = rand(2, 9);
    gameState.answer = a + b;
    const label = document.createElement("div");
    label.textContent = `${a} + ${b} = ?`;
    const input = document.createElement("input");
    input.type = "number";
    input.placeholder = "Your answer";
    uiEl.append(label, input);
    gameState.input = input;
  }

  if (type === "reaction") {
    const status = document.createElement("div");
    status.textContent = "Wait for green...";
    const btn = document.createElement("button");
    btn.className = "primary";
    btn.textContent = "Ready";
    btn.disabled = true;
    uiEl.append(status, btn);
    const delay = rand(800, 2400);
    gameState.start = null;
    gameState.timer = setTimeout(() => {
      status.textContent = "GO!";
      status.style.color = "#7effb4";
      btn.disabled = false;
      gameState.start = performance.now();
    }, delay);
    btn.addEventListener("click", () => {
      if (!gameState.start) return;
      const reaction = Math.round(performance.now() - gameState.start);
      gameState.reaction = reaction;
      status.textContent = `Reaction: ${reaction}ms`;
      btn.disabled = true;
    });
    gameState.status = status;
  }

  if (type === "click") {
    const counter = document.createElement("div");
    counter.textContent = "Clicks: 0 / 10";
    const btn = document.createElement("button");
    btn.className = "primary";
    btn.textContent = "Click!";
    const timer = document.createElement("div");
    timer.textContent = "Time: 3.0s";
    uiEl.append(counter, btn, timer);
    gameState.clicks = 0;
    gameState.started = false;
    btn.addEventListener("click", () => {
      if (!gameState.started) {
        gameState.started = true;
        const start = performance.now();
        const tick = () => {
          const elapsed = performance.now() - start;
          const remaining = Math.max(0, 3000 - elapsed);
          timer.textContent = `Time: ${(remaining / 1000).toFixed(1)}s`;
          if (remaining > 0) {
            gameState.timer = requestAnimationFrame(tick);
          }
        };
        gameState.timer = requestAnimationFrame(tick);
      }
      gameState.clicks += 1;
      counter.textContent = `Clicks: ${gameState.clicks} / 10`;
    });
  }

  if (type === "memory") {
    const sequence = Array.from({ length: 4 }, () => rand(0, 9)).join("");
    const display = document.createElement("div");
    display.textContent = sequence;
    display.style.fontSize = "1.6rem";
    display.style.letterSpacing = "0.3rem";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Repeat the sequence";
    uiEl.append(display, input);
    gameState.sequence = sequence;
    gameState.input = input;
    setTimeout(() => {
      display.textContent = "••••";
    }, 1800);
  }

  if (type === "scramble") {
    const word = pick(words);
    const scrambled = word
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
    const label = document.createElement("div");
    label.textContent = `Unscramble: ${scrambled}`;
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type the word";
    uiEl.append(label, input);
    gameState.answer = word;
    gameState.input = input;
  }

  if (type === "color") {
    const color = pick(colors);
    const swatch = document.createElement("div");
    swatch.textContent = "Color Swatch";
    swatch.style.background = color.value;
    swatch.style.padding = "1rem";
    swatch.style.borderRadius = "0.5rem";
    const select = document.createElement("select");
    colors.forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry.name;
      option.textContent = entry.name;
      select.appendChild(option);
    });
    uiEl.append(swatch, select);
    gameState.answer = color.name;
    gameState.select = select;
  }

  if (type === "typing") {
    const phrase = pick(phrases);
    const label = document.createElement("div");
    label.textContent = `Type: “${phrase}”`;
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = phrase;
    uiEl.append(label, input);
    gameState.answer = phrase;
    gameState.input = input;
  }

  if (type === "coin") {
    const select = document.createElement("select");
    ["Heads", "Tails"].forEach((side) => {
      const option = document.createElement("option");
      option.value = side;
      option.textContent = side;
      select.appendChild(option);
    });
    uiEl.append(select);
    gameState.select = select;
  }

  if (type === "pattern") {
    const start = rand(2, 7);
    const step = rand(2, 5);
    const missingIndex = rand(2, 4);
    const sequence = Array.from({ length: 5 }, (_, i) => start + step * i);
    const answer = sequence[missingIndex];
    sequence[missingIndex] = "?";
    const label = document.createElement("div");
    label.textContent = `Pattern: ${sequence.join("  ")}`;
    const input = document.createElement("input");
    input.type = "number";
    input.placeholder = "Missing number";
    uiEl.append(label, input);
    gameState.answer = answer;
    gameState.input = input;
  }
}

function handlePlay() {
  if (!activeGame) return;
  const type = activeGame.type;
  let isWin = false;
  let message = "";

  if (type === "guess") {
    const value = Number(gameState.input.value);
    const answer = rand(1, 5);
    isWin = value === answer;
    message = isWin
      ? "Spot on!"
      : `Close! The number was ${answer}.`;
  }

  if (type === "math") {
    const value = Number(gameState.input.value);
    isWin = value === gameState.answer;
    message = isWin ? "Correct!" : `Answer: ${gameState.answer}.`;
  }

  if (type === "reaction") {
    if (!gameState.reaction) {
      message = "Tap only after the button turns ready.";
      isWin = false;
    } else {
      isWin = gameState.reaction < 350;
      message = isWin
        ? `Blazing! ${gameState.reaction}ms.`
        : `Nice try: ${gameState.reaction}ms.`;
    }
  }

  if (type === "click") {
    isWin = gameState.clicks >= 10;
    message = isWin
      ? "You hit the click goal!"
      : `You reached ${gameState.clicks} clicks.`;
  }

  if (type === "memory") {
    const value = gameState.input.value.trim();
    isWin = value === gameState.sequence;
    message = isWin ? "Perfect memory!" : `Sequence was ${gameState.sequence}.`;
  }

  if (type === "scramble") {
    const value = gameState.input.value.trim().toLowerCase();
    isWin = value === gameState.answer;
    message = isWin ? "You decoded it!" : `Word was “${gameState.answer}”.`;
  }

  if (type === "color") {
    const value = gameState.select.value;
    isWin = value === gameState.answer;
    message = isWin ? "Color locked." : `Correct: ${gameState.answer}.`;
  }

  if (type === "typing") {
    const value = gameState.input.value.trim();
    isWin = value === gameState.answer;
    message = isWin ? "Clean typing!" : "Almost. Check spacing.";
  }

  if (type === "coin") {
    const call = gameState.select.value;
    const flip = Math.random() < 0.5 ? "Heads" : "Tails";
    isWin = call === flip;
    message = isWin ? "You called it!" : `It landed on ${flip}.`;
  }

  if (type === "pattern") {
    const value = Number(gameState.input.value);
    isWin = value === gameState.answer;
    message = isWin ? "Pattern solved." : `Missing number: ${gameState.answer}.`;
  }

  updateScoreboard(isWin);
  resultEl.textContent = message;
  resultEl.classList.toggle("fail", !isWin);
}

function handleReset() {
  if (!activeGame) return;
  if (gameState.timer) {
    clearTimeout(gameState.timer);
    cancelAnimationFrame(gameState.timer);
  }
  openGame(activeGame);
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

games.forEach((game) => {
  const card = document.createElement("div");
  card.className = "card";
  const name = document.createElement("h4");
  name.textContent = game.name;
  const desc = document.createElement("p");
  desc.textContent = game.description;
  const button = document.createElement("button");
  button.textContent = "Play";
  button.addEventListener("click", () => openGame(game));
  card.append(name, desc, button);
  grid.appendChild(card);
});

closeBtn.addEventListener("click", closeGame);
playBtn.addEventListener("click", handlePlay);
resetBtn.addEventListener("click", handleReset);

overlay.addEventListener("click", (event) => {
  if (event.target === overlay) closeGame();
});
