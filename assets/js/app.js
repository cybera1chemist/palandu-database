const form = document.querySelector("#command-form");
const input = document.querySelector("#command-input");
const output = document.querySelector("#terminal-output");
const startupMessage = document.querySelector(".startup-message");
const expectedCoordinates = { e: "114.06", n: "22.33" };
const unlockStorageKey = "palandu-database-unlocked";
const cipherByPlaintext = new Map([
  ["0", "♈︎"],
  ["零", "♈︎"],
  ["zero", "♈︎"],
  ["1", "♉︎"],
  ["一", "♉︎"],
  ["one", "♉︎"],
  ["2", "♊︎"],
  ["二", "♊︎"],
  ["two", "♊︎"],
  ["3", "♋︎"],
  ["三", "♋︎"],
  ["three", "♋︎"],
  ["4", "♌︎"],
  ["四", "♌︎"],
  ["four", "♌︎"],
  ["5", "♍︎"],
  ["五", "♍︎"],
  ["five", "♍︎"],
  ["6", "♎︎"],
  ["六", "♎︎"],
  ["six", "♎︎"],
  ["7", "♏︎"],
  ["七", "♏︎"],
  ["seven", "♏︎"],
  ["8", "♐︎"],
  ["八", "♐︎"],
  ["eight", "♐︎"],
  ["9", "♑︎"],
  ["九", "♑︎"],
  ["nine", "♑︎"],
  ["A", "♒︎"],
  ["a", "♒︎"],
  ["十", "♒︎"],
  ["10", "♒︎"],
  ["ten", "♒︎"],
  ["B", "♓︎"],
  ["b", "♓︎"],
  ["十一", "♓︎"],
  ["11", "♓︎"],
  ["eleven", "♓︎"]
]);
const outputLineDelay = 60;
const helpLines = [
  "INSTRUCTION",
  "--------------------------------------------",
  "TARGET LOCATION PARAMETERS",
  "东西经度 (Longitude): E / W",
  "南北纬度 (Latitude):  N / S",
  "坐标精度：小数点后两位",
  "取值方式：四舍五入",
  "--------------------------------------------",
  "COMMAND EXAMPLE",
  "例如，目标服务器位于东经 116.40°、",
  "北纬 39.91°，则输入以下命令：",
  "run cute_rabbit.exe -E 116.40 -N 39.91",
  "--------------------------------------------",
  "[STATUS] 等待输入目标服务器坐标..."
];
const commandHistory = [];
let unlockStorageUnavailable = false;
let historyIndex = 0;
let commandDraft = "";
let outputQueue = Promise.resolve();

function loadUnlockState() {
  try {
    return window.localStorage.getItem(unlockStorageKey) === "true";
  } catch (error) {
    if (error instanceof DOMException && error.name === "SecurityError") {
      unlockStorageUnavailable = true;
      return false;
    }
    throw error;
  }
}

let queryStageStarted = loadUnlockState();

function parseCoordinateArguments(parts) {
  if (parts.length !== 6) {
    return { error: "parameters" };
  }
  const coordinates = {};
  for (let index = 2; index < parts.length; index += 2) {
    const direction = parts[index].toLowerCase();
    const value = parts[index + 1];
    if (
      !["-e", "-n"].includes(direction)
      || Object.hasOwn(coordinates, direction)
      || !/^\d+(?:\.\d+)?$/.test(value)
    ) {
      return { error: "parameters" };
    }
    if (!/^\d{1,3}\.\d{2}$/.test(value)) {
      return { error: "precision" };
    }
    coordinates[direction.slice(1)] = value;
  }

  return Object.hasOwn(coordinates, "e") && Object.hasOwn(coordinates, "n")
    ? { coordinates }
    : { error: "parameters" };
}

function appendOutput(text, className = "") {
  const line = document.createElement("p");
  line.textContent = text;
  if (className) {
    line.className = className;
  }
  output.append(line);
  output.scrollTop = output.scrollHeight;
}

function enqueueLines(lines, renderLine) {
  outputQueue = outputQueue.then(async () => {
    for (let index = 0; index < lines.length; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, outputLineDelay));
      renderLine(lines[index], index);
    }
  });
  return outputQueue;
}

function enqueueOutput(lines) {
  const outputLines = [...lines];
  if (outputLines[outputLines.length - 1] !== "") {
    outputLines.push("");
  }
  return enqueueLines(outputLines, (line, index) => {
    const isTrailingBlankLine = index === outputLines.length - 1 && line === "";
    appendOutput(line, isTrailingBlankLine ? "output-spacer" : "");
  });
}

function persistUnlockState() {
  try {
    window.localStorage.setItem(unlockStorageKey, "true");
    return true;
  } catch (error) {
    if (
      error instanceof DOMException
      && ["QuotaExceededError", "SecurityError"].includes(error.name)
    ) {
      enqueueOutput(["[ERROR] 无法保存解锁状态，请检查浏览器本地存储设置。"]);
      return false;
    }
    throw error;
  }
}

