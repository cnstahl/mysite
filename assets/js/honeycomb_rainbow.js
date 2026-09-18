// --- constants ---
const L_start = 50;
const h_start = 0;
const p_start = 0;
const f_start = 0;
const Speed_start = 1.0;

// --- mutable variables ---
let L = L_start;
let h = h_start;
let p = p_start;
let f = f_start;
let speed = Speed_start;
let running = true;    // pause / resume toggle
let m = 3;             // number of nontrivial colors
let counter = 0;

// --- initialize UI elements ---
document.getElementById("Lslider").value = L_start;
document.getElementById("Lval").textContent = L_start;

document.getElementById("hslider").value = h_start;
document.getElementById("hval").textContent = h_start.toFixed(2);

document.getElementById("pslider").value = p_start;
document.getElementById("pval").textContent = p_start.toFixed(2);

document.getElementById("fslider").value = f_start;
document.getElementById("fval").textContent = f_start.toFixed(2);

document.getElementById("Speedslider").value = Speed_start;
document.getElementById("Speedval").textContent = Speed_start.toFixed(1) + "×";

const canvas = document.getElementById("lattice");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let dx, dy, s, hex_table, flip_table;

// color array [black, red, green, blue]
const colors = ["#000000", "#a8003b", "#417865", "#0379ee"];

///////////////////////////////////////////////////////////////
//
//  Honeycomb lattice, two sites (A, B) per unit cell.
//  Three bonds per cell, labelled by the A site they leave:
//
//        B(x,y)          dir 0: A(x,y) -- B(x,y)        (up)
//          |             dir 1: A(x,y) -- B(x,y-1)      (down-left)
//          |0            dir 2: A(x,y) -- B(x+1,y-1)    (down-right)
//          |
//        A(x,y)
//        /   \
//      1/     \2
//      /       \
//  B(x,y-1)   B(x+1,y-1)
//
//  Hexagon (x,y) is bounded by six edges, in cyclic order:
//    e0 = (x,   y,   0)   left vertical
//    e1 = (x,   y+1, 1)   upper-left
//    e2 = (x,   y+1, 2)   upper-right
//    e3 = (x+1, y,   0)   right vertical
//    e4 = (x+1, y,   1)   lower-right
//    e5 = (x,   y,   2)   lower-left
//
//  Its six neighbouring hexagons are the triangular-lattice offsets
//  (-1,0) (-1,1) (0,1) (1,0) (1,-1) (0,-1).
//
///////////////////////////////////////////////////////////////

function initLattice() {
  spins = Array(3*L*L).fill(0);
  dx = W / L;               // cell width = sqrt(3) * bond length
  s = dx / Math.sqrt(3);    // bond length
  dy = 1.5 * s;             // vertical period per y step
}

// getters and setters for the three bond directions
function index_from_coords(x, y, dir) {
  return ((x+L) % L)*L*3 + ((y+L) % L)*3 + dir
}

function get_spin(x, y, dir) {
  return spins[index_from_coords(x, y, dir)];
}

function set_spin(x, y, dir, value) {
  spins[index_from_coords(x, y, dir)] = value;
}

// the three ways two parallel zigzag strands can bracket a hexagon,
// as [strand1a, strand1b, strand2a, strand2b, empty1, empty2]
const patterns = [[1,2,4,5,0,3], [0,1,3,4,2,5], [5,0,2,3,1,4]];

