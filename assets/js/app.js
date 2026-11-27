const form = document.querySelector("#command-form");
const input = document.querySelector("#command-input");
const output = document.querySelector("#terminal-output");
const expectedCoordinates = { e: "114.06", n: "22.33" };
const commandHistory = [];
let queryStageStarted = false;
let historyIndex = 0;
let commandDraft = "";

function parseCoordinateCommand(command) {
  const parts = command.trim().split(/\s+/);
  if (
    parts.length !== 6
    || parts[0].toLowerCase() !== "run"
    || parts[1].toLowerCase() !== "cute_rabbit.exe"
  ) {
    return null;
  }

  const coordinates = {};
  for (let index = 2; index < parts.length; index += 2) {
    const direction = parts[index].toLowerCase();
    const value = parts[index + 1];
    if (
      !["-e", "-n"].includes(direction)
      || Object.hasOwn(coordinates, direction)
      || !/^\d{1,3}\.\d{2}$/.test(value)
    ) {
      return null;
    }
    coordinates[direction.slice(1)] = value;
  }

  return Object.hasOwn(coordinates, "e") && Object.hasOwn(coordinates, "n")
    ? coordinates
    : null;
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
  if (!command) {
    return;
  }

  appendOutput(`root@palandu:~$ ${command}`, "system-line");
  commandHistory.push(command);
  historyIndex = commandHistory.length;
  commandDraft = "";
  input.value = "";

  if (queryStageStarted) {
    appendOutput("数据库查询阶段尚未开放。");
    return;
  }

  const coordinates = parseCoordinateCommand(command);
  if (!coordinates) {
    appendOutput("未识别该指令或坐标格式无效，请检查命令后重试。");
    return;
  }

  if (
    coordinates.e !== expectedCoordinates.e
    || coordinates.n !== expectedCoordinates.n
  ) {
    appendOutput("渗透失败：无法定位数据库服务器，请确认提供的地理坐标是否正确。");
    return;
  }

  appendOutput("目标服务器地址解析成功。渗透程序启动，数据库连接授权已获取。", "system-line");
  appendOutput("正在切换至数据库查询阶段……");
  queryStageStarted = true;
});
