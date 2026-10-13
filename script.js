
"use strict";


const $ = (id) => document.getElementById(id);


function compileFunction(expression) {
  let source = expression.trim();

  if (!source) {
    throw new Error("Please enter a mathematical function.");
  }

  source = source.replace(/\^/g, "**");

  const functions = [
    "sin", "cos", "tan", "sqrt",
    "abs", "log", "exp", "floor", "ceil"
  ];

  for (const name of functions) {
    const pattern = new RegExp("\\b" + name + "\\s*\\(", "g");
    source = source.replace(pattern, "Math." + name + "(");
  }

  const checked = source.replace(
    /Math\.(sin|cos|tan|sqrt|abs|log|exp|floor|ceil)/g,
    ""
  );

  if (!/^[0-9xX+\-*/().\s]*$/.test(checked)) {
    throw new Error(
      "Unsupported expression. Try x^2 - 4, sin(x), sqrt(x), or log(x)."
    );
  }

  let evaluator;

  try {
    evaluator = new Function(
      "x",
      '"use strict"; return (' + source + ");"
    );
  } catch (error) {
    throw new Error(
      "Invalid function. Check your brackets and operators."
    );
  }

  return function (x) {
    const result = evaluator(x);
    return typeof result === "number" ? result : NaN;
  };
}

