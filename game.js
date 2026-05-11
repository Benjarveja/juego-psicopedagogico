const state = {
  waveIndex: 0,
  enemyIndex: 0,
  lives: 3,
  score: 0,
  combo: 0,
  paused: true,
  soundOn: true,
  currentEnemy: null,
  enemyY: 0,
  enemySpeed: 0,
  attempts: 0,
  selection: {},
  selectionSlots: [],
  sequenceStep: 0,
  history: [],
  dragSourceIndex: null,
  dragDropped: false
};

const SLOT_COUNT = 10;

const ui = {
  waveLabel: document.getElementById("waveLabel"),
  scoreLabel: document.getElementById("scoreLabel"),
  enemyArea: document.getElementById("enemyArea"),
  understoodBtn: document.getElementById("understoodBtn"),
  workzone: document.getElementById("workzone"),
  instructionText: document.getElementById("instructionText"),
  elementsGrid: document.getElementById("elementsGrid"),
  slotsGrid: document.getElementById("slotsGrid"),
  progressText: document.getElementById("progressText"),
  requirementsBox: document.getElementById("requirementsBox"),
  feedbackBox: document.getElementById("feedbackBox"),
  shootBtn: document.getElementById("shootBtn"),
  helpBtn: document.getElementById("helpBtn"),
  stepBtn: document.getElementById("stepBtn"),
  messageBox: document.getElementById("messageBox"),
  livesPanel: document.getElementById("livesPanel"),
  comboLabel: document.getElementById("comboLabel"),
  comboFill: document.getElementById("comboFill"),
  overlay: document.getElementById("overlay"),
  overlayTitle: document.getElementById("overlayTitle"),
  overlayText: document.getElementById("overlayText"),
  overlayActions: document.getElementById("overlayActions"),
  startBtn: document.getElementById("startBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  soundBtn: document.getElementById("soundBtn"),
  battlefield: document.querySelector(".battlefield")
};

function playTone(type) {
  if (!state.soundOn) return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;

  const tones = {
    alert: { freq: 520, dur: 0.12 },
    success: { freq: 720, dur: 0.18 },
    fail: { freq: 260, dur: 0.18 },
    laser: { freq: 820, dur: 0.1 }
  };

  const config = tones[type] || tones.alert;
  osc.frequency.value = config.freq;
  osc.type = "triangle";
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + config.dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(now + config.dur + 0.05);
}

function showMessage(text) {
  ui.messageBox.textContent = text;
  ui.messageBox.classList.add("show");
  setTimeout(() => ui.messageBox.classList.remove("show"), 1400);
}

function resetSelection() {
  state.selection = {};
  state.sequenceStep = 0;
  state.selectionSlots = Array.from({ length: SLOT_COUNT }, () => null);
  ui.stepBtn.classList.add("hidden");
  state.dragSourceIndex = null;
  state.dragDropped = false;
  renderSlots();
  updateSelectionUI();
}

function updateLives() {
  const hearts = ui.livesPanel.querySelectorAll(".life");
  hearts.forEach((heart, index) => {
    heart.style.opacity = index < state.lives ? "1" : "0.25";
  });
}

function updateScore(points = 0) {
  state.score += points;
  ui.scoreLabel.textContent = state.score;
}

function updateCombo(success) {
  if (success) {
    state.combo += 1;
  } else {
    state.combo = 0;
  }
  ui.comboLabel.textContent = state.combo;
  const percent = Math.min(state.combo * 33, 100);
  ui.comboFill.style.width = `${percent}%`;
}

function buildElementsGrid() {
  ui.elementsGrid.innerHTML = "";
  ELEMENTS.forEach((item) => {
    const card = document.createElement("div");
    card.className = "element";
    card.dataset.id = item.id;
    card.setAttribute("draggable", "true");

    const icon = document.createElement("img");
    icon.className = "element-icon";
    icon.src = item.icon;
    icon.alt = item.label;

    const label = document.createElement("div");
    label.className = "element-label";
    label.textContent = item.label;

    const counter = document.createElement("div");
    counter.className = "count-badge";
    counter.textContent = "0";

    card.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", item.id);
    });
    card.addEventListener("click", () => addToFirstEmpty(item.id));

    card.append(icon, label, counter);
    ui.elementsGrid.append(card);
  });
}