const startupLines = queryStageStarted
  ? [
      "[STATUS] 已恢复玩家解锁状态",
      "[STATUS] TARGET ACQUIRED",
      "",
      "数据库查询模块已就绪。输入密码对照表中的原文即可查询。"
    ]
  : startupMessage.textContent.split("\n");
if (startupLines[startupLines.length - 1] !== "") {
  startupLines.push("");
}
startupMessage.textContent = "";
enqueueLines(startupLines, (line, index) => {
  if (index > 0) {
    startupMessage.append(document.createTextNode("\n"));
  }
  startupMessage.append(document.createTextNode(line));
  output.scrollTop = output.scrollHeight;
});
if (unlockStorageUnavailable) {
  enqueueOutput(["[ERROR] 无法读取浏览器本地存储，解锁状态未恢复。"]);
}

input.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp" && commandHistory.length > 0) {
    event.preventDefault();
    if (historyIndex === commandHistory.length) {
      commandDraft = input.value;
    }
    historyIndex = Math.max(0, historyIndex - 1);
    input.value = commandHistory[historyIndex];
  } else if (event.key === "ArrowDown" && historyIndex < commandHistory.length) {
    event.preventDefault();
    historyIndex += 1;
    input.value = historyIndex === commandHistory.length
      ? commandDraft
      : commandHistory[historyIndex];
  } else {
    return;
  }

  input.setSelectionRange(input.value.length, input.value.length);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const command = input.value.trim();
  input.value = "";
  if (!command) {
    return;
  }

  appendOutput(`root@palandu:~$ ${command}`, "system-line");
  commandHistory.push(command);
  historyIndex = commandHistory.length;
  commandDraft = "";

  const parts = command.split(/\s+/);
  if (queryStageStarted) {
    const cipher = cipherByPlaintext.get(command);
    if (cipher === undefined) {
      enqueueOutput(["[ERROR] 数据库中无法检索到对应内容"]);
      return;
    }

    enqueueOutput([cipher]);
    return;
  }

  if (parts[0].toLowerCase() === "help" && parts.length === 1) {
    enqueueOutput(helpLines);
    return;
  }

  if (parts[0].toLowerCase() !== "run") {
    enqueueOutput([
      "[ERROR] 未知指令。无法识别当前操作，请使用指定的启动命令。使用help命令以查看指引。"
    ]);
    return;
  }

  if (!parts[1]) {
    enqueueOutput([
      "[ERROR] cute_rabbit.exe 参数无效，无法运行。使用help命令以查看指引。"
    ]);
    return;
  }

  if (parts[1].toLowerCase() !== "cute_rabbit.exe") {
    enqueueOutput([
      `[ERROR] ${parts[1]}不是有效的可执行程序。使用help命令以查看指引。`
    ]);
    return;
  }

  const result = parseCoordinateArguments(parts);
  if (result.error === "parameters") {
    enqueueOutput([
      "[ERROR] cute_rabbit.exe 参数无效，无法运行。使用help命令以查看指引。"
    ]);
    return;
  }
  if (result.error === "precision") {
    enqueueOutput([
      "[ERROR] cute_rabbit.exe 参数数值精度有误，无法运行。使用help命令以查看指引。"
    ]);
    return;
  }

  const coordinates = result.coordinates;
  if (
    coordinates.e !== expectedCoordinates.e
    || coordinates.n !== expectedCoordinates.n
  ) {
    enqueueOutput([
      "[COMMAND ACCEPTED]",
      "",
      "正在解析目标坐标...",
      "正在检索地理定位数据库...",
      "正在匹配目标服务器...",
      "",
      "[OK] 坐标解析失败",
      "[ERROR] 服务器坐标错误，请重试",
      "",
      "--------------------------------------------",
      "[STATUS] 等待输入目标服务器坐标..."
    ]);
    return;
  }

  if (!persistUnlockState()) {
    return;
  }

  enqueueOutput([
    "[COMMAND ACCEPTED]",
    "正在解析目标坐标...",
    "正在检索地理定位数据库...",
    "正在匹配目标服务器...",
    "[OK] 坐标解析完成",
    "[OK] 目标位置已确认",
    "[OK] 数据库检索模块已启动",
    "[STATUS] TARGET ACQUIRED",
    "",
    "♡ ∩_∩",
    " („• ֊ •„)♡",
    "|￣U   U￣￣￣￣￣￣￣|",
    "|   have a nice day!  |",
    "￣￣￣￣￣￣￣￣￣￣￣",
    "",
    "╔══════════════════════════════╗",
    "║                                                            ║",
    "║                       CUTE_RABBIT.EXE                      ║",
    "║                                                            ║",
    "║                   LITTLE RABBIT, BIG JOB.                  ║",
    "║                                                            ║",
    "╚══════════════════════════════╝",
    "",
    "Welcome ₍ᐢ.ˬ.ᐢ₎♡~",
    "这是一个使用起来非常简单的数据库查询程序~",
    "只要输入你想查询的原文，再按下回车",
    "程序就会返回对应的密文啦~"
  ]);
  queryStageStarted = true;
});
