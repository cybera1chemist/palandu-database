const form = document.querySelector("#command-form");
const input = document.querySelector("#command-input");
const output = document.querySelector("#terminal-output");
const expectedIp = "123.456.789";
const commandHistory = [];
let queryStageStarted = false;
let historyIndex = 0;
let commandDraft = "";

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

  const match = command.match(/^run cute_rabbit\.exe -ip (\S+)$/);
  if (!match) {
    appendOutput("未识别该指令。请检查命令格式后重试。");
    return;
  }

  if (match[1] !== expectedIp) {
    appendOutput("破解失败：无法连接目标服务器，请确认 IP 地址是否正确。");
    return;
  }

  appendOutput("IP 校验通过。破解程序已启动，数据库访问授权成功。", "system-line");
  appendOutput("正在切换至数据库查询阶段……");
  queryStageStarted = true;
});
