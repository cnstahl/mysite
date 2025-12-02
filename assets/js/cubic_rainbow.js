// --- constants ---
const h_start = 0;
const f_start = 0;
const L_start = 10;
const Speed_start = 1.0;

// --- mutable variables ---
let h = h_start;
let F = f_start;
let L = L_start;
let speed = Speed_start;
let running = true;    // pause / resume toggle
let m = 3;             // number of nontrivial colors

// --- initialize UI elements ---
document.getElementById("hslider").value = h_start;
document.getElementById("hval").textContent = h_start.toFixed(2);

document.getElementById("fslider").value = f_start;
document.getElementById("fval").textContent = f_start.toFixed(2);

document.getElementById("Lslider").value = L_start;
document.getElementById("Lval").textContent = L_start;

document.getElementById("Speedslider").value = Speed_start;
document.getElementById("Speedval").textContent = Speed_start.toFixed(1) + "×";

const canvas = document.getElementById("lattice");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let dx, dy;

// color array [black, red, green, blue]
const colors = ["#000000", "#a8003b", "#417865", "#0379ee"];

// getters and setters for spins
function getSpin(x, y, z, dir) {
  x = (x + L) % L;
  y = (y + L) % L;
  z = (z + L) % L;
  return spins[dir * L * L * L + z * L * L + y * L + x];
}

function setSpin(x, y, z, dir, value) {
  x = (x + L) % L;
  y = (y + L) % L;
  z = (z + L) % L;
  spins[dir * L * L * L + z * L * L + y * L + x] = value;
}

// now do a 3d lattice with cubic rainbow colors
function initLattice() {
  spins = new Uint8Array(L * L * L * 3); // reset spins
  dx = W / L;
  dy = H / L;
}

function initRed() {
  for (let z = 0; z < L; z++) {
    for (let y = 0; y < L; y++) {
      for (let x = 0; x < L; x++) {
        setSpin(x, y, z, 0, 1); // set all x-spins to red
        setSpin(x, y, z, 1, 1);
        setSpin(x, y, z, 2, 1);
      }
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = "#000";
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      // top horizontal edge
      ctx.lineWidth = getSpin(x, y, 0, 1) ? 3 : 1;
      ctx.strokeStyle = colors[getSpin(x, y, 0, 1)];
      ctx.beginPath();
      ctx.moveTo(x * dx, y * dy);
      ctx.lineTo((x + 1) * dx, y * dy);
      ctx.stroke();

      // left vertical edge
      ctx.lineWidth = getSpin(x, y, 0, 0) ? 3 : 1;
      ctx.strokeStyle = colors[getSpin(x, y, 0, 0)];
      ctx.beginPath();
      ctx.moveTo(x * dx, y * dy);
      ctx.lineTo(x * dx, (y + 1) * dy);
      ctx.stroke();
    }
  }
}

function is_flippable(x, y, z) {
  let i = 0;
  let nontrivial_spins = 0;

  a = getSpin(x, y, z, 0);
  b = getSpin(x + 1, y, z, 0);
  c = getSpin(x, y, z, 1);
  d = getSpin(x, y + 1, z, 1);
  e = getSpin(x, y, z, 2);
  f = getSpin(x, y, z + 1, 2);

  for (const spin of [a, b, c, d, e, f]) {
    if (spin !== 0) {
      nontrivial_spins += 1;
      if (i === 0) i = spin;
      else if (spin !== i) return false;  // different nontrivial spins
    }
  }
  return true;
}

function glauber_six() {
  const x = Math.floor(Math.random() * L);
  const y = Math.floor(Math.random() * L);
  const z = Math.floor(Math.random() * L);
  let i = 0;
  let spins_before = 0;

  let old_a = getSpin(x, y, z, 0);
  let old_b = getSpin(x + 1, y, z, 0);
  let old_c = getSpin(x, y, z, 1);
  let old_d = getSpin(x, y + 1, z, 1);
  let old_e = getSpin(x, y, z, 2);
  let old_f = getSpin(x, y, z + 1, 2); 
  for (const spin of [old_a, old_b, old_c, old_d, old_e, old_f]) {
    if (spin !== 0) {
      spins_before += 1;
      if (i === 0) i = spin;
      else if (spin !== i) return;  // different nontrivial spins
    }
  }

  // if all spins match, then set to random color
  if (old_a == old_b && old_b == old_c && old_c == old_d && old_d == old_e && old_e == old_f) {
    i = old_a + ((old_a + Math.floor(Math.random() * m) + 1) % (m+1));  // i might be out of range but we set to i-spins, not i
    // i = old_a + ((old_a + Math.floor(Math.random() * (m+1))) % (m+1));  // i might be out of range but we set to i-spins, not i
  }

  let flips_before = is_flippable(x+1, y, z) + is_flippable(x, y+1, z) + is_flippable(x, y, z+1) +
                      is_flippable(x-1, y, z) + is_flippable(x, y-1, z) + is_flippable(x, y, z-1);

  // tentatively set new spins
  setSpin(x, y, z, 0, i-old_a);
  setSpin(x + 1, y, z, 0, i-old_b);
  setSpin(x, y, z, 1, i-old_c);
  setSpin(x, y + 1, z, 1, i-old_d);
  setSpin(x, y, z, 2, i-old_e);
  setSpin(x, y, z + 1, 2, i-old_f);

  let spins_after = ((i-old_a) !== 0) + ((i-old_b) !== 0) + ((i-old_c) !== 0) + ((i-old_d) !== 0) + ((i-old_e) !== 0) + ((i-old_f) !== 0);
  let flips_after = is_flippable(x+1, y, z) + is_flippable(x, y+1, z) + is_flippable(x, y, z+1) +
                     is_flippable(x-1, y, z) + is_flippable(x, y-1, z) + is_flippable(x, y, z-1);

  let dE = h * (spins_after - spins_before) + F * (flips_after - flips_before);

  // console.log(`a ${old_a} -> ${i-old_a}, b ${old_b} -> ${i-old_b}, c ${old_c} -> ${i-old_c}, d ${old_d} -> ${i-old_d}, e ${old_e} -> ${i-old_e}, f ${old_f} -> ${i-old_f}`);
  // console.log(`flip ${flips_before} -> ${flips_after}, spins ${spins_before} -> ${spins_after}, dE = ${dE}, prob = ${1.0/(1.0+Math.exp(dE))}`);

  // revert if not accepted
  if (Math.random() > 1.0/(1.0+Math.exp(dE))) {
    setSpin(x, y, z, 0, old_a);
    setSpin(x + 1, y, z, 0, old_b);
    setSpin(x, y, z, 1, old_c);
    setSpin(x, y + 1, z, 1, old_d);
    setSpin(x, y, z, 2, old_e);
    setSpin(x, y, z + 1, 2, old_f);
  }

}