function buildSlots() {
  ui.slotsGrid.innerHTML = "";
  for (let i = 0; i < SLOT_COUNT; i += 1) {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.index = String(i);
    slot.addEventListener("click", () => clearSlot(i));
    ui.slotsGrid.append(slot);
  }

  ui.slotsGrid.addEventListener("dragover", (event) => event.preventDefault());
  ui.slotsGrid.addEventListener("drop", (event) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    const slot = event.target.closest(".slot");
    state.dragDropped = true;
    if (slot) {
      const index = Number(slot.dataset.index);
      moveIntoSlot(index, id);
      return;
    }
    const added = addToFirstEmpty(id);
    if (added && state.dragSourceIndex !== null) {
      clearSlot(state.dragSourceIndex);
    }
  });
}

function renderSlots() {
  const slots = ui.slotsGrid.querySelectorAll(".slot");
  slots.forEach((slot, index) => {
    const id = state.selectionSlots[index];
    slot.classList.toggle("filled", Boolean(id));
    slot.innerHTML = "";
    if (id) {
      const item = ELEMENTS.find((entry) => entry.id === id);
      const img = document.createElement("img");
      img.src = item.icon;
      img.alt = item.label;
      slot.setAttribute("draggable", "true");
      slot.ondragstart = (event) => {
        state.dragSourceIndex = index;
        state.dragDropped = false;
        event.dataTransfer.setData("text/plain", id);
      };
      slot.ondragend = () => {
        if (!state.dragDropped && state.dragSourceIndex === index) {
          clearSlot(index);
        }
        state.dragSourceIndex = null;
        state.dragDropped = false;
      };
      slot.append(img);
    } else {
      slot.removeAttribute("draggable");
      slot.ondragstart = null;
      slot.ondragend = null;
    }
  });
}

function moveIntoSlot(index, id) {
  if (!state.currentEnemy) return;
  if (!id) return;
  const requirement = state.currentEnemy.requirement;
  if (requirement.type === "sequence") {
    const limit = requirement.steps[state.sequenceStep]?.count || 0;
    if (currentSelectionCount() >= limit) {
      ui.feedbackBox.textContent = "Completa el paso antes de seguir.";
      return;
    }
  }
  if (state.dragSourceIndex !== null && state.dragSourceIndex !== index) {
    state.selectionSlots[state.dragSourceIndex] = null;
  }
  state.selectionSlots[index] = id;
  recomputeSelection();
  renderSlots();
}

function addToFirstEmpty(id) {
  if (!state.currentEnemy) return;
  const index = state.selectionSlots.indexOf(null);
  if (index === -1) {
    ui.feedbackBox.textContent = "No hay mas espacio. Quita un elemento.";
    return false;
  }
  moveIntoSlot(index, id);
  return true;
}

function clearSlot(index) {
  if (!state.currentEnemy) return;
  if (!state.selectionSlots[index]) return;
  state.selectionSlots[index] = null;
  recomputeSelection();
  renderSlots();
}

function recomputeSelection() {
  state.selection = {};
  state.selectionSlots.forEach((id) => {
    if (!id) return;
    state.selection[id] = (state.selection[id] || 0) + 1;
  });
  updateSelectionUI();
}

function currentSelectionCount() {
  return Object.values(state.selection).reduce((sum, count) => sum + count, 0);
}

function updateSelectionUI() {
  const cards = ui.elementsGrid.querySelectorAll(".element");
  const total = currentSelectionCount();
  cards.forEach((card) => {
    const id = card.dataset.id;
    const count = state.selection[id] || 0;
    card.querySelector(".count-badge").textContent = count;
    card.classList.toggle("active", count > 0);
  });
  ui.progressText.textContent = `Seleccion: ${total}`;
}

function setRequirementText(requirement) {
  if (!requirement) return;
  let text = "";
  if (requirement.type === "count") {
    if (requirement.items) {
      text = requirement.items.map((item) => `${item.count} ${labelFor(item.id)}`).join(" | ");
    } else if (requirement.groups) {
      text = requirement.groups.map((group) => `${group.count} ${labelForGroup(group.group)}`).join(" | ");
    }
    if (requirement.note) text += ` (${requirement.note})`;
  } else if (requirement.type === "compare") {
    text = `Comparar: ${labelForGroup(requirement.left)} ${requirement.relation} ${labelForGroup(requirement.right)}`;
  } else if (requirement.type === "unique-items") {
    text = `Selecciona ${requirement.count} elementos diferentes`;
  } else if (requirement.type === "sequence") {
    text = `Paso 1: ${requirement.steps[0].count} | Paso 2: ${requirement.steps[1].count}`;
  } else if (requirement.type === "number-range") {
    text = `Numero entre ${requirement.min} y ${requirement.max}`;
  } else if (requirement.type === "boss") {
    text = "Mision maestra: colores + pares + forma";
  }
  ui.requirementsBox.textContent = text;
}

