// --- constants ---
const P_start = 0.0;
const L_start = 50;
const Speed_start = 1.0;

// --- mutable variables ---
let p = P_start;
let L = L_start;
let speed = Speed_start;
let running = true;    // pause / resume toggle

// --- initialize UI elements ---
document.getElementById("Pslider").value = P_start;
document.getElementById("Pval").textContent = P_start.toFixed(2);

document.getElementById("Lslider").value = L_start;
document.getElementById("Lval").textContent = L_start;

document.getElementById("Speedslider").value = Speed_start;
document.getElementById("Speedval").textContent = Speed_start.toFixed(1) + "×";

const canvas = document.getElementById("lattice");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let history, state, dx, dy;
let steps_remain = 0;

function initLattice() {
  history = Array.from({ length: L }, () => Array(L).fill(0));
  state   = Array(L).fill(0);
  dx = W / L;
  dy = H / L;
  // console.log("state: ", state)
  // console.log("history: ", history)
  // history[1] = history[0]
  // history[0][0] = 1
  // console.log("history: ", history)
}

// color array [black, white, yellow, green, blue]
const colors = ["#000000", "#FFFFFF", "#d7c205", "#417865", "#0379ee"];

function draw() {
  ctx.clearRect(0, 0, W, H);
  // ctx.fillRect(Math.floor(L/2) * dx, Math.floor(L/2) * dy, dx, dy);
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      // draw square from spectrum based on spin value
      ctx.fillStyle = colors[history[y][x]];
      ctx.fillRect(x * dx, y * dy, dx, dy);
    }
  }
}

function get_spin(i) {
  return history[0][(i + L) % L]
}

function update_state() {
  for (let i = 0; i < L; i++) {
    // state[i] = get_spin(i)
    // if (get_spin(i-1) == get_spin(i+1)) state[i] = get_spin(i-1)
    let spin = get_spin(i)
    if (spin == 2) { // panic region
      if (get_spin(i-1) == 0) spin = 0;
      if (get_spin(i+1) == 1) spin = 1;
      // console.log("In `spin==2` with spin[i-1]=", get_spin(i-1), " and spin[i+1]=", get_spin(i+1))
      // console.log("now spin=", spin)
    }
    else if (spin == 3) { // slow-moving wall
      if (get_spin(i-1)==0) spin = 0
      else if (get_spin(i+1)==1) spin = 1
      else spin = 2
    }
    else if (spin == 0) {
      let left = get_spin(i-1);
      if (left == 1 || left == 2) spin = 3
    }
    else if (spin == 1) {
      let right = get_spin(i+1);
      if (right == 0 || right == 2) spin = 3
    }
    state[i] = spin

    // randomize
    if (Math.random() < p) state[i] = Math.floor(Math.random() * 4)
  }
}

function update_history() {
  // probably a parallel way to do this
  for (let i = L-1; i > 0; i--) {
    for (let j = 0; j < L; j++) {
      history[i][j] = history[i-1][j]
    }
  }
  for (let j = 0; j < L; j++) {
    history[0][j] = state[j]
  }
}

function step() {
  // console.log("get_spin(0): ", get_spin(0))
  // console.log("history: ", history)
  // console.log("state: ", state)
  update_state()
  update_history()
}

function loop() {
  if (running) {
    steps_remain += speed
    while (steps_remain > 1) {
      step();
      steps_remain --;
    }
    draw();
    // const e = totalEnergy();
    // document.getElementById("Edisp").textContent = e.toFixed(3);
  }
  requestAnimationFrame(loop);
}

// UI controls
document.getElementById("Pslider").addEventListener("input", e => {
  p = parseFloat(e.target.value);
  document.getElementById("Pval").textContent = p.toFixed(2);
});

document.getElementById("Lslider").addEventListener("input", e => {
  L = parseInt(e.target.value);
  document.getElementById("Lval").textContent = L;
  initLattice();
});

document.getElementById("Speedslider").addEventListener("input", e => {
  speed = parseFloat(e.target.value);
  document.getElementById("Speedval").textContent = speed.toFixed(1) + "×";
});

document.getElementById("toggleBtn").addEventListener("click", () => {
  running = !running;
  document.getElementById("toggleBtn").textContent = running ? "⏸️ Pause" : "▶️ Resume";
});

document.getElementById("stepBtn").addEventListener("click", () => {
  step();
  draw();
});

document.getElementById("flipBtn").addEventListener("click", () => {
  for (let i = Math.floor(L/4); i < L/2; i++) state[i] = 1;
  for (let i = Math.floor(L/2); i < 3*L/4; i++) state[i] = 0;
  update_history();
  draw();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  for (let i = 0; i < L; i++) state[i] = 0;
  update_history();
  draw();
});

document.getElementById("yellowBtn").addEventListener("click", () => {
  for (let i = 0; i < L; i++) state[i] = 2;
  update_history();
  draw();
});

// Initialize
initLattice();
draw();
loop();