function step() {
  const updates = Math.floor(speed * L * L);
  for (let n = 0; n < updates; n++) {
    glauber_six();
  }
}

const small_canvas = document.getElementById("colorChart");
const small_ctx = small_canvas.getContext("2d");

// Keep a short history
const maxPoints = 100;  // how many time steps to show
const history = {
  red:   [],
  green: [],
  blue:  []
};

function updateLineChart() {
  let spins = [0 , 0, 0, 0]; // red, green, blue counts

  for (let z = 0; z < L; z++) {
    for (let y = 0; y < L; y++) {
      for (let x = 0; x < L; x++) {
        spins[getSpin(x, y, z, 0)] += 1;
        spins[getSpin(x, y, z, 1)] += 1;
        spins[getSpin(x, y, z, 2)] += 1;
      }
    }
  }

  // print values to console
  // console.log(`Red: ${spins[1]}, Green: ${spins[2]}, Blue: ${spins[3]}`);

  // push new values
  history.red.push(spins[1]);
  history.green.push(spins[2]);
  history.blue.push(spins[3]);
  // trim to maxPoints
  if (history.red.length > maxPoints) {
    history.red.shift();
    history.green.shift();
    history.blue.shift();
  }

  drawChart();
}

function drawChart() {
  const w = small_canvas.width;
  const h = small_canvas.height;

  small_ctx.clearRect(0, 0, w, h);

  const padding = 20;
  const innerW = w - 2 * padding;
  const innerH = h - 2 * padding;

  // find max value in history for scaling
  let maxVal = L * L * L * 3;
  // let maxVal = 1;
  // for (const arr of [history.red, history.green, history.blue]) {
  //   for (const v of arr) {
  //     if (v > maxVal) maxVal = v;
  //   }
  // }

  // axes
  small_ctx.strokeStyle = "#000";
  small_ctx.lineWidth = 1;
  small_ctx.beginPath();
  small_ctx.moveTo(padding, padding);
  small_ctx.lineTo(padding, padding + innerH);
  small_ctx.lineTo(padding + innerW, padding + innerH);
  small_ctx.stroke();

  // helper to draw one colored line
  function drawSeries(arr, color) {
    if (arr.length < 2) return;

    small_ctx.strokeStyle = color;
    small_ctx.lineWidth = 2;
    small_ctx.beginPath();

    arr.forEach((v, i) => {
      const x = padding + (i / (maxPoints - 1)) * innerW;
      const y = padding + innerH - (v / maxVal) * innerH;
      if (i === 0) small_ctx.moveTo(x, y);
      else small_ctx.lineTo(x, y);
    });

    small_ctx.stroke();
  }

  drawSeries(history.red,   colors[1]);
  drawSeries(history.green, colors[2]);
  drawSeries(history.blue,  colors[3]);
}


function loop() {
  if (running) {
    step();
    draw();
    // const e = totalEnergy();
    // document.getElementById("Edisp").textContent = e.toFixed(3);
    updateLineChart();
  }
  requestAnimationFrame(loop);
}

// UI controls
document.getElementById("hslider").addEventListener("input", e => {
  h = parseFloat(e.target.value);
  document.getElementById("hval").textContent = h.toFixed(2);
});

document.getElementById("fslider").addEventListener("input", e => {
  F = parseFloat(e.target.value);
  document.getElementById("fval").textContent = F.toFixed(2);
});

document.getElementById("Lslider").addEventListener("input", e => {
  L = parseInt(e.target.value);
  if (L > 100) colors[0] = "#ffffff"; // change background to white for large L
  else colors[0] = "#000000";
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

// reset button
document.getElementById("resetBtn").addEventListener("click", () => {
  initLattice();
  draw();
});

// all red button
document.getElementById("allRed").addEventListener("click", () => {
  initRed();
  draw();
});

// Initialize
initLattice();
draw();
loop();
