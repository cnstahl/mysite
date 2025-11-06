// --- constants ---
const T_start = 1.5;
const L_start = 50;
const Speed_start = 1.0;

// --- mutable variables ---
let T = T_start;
let L = L_start;
let speed = Speed_start;
let running = true;    // pause / resume toggle

// --- initialize UI elements ---
document.getElementById("Tslider").value = T_start;
document.getElementById("Tval").textContent = T_start.toFixed(1);

document.getElementById("Lslider").value = L_start;
document.getElementById("Lval").textContent = L_start;

document.getElementById("Speedslider").value = Speed_start;
document.getElementById("Speedval").textContent = Speed_start.toFixed(1) + "×";

const canvas = document.getElementById("lattice");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let horiz, vert, dx, dy;

function initLattice() {
  horiz = Array.from({ length: L }, () => Array(L).fill(0));
  vert  = Array.from({ length: L }, () => Array(L).fill(0));
  dx = W / L;
  dy = H / L;
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = "#000";
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      // top horizontal edge
      ctx.lineWidth = horiz[y][x] ? 3 : 1;
      ctx.beginPath();
      ctx.moveTo(x * dx, y * dy);
      ctx.lineTo((x + 1) * dx, y * dy);
      ctx.stroke();

      // left vertical edge
      ctx.lineWidth = vert[x][y] ? 3 : 1;
      ctx.beginPath();
      ctx.moveTo(x * dx, y * dy);
      ctx.lineTo(x * dx, (y + 1) * dy);
      ctx.stroke();
    }
  }
}

function totalEnergy() {
  let E = 0;
  for (let y = 0; y < L; y++)
    for (let x = 0; x < L; x++) E += horiz[y][x] + vert[x][y];
  const totalEdges = 2 * L * L;
  return E / totalEdges;
}

function step() {
  const updates = Math.floor(speed * L * L);
  for (let n = 0; n < updates; n++) {
    const px = Math.floor(Math.random() * L);
    const py = Math.floor(Math.random() * L);
    const xp = (px + 1) % L;
    const yp = (py + 1) % L;

    const edges = [
      horiz[py][px],
      horiz[yp][px],
      vert[px][py],
      vert[xp][py]
    ];

    let dE = 0;
    for (const e of edges) dE += (e === 0 ? +1 : -1);

    if (Math.random() < Math.exp(-dE / T)) {
      horiz[py][px] ^= 1;
      horiz[yp][px] ^= 1;
      vert[px][py] ^= 1;
      vert[xp][py] ^= 1;
    }
  }
}

function loop() {
  if (running) {
    step();
    draw();
    // const e = totalEnergy();
    // document.getElementById("Edisp").textContent = e.toFixed(3);
  }
  requestAnimationFrame(loop);
}

// UI controls
document.getElementById("Tslider").addEventListener("input", e => {
  T = parseFloat(e.target.value);
  document.getElementById("Tval").textContent = T.toFixed(1);
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

// Initialize
initLattice();
draw();
loop();