function labelFor(id) {
  const item = ELEMENTS.find((entry) => entry.id === id);
  return item ? item.label.toLowerCase() : id;
}

function labelForGroup(group) {
  if (group.startsWith("crystal")) return "cristales";
  if (group === "shield") return "escudos";
  if (group === "star") return "estrellas";
  return group;
}

function getCountByGroup(group) {
  if (group === "crystal") {
    return Object.keys(state.selection)
      .filter((id) => id.startsWith("crystal"))
      .reduce((sum, id) => sum + state.selection[id], 0);
  }
  if (group === "shield") return state.selection["shield"] || 0;
  if (group === "star") return state.selection["star"] || 0;
  if (group.startsWith("crystal")) return state.selection[group] || 0;
  return state.selection[group] || 0;
}

function validateSelection(requirement) {
  if (!requirement) return false;
  if (requirement.type === "count") {
    if (requirement.items) {
      return requirement.items.every((item) => (state.selection[item.id] || 0) === item.count);
    }
    if (requirement.groups) {
      return requirement.groups.every((group) => getCountByGroup(group.group) >= group.count);
    }
  }
  if (requirement.type === "compare") {
    const left = getCountByGroup(requirement.left);
    const right = getCountByGroup(requirement.right);
    if (requirement.relation === ">") return left > right;
    if (requirement.relation === "=") return left === right && left > 0;
  }
  if (requirement.type === "unique-items") {
    const unique = Object.values(state.selection).filter((count) => count > 0).length;
    return unique >= requirement.count;
  }
  if (requirement.type === "sequence") {
    return state.sequenceStep >= requirement.steps.length;
  }
  if (requirement.type === "number-range") {
    const count = Object.keys(state.selection)
      .filter((id) => id.startsWith("num-"))
      .reduce((sum, id) => sum + state.selection[id], 0);
    if (count !== requirement.count) return false;
    return Object.keys(state.selection)
      .filter((id) => id.startsWith("num-") && state.selection[id] > 0)
      .every((id) => {
        const item = ELEMENTS.find((entry) => entry.id === id);
        return item.value >= requirement.min && item.value <= requirement.max;
      });
  }
  if (requirement.type === "boss") {
    const colorOk = Object.entries(requirement.counts).every(([id, count]) => (state.selection[id] || 0) === count);
    const evenCount = ["num-2", "num-4", "num-6"].reduce((sum, id) => sum + (state.selection[id] || 0), 0);
    const shapes = Object.keys(state.selection).filter((id) => id.startsWith("shape") && state.selection[id] > 0).length;
    return colorOk && evenCount === requirement.evenNumbers && shapes === requirement.shapeAny;
  }
  return false;
}

function buildEnemy(enemyData) {
  ui.enemyArea.innerHTML = "";
  const enemy = document.createElement("div");
  enemy.className = `enemy ${randomColor()}`;

  const sprite = document.createElement("img");
  sprite.src = getEnemySprite();
  sprite.alt = "Nave enemiga";

  const instruction = document.createElement("div");
  instruction.className = "instruction-card";
  instruction.textContent = enemyData.text;

  enemy.append(sprite, instruction);
  ui.enemyArea.append(enemy);

  return { enemy, instruction };
}

function getEnemySprite() {
  if (WAVES[state.waveIndex]?.id === 4) {
    return "assets/jefeenemigo.png";
  }
  const sprites = [
    "assets/enemigo1.png",
    "assets/enemigo2.png",
    "assets/enemigo3.png",
    "assets/enemigo4.png",
    "assets/enemigo6.png"
  ];
  return sprites[Math.floor(Math.random() * sprites.length)];
}