function initTable() {
  hex_table = new Uint8Array(Math.pow(m+1, 6));
  flip_table = new Uint8Array(Math.pow(m+1, 6));
  const e = [0, 0, 0, 0, 0, 0];
  for (e[0] = 0; e[0] <= m; e[0]++) {
    for (e[1] = 0; e[1] <= m; e[1]++) {
      for (e[2] = 0; e[2] <= m; e[2]++) {
        for (e[3] = 0; e[3] <= m; e[3]++) {
          for (e[4] = 0; e[4] <= m; e[4]++) {
            for (e[5] = 0; e[5] <= m; e[5]++) {
              const idx = table_index(e[0], e[1], e[2], e[3], e[4], e[5]);
              
              for (const [a, b, c, d, u, v] of patterns) {
                if (e[u] == 0 && e[v] == 0 &&
                    e[a] > 0 && e[a] == e[b] &&
                    e[c] > 0 && e[c] == e[d] &&
                    e[a] != e[c]) {
                  hex_table[idx] = 1;
                }
              }
              // flippable if at most one nontrivial color is present
              let color = 0;
              flip_table[idx] = 1;
              for (const spin of e) {
                if (spin !== 0) {
                  if (color === 0) color = spin;
                  else if (spin !== color) flip_table[idx] = 0;
                }
              }
            }
          }
        }
      }
    }
  }
}

function table_index(e0, e1, e2, e3, e4, e5) {
  return e0 + (m+1)*(e1 + (m+1)*(e2 + (m+1)*(e3 + (m+1)*(e4 + (m+1)*e5))));
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      // A site position, with the rhombic cell folded back into the canvas
      const px = ((((x + y/2) % L) + L) % L) * dx;
      const py = y * dy;

      // up bond
      ctx.lineWidth = get_spin(x, y, 0) ? 3 : 1;
      ctx.strokeStyle = colors[get_spin(x, y, 0)];
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, py + s);
      ctx.stroke();

      // down-left bond
      ctx.lineWidth = get_spin(x, y, 1) ? 3 : 1;
      ctx.strokeStyle = colors[get_spin(x, y, 1)];
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - dx/2, py - s/2);
      ctx.stroke();

      // down-right bond
      ctx.lineWidth = get_spin(x, y, 2) ? 3 : 1;
      ctx.strokeStyle = colors[get_spin(x, y, 2)];
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + dx/2, py - s/2);
      ctx.stroke();
    }
  }
}

// packs the six spins around a hexagon into a lookup index for hex_table / flip_table
function hex_index(x, y) {
  return table_index(
    get_spin(x,   y,   0),
    get_spin(x,   y+1, 1),
    get_spin(x,   y+1, 2),
    get_spin(x+1, y,   0),
    get_spin(x+1, y,   1),
    get_spin(x,   y,   2)
  );
}

function total_alignment() {
  let total = 0;
  for (let x = 0; x < L; x++) {
    for (let y = 0; y < L; y++) {
      total += hex_table[hex_index(x, y)];
    }
  }
  return total;
}

function total_flippability() {
  let total = 0;
  for (let x = 0; x < L; x++) {
    for (let y = 0; y < L; y++) {
      total += flip_table[hex_index(x, y)];
    }
  }
  return total;
}

// what one hexagon contributes to the alignment and flippability terms
function hex_energy(x, y) {
  const idx = hex_index(x, y);
  return -p * hex_table[idx] - f * flip_table[idx];
}

// the six hexagons neighbouring hexagon (x,y) are the only ones a flip can affect
function neighbor_energy(x, y) {
  return hex_energy(x-1, y) + hex_energy(x-1, y+1) + hex_energy(x, y+1) +
         hex_energy(x+1, y) + hex_energy(x+1, y-1) + hex_energy(x, y-1);
}