function drawGraph() {
  const canvas = $("graph");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#071525";
  ctx.fillRect(0, 0, width, height);

  const xmin = Number($("xmin").value);
  const xmax = Number($("xmax").value);

  if (
    !Number.isFinite(xmin) ||
    !Number.isFinite(xmax) ||
    xmin >= xmax
  ) {
    $("graphStatus").textContent =
      "Enter a valid range: maximum x must be greater than minimum x.";
    return;
  }

  let f;

  try {
    f = compileFunction($("func").value);
  } catch (error) {
    $("graphStatus").textContent = error.message;
    return;
  }

  const points = [];
  const count = 700;
  let ymin = Infinity;
  let ymax = -Infinity;

  for (let i = 0; i <= count; i++) {
    const x = xmin + (xmax - xmin) * i / count;
    let y;

    try {
      y = f(x);
    } catch (error) {
      y = NaN;
    }

    if (Number.isFinite(y) && Math.abs(y) < 1e7) {
      points.push({ x, y });
      ymin = Math.min(ymin, y);
      ymax = Math.max(ymax, y);
    } else {
      points.push({ x, y: NaN });
    }
  }

  if (!Number.isFinite(ymin)) {
    $("graphStatus").textContent =
      "No valid function values were found in this range.";
    return;
  }

  if (ymin === ymax) {
    ymin -= 1;
    ymax += 1;
  }

  const padding = (ymax - ymin) * 0.12;
  ymin -= padding;
  ymax += padding;

  const px = x => (x - xmin) / (xmax - xmin) * width;
  const py = y => height - (y - ymin) / (ymax - ymin) * height;

  ctx.strokeStyle = "#1b3650";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 10; i++) {
    const x = i * width / 10;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let i = 0; i <= 8; i++) {
    const y = i * height / 8;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#66819e";
  ctx.lineWidth = 1.5;

  if (xmin <= 0 && xmax >= 0) {
    ctx.beginPath();
    ctx.moveTo(px(0), 0);
    ctx.lineTo(px(0), height);
    ctx.stroke();
  }

  if (ymin <= 0 && ymax >= 0) {
    ctx.beginPath();
    ctx.moveTo(0, py(0));
    ctx.lineTo(width, py(0));
    ctx.stroke();
  }

  ctx.strokeStyle = "#55e6e0";
  ctx.lineWidth = 3;
  ctx.beginPath();

  let drawing = false;
  let previousY = null;

  for (const point of points) {
    if (!Number.isFinite(point.y)) {
      drawing = false;
      previousY = null;
      continue;
    }

    const y = py(point.y);

    if (previousY !== null && Math.abs(y - previousY) > height * 0.6) {
      drawing = false;
    }

    if (!drawing) {
      ctx.moveTo(px(point.x), y);
      drawing = true;
    } else {
      ctx.lineTo(px(point.x), y);
    }

    previousY = y;
  }

  ctx.stroke();

  const a = Number($("atX").value);
  const h = 0.001;

  if (Number.isFinite(a) && a >= xmin && a <= xmax) {
    const fa = f(a);
    const fp = f(a + h);
    const fm = f(a - h);
    const slope = (fp - fm) / (2 * h);

    if ([fa, slope].every(Number.isFinite)) {
      const span = (xmax - xmin) * 0.18;
      const x1 = Math.max(xmin, a - span);
      const x2 = Math.min(xmax, a + span);
      const y1 = fa + slope * (x1 - a);
      const y2 = fa + slope * (x2 - a);

      ctx.save();
      ctx.strokeStyle = "#ff8fbc";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.moveTo(px(x1), py(y1));
      ctx.lineTo(px(x2), py(y2));
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "#ff8fbc";
      ctx.beginPath();
      ctx.arc(px(a), py(fa), 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = "#a9bdd4";
  ctx.font = "14px system-ui";
  ctx.fillText("x = " + xmin, 8, height - 10);
  ctx.fillText("x = " + xmax, width - 90, height - 10);

  $("graphStatus").textContent =
    "Function plotted successfully. Cyan = function curve; pink dashed = tangent at a = " +
    $("atX").value + ".";
}

$("plotBtn").addEventListener("click", drawGraph);

function exactDerivative(expression, x) {
  const source = expression.replace(/\s+/g, "");

  if (/^[+-]?\d+(\.\d+)?$/.test(source)) {
    return 0;
  }

  const monomial = source.match(
    /^([+-]?(?:\d+(?:\.\d+)?)?)\*?x(?:\^([+-]?\d+(?:\.\d+)?))?$/
  );

  if (monomial) {
    let coefficient = monomial[1];
    const power = monomial[2] === undefined ? 1 : Number(monomial[2]);

    if (coefficient === "" || coefficient === "+") {
      coefficient = 1;
    } else if (coefficient === "-") {
      coefficient = -1;
    } else {
      coefficient = Number(coefficient);
    }

    if (power === 0) return 0;

    return coefficient * power * Math.pow(x, power - 1);
  }

  if (source === "sin(x)") return Math.cos(x);
  if (source === "cos(x)") return -Math.sin(x);
  if (source === "tan(x)") return 1 / Math.cos(x) ** 2;
  if (source === "exp(x)") return Math.exp(x);

  if (source === "log(x)" && x > 0) {
    return 1 / x;
  }

  if (source === "sqrt(x)" && x > 0) {
    return 1 / (2 * Math.sqrt(x));
  }

  if (source === "abs(x)" && x !== 0) {
    return x > 0 ? 1 : -1;
  }

  return null;
}

function calculateDerivative() {
  const output = $("derivResult");
  const exactOutput = $("exactResult");
  const table = $("slopeRows");

  try {
    const expression = $("derivFunc").value;
    const f = compileFunction(expression);
    const a = Number($("atX").value);
    const h = Number($("stepH").value);

    if (!Number.isFinite(a) || !Number.isFinite(h) || h <= 0) {
      throw new Error("Enter a valid point a and a positive step size h.");
    }

    const fa = f(a);
    const forward = f(a + h);
    const backward = f(a - h);

    if (![fa, forward, backward].every(Number.isFinite)) {
      throw new Error("The function is not defined near this point.");
    }

    const derivative = (forward - backward) / (2 * h);

    output.innerHTML =
      '<div class="small">Estimated derivative at x = ' + a + '</div>' +
      '<div class="metric">f′(' + a + ') ≈ ' +
      derivative.toFixed(6) + '</div>' +
      '<div class="small">Function value f(' + a + ') = ' +
      fa.toFixed(6) + '</div>';

    const exact = exactDerivative(expression, a);

    if (exact !== null && Number.isFinite(exact)) {
      exactOutput.innerHTML =
        '<div class="small">Exact derivative reference</div>' +
        '<div class="metric">f′(' + a + ') = ' +
        exact.toFixed(6) + '</div>';
    } else {
      exactOutput.innerHTML =
        '<span class="small">Exact derivative is not available for this expression. Numerical estimates are still calculated below.</span>';
    }

    const stepSizes = [1, 0.1, 0.01, 0.001, 0.0001];

    table.innerHTML = stepSizes.map(step => {
      const plus = f(a + step);
      const minus = f(a - step);
      const estimate = (plus - minus) / (2 * step);

      const error = exact !== null && Number.isFinite(estimate)
        ? Math.abs(estimate - exact)
        : null;

      const slopeText = Number.isFinite(estimate)
        ? estimate.toFixed(8)
        : "Undefined";

      const errorText = error === null
        ? "—"
        : error.toExponential(3);

      const closest = error !== null && error < 1e-6
        ? ' class="closest"'
        : "";

      return "<tr>" +
        "<td>" + step + "</td>" +
        "<td" + closest + ">" + slopeText + "</td>" +
        "<td>" + errorText + "</td>" +
        "</tr>";
    }).join("");

    drawGraph();
  } catch (error) {
    output.textContent = error.message;
    exactOutput.textContent = "Correct the input to calculate the derivative.";

    table.innerHTML =
      '<tr><td colspan="3">No results available.</td></tr>';

    drawGraph();
  }
}

$("derivBtn").addEventListener("click", calculateDerivative);

function readSet(id) {
  return [...new Set(
    $(id).value
      .split(",")
      .map(item => item.trim())
      .filter(item => item.length > 0)
  )];
}

function performSetOperation(operation) {
  const A = readSet("setA");
  const B = readSet("setB");
  const setB = new Set(B);

  let result = [];
  let symbol = "";

  if (operation === "union") {
    result = [...new Set([...A, ...B])];
    symbol = "A ∪ B";
  } else if (operation === "intersection") {
    result = A.filter(item => setB.has(item));
    symbol = "A ∩ B";
  } else if (operation === "difference") {
    result = A.filter(item => !setB.has(item));
    symbol = "A − B";
  }

  const resultText = result.length
    ? result.map(item =>
        item.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
      ).join(", ")
    : "∅";

  $("setResult").innerHTML =
    "<strong>" + symbol + "</strong>" +
    '<div class="set-output" style="margin-top:7px">{ ' +
    resultText + " }</div>" +
    '<div class="small">' + result.length + " element(s)</div>";
}

document.querySelectorAll("[data-op]").forEach(button => {
  button.addEventListener("click", () => {
    performSetOperation(button.dataset.op);
  });
});

function gdFunctionValue(x) {
  if ($("gdFunction").value === "quartic") {
    return x ** 4 - 3 * x ** 2 + x;
  }

  return x ** 2;
}

function gdDerivativeValue(x) {
  if ($("gdFunction").value === "quartic") {
    return 4 * x ** 3 - 6 * x + 1;
  }

  return 2 * x;
}

let gdX = 1;
let gdStepCount = 0;
let gdRunning = false;
let gdTimer = null;
let gdFinished = false;

function gdDraw() {
  const canvas = $("gdCanvas");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#071525";
  ctx.fillRect(0, 0, width, height);

  const xmin = -3.2;
  const xmax = 3.2;
  const samples = [];
  const count = 700;

  let ymin = Infinity;
  let ymax = -Infinity;

  for (let i = 0; i <= count; i++) {
    const x = xmin + (xmax - xmin) * i / count;
    const y = gdFunctionValue(x);

    if (Number.isFinite(y) && Math.abs(y) < 1e7) {
      samples.push({ x, y });
      ymin = Math.min(ymin, y);
      ymax = Math.max(ymax, y);
    } else {
      samples.push({ x, y: NaN });
    }
  }

  const currentY = gdFunctionValue(gdX);

  if (Number.isFinite(currentY)) {
    ymin = Math.min(ymin, currentY);
    ymax = Math.max(ymax, currentY);
  }

  if (!Number.isFinite(ymin) || !Number.isFinite(ymax)) return;

  if (ymin === ymax) {
    ymin -= 1;
    ymax += 1;
  }

  const padding = (ymax - ymin) * 0.12;
  ymin -= padding;
  ymax += padding;

  const px = x => (x - xmin) / (xmax - xmin) * width;
  const py = y => height - (y - ymin) / (ymax - ymin) * height;

  ctx.strokeStyle = "#1b3650";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 8; i++) {
    const x = i * width / 8;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let i = 0; i <= 6; i++) {
    const y = i * height / 6;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  if (ymin <= 0 && ymax >= 0) {
    ctx.strokeStyle = "#66819e";
    ctx.beginPath();
    ctx.moveTo(0, py(0));
    ctx.lineTo(width, py(0));
    ctx.stroke();
  }

  ctx.strokeStyle = "#55e6e0";
  ctx.lineWidth = 3;
  ctx.beginPath();

  let drawing = false;
  let previousY = null;

  for (const point of samples) {
    if (!Number.isFinite(point.y)) {
      drawing = false;
      previousY = null;
      continue;
    }

    const y = py(point.y);

    if (previousY !== null && Math.abs(y - previousY) > height * 0.6) {
      drawing = false;
    }

    if (!drawing) {
      ctx.moveTo(px(point.x), y);
      drawing = true;
    } else {
      ctx.lineTo(px(point.x), y);
    }

    previousY = y;
  }

  ctx.stroke();

  if (gdX >= xmin && gdX <= xmax && Number.isFinite(currentY)) {
    const slope = gdDerivativeValue(gdX);
    const span = 0.65;
    const x1 = Math.max(xmin, gdX - span);
    const x2 = Math.min(xmax, gdX + span);
    const y1 = currentY + slope * (x1 - gdX);
    const y2 = currentY + slope * (x2 - gdX);

    if (Number.isFinite(y1) && Number.isFinite(y2)) {
      ctx.save();
      ctx.strokeStyle = "#ff8fbc";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.moveTo(px(x1), py(y1));
      ctx.lineTo(px(x2), py(y2));
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = "#ff4d5e";
    ctx.beginPath();
    ctx.arc(px(gdX), py(currentY), 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ffe5e8";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = "#a9bdd4";
  ctx.font = "14px system-ui";
  ctx.fillText("x = " + xmin, 10, height - 10);
  ctx.fillText("x = " + xmax, width - 90, height - 10);
}

function gdUpdateStats() {
  const value = gdFunctionValue(gdX);
  const slope = gdDerivativeValue(gdX);

  $("gdSteps").textContent = gdStepCount;
  $("gdX").textContent = Number.isFinite(gdX) ? gdX.toFixed(6) : "—";
  $("gdFx").textContent = Number.isFinite(value) ? value.toFixed(6) : "—";
  $("gdSlope").textContent = Number.isFinite(slope) ? slope.toFixed(6) : "—";

  $("gdStartValue").textContent =
    Number($("gdStartX").value).toFixed(2);

  $("gdRateValue").textContent =
    Number($("gdLearningRate").value).toFixed(2);

  gdDraw();
}

function gdStop(message, statusClass = "") {
  gdRunning = false;
  gdFinished = true;

  if (gdTimer !== null) {
    clearInterval(gdTimer);
    gdTimer = null;
  }

  $("gdRun").textContent = "▶ Run";
  $("gdStatus").textContent = message;
  $("gdStatus").className = "gd-status " + statusClass;
}

function gdTakeStep() {
  if (gdFinished) return;

  const slope = gdDerivativeValue(gdX);
  const rate = Number($("gdLearningRate").value);

  if (!Number.isFinite(slope)) {
    gdStop("Cannot calculate the slope at this point.", "warn");
    return;
  }

  if (Math.abs(slope) < 0.001) {
    gdStop("The slope is almost zero. The ball has reached a stationary point.", "good");
    return;
  }

  const nextX = gdX - rate * slope;
  const nextY = gdFunctionValue(nextX);

  if (
    !Number.isFinite(nextX) ||
    !Number.isFinite(nextY) ||
    Math.abs(nextX) > 100 ||
    Math.abs(nextY) > 1e8
  ) {
    gdStop("The ball diverged. Try a smaller learning rate.", "warn");
    return;
  }

  gdX = nextX;
  gdStepCount++;

  gdUpdateStats();

  if (Math.abs(gdDerivativeValue(gdX)) < 0.001) {
    gdStop("The slope is almost zero. Gradient descent has converged.", "good");
  } else if (gdStepCount >= 1000) {
    gdStop("Maximum step count reached. Try a different starting point or learning rate.", "warn");
  } else {
    $("gdStatus").textContent =
      "Step completed. The ball moved opposite to the local slope.";
    $("gdStatus").className = "gd-status";
  }
}

function gdResetLab() {
  if (gdTimer !== null) {
    clearInterval(gdTimer);
    gdTimer = null;
  }

  gdRunning = false;
  gdFinished = false;
  gdX = Number($("gdStartX").value);
  gdStepCount = 0;

  $("gdRun").textContent = "▶ Run";
  $("gdStatus").textContent =
    "Ready. Press Step to take one gradient-descent update.";
  $("gdStatus").className = "gd-status";

  gdUpdateStats();
}

function gdToggleRun() {
  if (gdRunning) {
    gdRunning = false;

    if (gdTimer !== null) {
      clearInterval(gdTimer);
      gdTimer = null;
    }

    $("gdRun").textContent = "▶ Run";
    $("gdStatus").textContent = "Animation paused.";
    $("gdStatus").className = "gd-status";
    return;
  }

  if (gdFinished) {
    gdResetLab();
  }

  gdRunning = true;
  $("gdRun").textContent = "Ⅱ Pause";
  $("gdStatus").textContent = "Gradient descent is running...";
  $("gdStatus").className = "gd-status";

  gdTimer = setInterval(() => {
    if (!gdRunning) return;

    gdTakeStep();

    if (gdFinished) {
      gdRunning = false;
      $("gdRun").textContent = "▶ Run";
    }
  }, 350);
}

$("gdStep").addEventListener("click", () => {
  if (gdFinished) gdResetLab();
  gdTakeStep();
});

$("gdRun").addEventListener("click", gdToggleRun);
$("gdReset").addEventListener("click", gdResetLab);

$("gdStartX").addEventListener("input", gdResetLab);

$("gdLearningRate").addEventListener("input", () => {
  gdUpdateStats();

  if (!gdFinished && !gdRunning) {
    $("gdStatus").textContent =
      "Learning rate updated. Press Step or Run to continue.";
  }
});

$("gdFunction").addEventListener("change", gdResetLab);

drawGraph();
calculateDerivative();
gdResetLab();