function randomColor() {
  const colors = ["green", "orange", "pink"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function spawnEnemy() {
  const wave = WAVES[state.waveIndex];
  const enemyData = wave.enemies[state.enemyIndex];
  state.currentEnemy = enemyData;
  state.enemySpeed = wave.speed;
  state.enemyY = 0;
  state.attempts = 0;
  resetSelection();
  ui.workzone.classList.add("hidden");
  ui.workzone.setAttribute("aria-hidden", "true");

  const { enemy, instruction } = buildEnemy(enemyData);
  state.enemyEl = enemy;
  state.instructionEl = instruction;
  state.enemyEl.style.left = `${Math.random() * 60 + 20}%`;
  state.enemyEl.style.top = "0%";
  ui.understoodBtn.disabled = false;
  ui.understoodBtn.removeAttribute("disabled");
  playTone("alert");
  showMessage("Nuevo invasor. Lee la instruccion.");
  updateInstructionUI();
}

function updateInstructionUI() {
  ui.instructionText.textContent = state.currentEnemy.text;
  setRequirementText(state.currentEnemy.requirement);
}

function startWave() {
  state.enemyIndex = 0;
  ui.waveLabel.textContent = WAVES[state.waveIndex].id;
  spawnEnemy();
}

function tick() {
  if (state.paused || !state.currentEnemy) {
    requestAnimationFrame(tick);
    return;
  }

  state.enemyY += state.enemySpeed * 0.01;
  state.enemyEl.style.top = `${state.enemyY}%`;

  if (state.enemyY > 70) {
    state.instructionEl.classList.add("danger");
  } else {
    state.instructionEl.classList.remove("danger");
  }

  if (state.enemyY >= 80) {
    loseLife();
  }

  requestAnimationFrame(tick);
}

function loseLife() {
  state.lives -= 1;
  updateLives();
  updateCombo(false);
  showMessage("El invasor llego a la base.");
  state.enemyEl.remove();
  state.currentEnemy = null;
  ui.understoodBtn.disabled = true;

  if (state.lives <= 0) {
    showOverlay("Game Over", "Podemos intentarlo de nuevo.", [
      { label: "Reintentar Ola", action: () => restartWave() },
      { label: "Ver Logros", action: () => showSummary() }
    ]);
    return;
  }

  nextEnemy();
}

function nextEnemy() {
  const wave = WAVES[state.waveIndex];
  state.enemyIndex += 1;
  if (state.enemyIndex >= wave.enemies.length) {
    state.waveIndex += 1;
    if (state.waveIndex >= WAVES.length) {
      showSummary();
    } else {
      showOverlay(
        `Ola ${WAVES[state.waveIndex].id}`,
        "Nueva ola. Respira y lee con calma.",
        [{ label: "Continuar", action: () => startWave() }]
      );
    }
    return;
  }
  spawnEnemy();
}

function restartWave() {
  state.lives = 3;
  updateLives();
  state.combo = 0;
  updateCombo(false);
  hideOverlay();
  startWave();
}

function handleUnderstood() {
  if (!state.currentEnemy) return;
  state.paused = true;
  ui.understoodBtn.disabled = true;
  ui.workzone.classList.remove("hidden");
  ui.workzone.setAttribute("aria-hidden", "false");
  ui.feedbackBox.textContent = "Selecciona los elementos.";
  if (state.currentEnemy.requirement.type === "sequence") {
    ui.stepBtn.classList.remove("hidden");
  }
}

function handleStep() {
  if (!state.currentEnemy) return;
  const requirement = state.currentEnemy.requirement;
  if (requirement.type !== "sequence") return;
  const stepCount = requirement.steps[state.sequenceStep].count;
  const currentSelections = currentSelectionCount();
  if (currentSelections < stepCount) {
    ui.feedbackBox.textContent = "Completa el paso actual.";
    return;
  }
  state.sequenceStep += 1;
  resetSelection();
  if (state.sequenceStep >= requirement.steps.length) {
    ui.feedbackBox.textContent = "Secuencia completa. Dispara.";
    ui.stepBtn.classList.add("hidden");
  } else {
    ui.feedbackBox.textContent = `Paso ${state.sequenceStep + 1}: selecciona ${requirement.steps[state.sequenceStep].count}.`;
  }
}

function handleShoot() {
  if (!state.currentEnemy) return;
  const requirement = state.currentEnemy.requirement;
  if (requirement.type === "sequence" && state.sequenceStep < requirement.steps.length) {
    ui.feedbackBox.textContent = "Completa la secuencia antes de disparar.";
    return;
  }
  const correct = validateSelection(requirement);
  playTone(correct ? "success" : "fail");

  if (correct) {
    playTone("laser");
    fireLaser();
    state.history.push({ instruction: state.currentEnemy.text, success: true });
    updateCombo(true);
    const basePoints = state.waveIndex === 0 ? 10 : state.waveIndex === 1 ? 15 : state.waveIndex === 2 ? 20 : 50;
    let bonus = 0;
    if (state.combo === 2) bonus = 5;
    if (state.combo >= 3) bonus = 10;
    updateScore(basePoints + bonus);
    showMessage("¡Lo lograste! Gran lectura.");
    state.enemyEl.classList.add("hit");
    ui.feedbackBox.textContent = "";
    ui.workzone.classList.add("hidden");
    ui.workzone.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      state.enemyEl.remove();
      state.currentEnemy = null;
      state.paused = false;
      nextEnemy();
    }, 350);
  } else {
    state.history.push({ instruction: state.currentEnemy.text, success: false });
    updateCombo(false);
    state.attempts += 1;
    ui.feedbackBox.textContent = "Mmm, no es eso. Intenta de nuevo.";
    if (state.attempts >= 3) {
      loseLife();
    }
  }
}