function glauber_six() {
  const x = Math.floor(Math.random() * L);
  const y = Math.floor(Math.random() * L);
  let i = 0;

  let old_0 = get_spin(x,   y,   0);
  let old_1 = get_spin(x,   y+1, 1);
  let old_2 = get_spin(x,   y+1, 2);
  let old_3 = get_spin(x+1, y,   0);
  let old_4 = get_spin(x+1, y,   1);
  let old_5 = get_spin(x,   y,   2);

  for (const spin of [old_0, old_1, old_2, old_3, old_4, old_5]) {
    if (spin !== 0) {
      if (i === 0) i = spin;
      else if (spin !== i) return;  // different nontrivial spins
    }
  }

  // if all spins match, then set to random color
  if (old_0 == old_1 && old_1 == old_2 && old_2 == old_3 && old_3 == old_4 && old_4 == old_5) {
    i = old_0 + ((old_0 + Math.floor(Math.random() * (m+1))) % (m+1));  // i might be out of range but we set to i-spins, not i
  }

  let tot_h_before = (old_0 > 0) + (old_1 > 0) + (old_2 > 0) + (old_3 > 0) + (old_4 > 0) + (old_5 > 0);
  let E_before = neighbor_energy(x, y);

  let new_0 = i-old_0;
  let new_1 = i-old_1;
  let new_2 = i-old_2;
  let new_3 = i-old_3;
  let new_4 = i-old_4;
  let new_5 = i-old_5;

  // tentatively flip the spins
  set_spin(x,   y,   0, new_0);
  set_spin(x,   y+1, 1, new_1);
  set_spin(x,   y+1, 2, new_2);
  set_spin(x+1, y,   0, new_3);
  set_spin(x+1, y,   1, new_4);
  set_spin(x,   y,   2, new_5);

  let tot_h_after = (new_0 > 0) + (new_1 > 0) + (new_2 > 0) + (new_3 > 0) + (new_4 > 0) + (new_5 > 0);
  let E_after = neighbor_energy(x, y);

  let dE = h * (tot_h_after - tot_h_before) + (E_after - E_before);

  if (Math.random() > 1.0/(1.0+Math.exp(dE))) {
    // reject the flip, restore old spins
    set_spin(x,   y,   0, old_0);
    set_spin(x,   y+1, 1, old_1);
    set_spin(x,   y+1, 2, old_2);
    set_spin(x+1, y,   0, old_3);
    set_spin(x+1, y,   1, old_4);
    set_spin(x,   y,   2, old_5);
  }

}

function step() {
  const updates = Math.floor(speed * L * L);
  for (let n = 0; n < updates; n++) {
    glauber_six();
  }

  // console.log("step " + String(counter++), "alignment", total_alignment());
}

function loop() {
  if (running) {
    step();
    draw();
  }
  requestAnimationFrame(loop);
}

// UI controls
document.getElementById("Lslider").addEventListener("input", e => {
  L = parseInt(e.target.value);
  if (L > 100) colors[0] = "transparent"; // change background to clear for large L
  else colors[0] = "#000000";
  document.getElementById("Lval").textContent = L;
  initLattice();
});

document.getElementById("hslider").addEventListener("input", e => {
  h = parseFloat(e.target.value);
  document.getElementById("hval").textContent = h.toFixed(2);
});

document.getElementById("pslider").addEventListener("input", e => {
  p = parseFloat(e.target.value);
  document.getElementById("pval").textContent = p.toFixed(2);
});

document.getElementById("fslider").addEventListener("input", e => {
  f = parseFloat(e.target.value);
  document.getElementById("fval").textContent = f.toFixed(2);
});

document.getElementById("Speedslider").addEventListener("input", e => {
  speed = parseFloat(e.target.value);
  document.getElementById("Speedval").textContent = speed.toFixed(1) + "×";
});

document.getElementById("toggleBtn").addEventListener("click", () => {
  running = !running;
  document.getElementById("toggleBtn").textContent = running ? "⏸️ Pause" : "▶️ Resume";
});

document.getElementById("resetBtn").addEventListener("click", () => {
  counter = 0;
  initLattice();
  draw();
});

document.getElementById("insertLine").addEventListener("click", () => {
  initLattice();
  // insert a closed horizontal zigzag of spins
  const y = Math.floor(Math.random() * L);
  const spin_value = Math.floor(Math.random() * m) + 1;
  for (let x = 0; x < L; x++) {
    set_spin(x, y, 1, spin_value);
    set_spin(x, y, 2, spin_value);
  }
  draw();
});

// Initialize
initLattice();
initTable();
draw();
loop();
