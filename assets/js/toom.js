// --- constants ---
const T_start = .14;
const L_start = 100;
const Speed_start = 1.0;

// --- mutable variables ---
let T = T_start;
let L = L_start;
let speed = Speed_start;
let running = true;    // pause / resume toggle

// --- initialize UI elements ---
document.getElementById("Tslider").value = T_start;
document.getElementById("Tval").textContent = T_start.toFixed(2);

document.getElementById("Lslider").value = L_start;
document.getElementById("Lval").textContent = L_start;

document.getElementById("Speedslider").value = Speed_start;
document.getElementById("Speedval").textContent = Speed_start.toFixed(1) + "×";

const canvas = document.getElementById("lattice");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let spin, dx, dy;

function initLattice() {
  spin = Array.from({ length: L }, () => Array.from({ length: L }, () => (Math.random() < 0.5 ? 1 : -1)));
  dx = W / L;
  dy = H / L;
}

function draw() {
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      ctx.fillStyle = spin[y][x] === 1 ? "#000000" : "#ffffff";
      ctx.fillRect(x * dx, y * dy, dx, dy);
    }
  }
}

function step() {
  const updates = Math.floor(speed * L * L);
  for (let n = 0; n < updates; n++) {
    const x = Math.floor(Math.random() * L);
    const y = Math.floor(Math.random() * L);

    if (Math.random() < T) {
      spin[y][x] *= -1;  // flip spin with probability p = T
    }

    else {
      const xp = (x +1) % L;
      const ym = (y - 1 + L) % L;
      spin[y][x] = (spin[y][x] + spin[ym][x] + spin[y][xp]) >= 0 ? 1 : -1;  // Toom's rule
    }

    
  }
}

function loop() {
  if (running) {
    step();
    draw();
    // const m = totalMagnetization();
    // document.getElementById("Edisp").textContent = m.toFixed(3);
  }
  requestAnimationFrame(loop);
}

// UI controls
document.getElementById("Tslider").addEventListener("input", e => {
  T = parseFloat(e.target.value);
  document.getElementById("Tval").textContent = T.toFixed(2);
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

// flip a circle of spins around the center
document.getElementById("flipBtn").addEventListener("click", () => {
  const radius = Math.floor(L / 4);
  const centerX = Math.floor(L / 2);
  const centerY = Math.floor(L / 2);

  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      if ((x - centerX) ** 2 + (y - centerY) ** 2 <= radius ** 2) {
        spin[y][x] *= -1;
      }
    }
  }
});

document.getElementById("resetBtn").addEventListener("click", () => {
  spin = Array.from({ length: L }, () => Array.from({ length: L }, () => -1));
  draw();
});

// Initialize
initLattice();
draw();
loop();