function fireLaser() {
  if (!ui.battlefield || !state.enemyEl) return;
  const laser = document.createElement("div");
  laser.className = "laser";

  const battleRect = ui.battlefield.getBoundingClientRect();
  const enemyRect = state.enemyEl.getBoundingClientRect();
  const height = Math.max(40, enemyRect.top - battleRect.top);
  laser.style.setProperty("--laser-height", `${height}px`);
  laser.style.bottom = "170px";
  ui.battlefield.append(laser);

  setTimeout(() => {
    laser.remove();
  }, 380);
}

function showOverlay(title, text, actions) {
  ui.overlayTitle.textContent = title;
  ui.overlayText.textContent = text;
  ui.overlayActions.innerHTML = "";
  actions.forEach((action) => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = action.label;
    btn.addEventListener("click", () => {
      hideOverlay();
      action.action();
    });
    ui.overlayActions.append(btn);
  });
  ui.overlay.classList.remove("hidden");
  state.paused = true;
}

function hideOverlay() {
  ui.overlay.classList.add("hidden");
  state.paused = false;
}

function showSummary() {
  const total = state.history.filter((entry) => entry.success).length;
  const hard = state.history.filter((entry) => entry.success && entry.instruction.includes("INSTRUCCION MAESTRA")).length;
  const combos = Math.max(0, state.combo);
  showOverlay(
    "¡Eres un comandante legendario!",
    `Puntuacion final: ${state.score}. Enemigos derrotados: ${total}. Logros fuertes: ${hard}. Combos: ${combos}.`,
    [
      { label: "Jugar de nuevo", action: () => restartSession() },
      { label: "Ver detalles de desempeno", action: () => showDetails() }
    ]
  );
}

function showDetails() {
  const lines = state.history.slice(-10).map((entry) => `${entry.success ? "OK" : "INTENTO"}: ${entry.instruction}`);
  showOverlay("Detalles de desempeno", lines.join(" | "), [
    { label: "Volver", action: () => showSummary() }
  ]);
}

function restartSession() {
  state.waveIndex = 0;
  state.enemyIndex = 0;
  state.lives = 3;
  state.score = 0;
  state.combo = 0;
  state.history = [];
  updateLives();
  updateScore(0);
  updateCombo(false);
  hideOverlay();
  startWave();
}

function togglePause() {
  state.paused = !state.paused;
  ui.pauseBtn.textContent = state.paused ? "Reanudar" : "Pausa";
}

function setup() {
  buildElementsGrid();
  buildSlots();
  updateLives();
  updateScore(0);
  updateCombo(false);

  ui.understoodBtn.addEventListener("click", handleUnderstood);
  ui.shootBtn.addEventListener("click", handleShoot);
  ui.helpBtn.addEventListener("click", () => ui.feedbackBox.textContent = state.currentEnemy?.text || "");
  ui.stepBtn.addEventListener("click", handleStep);
  ui.startBtn.addEventListener("click", () => {
    hideOverlay();
    startWave();
  });
  ui.pauseBtn.addEventListener("click", togglePause);
  ui.soundBtn.addEventListener("click", () => {
    state.soundOn = !state.soundOn;
    ui.soundBtn.textContent = `Sonido: ${state.soundOn ? "ON" : "OFF"}`;
  });

  showOverlay(
    "Comandante de Defensa Intergalactica",
    "Lee la instruccion en voz alta. Presiona ENTIENDO. Selecciona lo pedido y dispara.",
    [{ label: "Comenzar", action: () => { hideOverlay(); startWave(); } }]
  );

  requestAnimationFrame(tick);
}

setup();
