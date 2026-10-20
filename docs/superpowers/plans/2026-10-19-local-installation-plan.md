# LangBot 本地安装验证计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 提供一个详细的、可在 Windows 环境中执行的 LangBot 本地安装步骤，使得代码执行者（codex）可以按照步骤操作，而验证者（本 agent）能够确认安装成功且服务可访问。

**Architecture:** 先检查前置条件（git、uv、Python 版本），然后克隆仓库，使用 uv 安装依赖，最后启动 LangBot 服务并验证其 Web UI 是否可达。整个过程采用可重复的脚本形式，每个步骤都有明确的成功标志。

**Tech Stack:** git, uv, Python 3.11+, LangBot 4.11.0

**Spec:** 用户请求：给出本地安装的详细方案，让右边的codex跑，你验收（隐含要求：步骤清晰、可执行、可验证）

## Global Constraints
- 操作系统：Windows 10/11（使用 Git Bash 或等效的 POSIX 兼容 shell）
- 必须使用 uv 作为包管理器（项目推荐）
- Python 版本需满足 >=3.11,<4.0
- 网络必须能够访问 PyPI 和 GitHub
- 所有步骤应在 LangBot 项目根目录下执行

## Review Focus
- 缺少 git：无法克隆仓库
- 缺少 uv：无法按照推荐方式安装依赖
- Python 版本过低：导致依赖安装失败或运行时错误
- 依赖安装失败（网络或版本冲突）：服务启动失败
- 服务端口（5300）被占用：导致启动失败
- 服务启动但未就绪（仍在安装依赖）：过早验证导致误判
- 防火墙阻止端口访问：验证者无法访问 Web UI

---
### Task 1: 检查前置条件

**Files:**
- Create: `docs/superpowers/plans/2026-10-19-local-installation-plan.md`

**Interfaces:**
- Consumes: 无
- Produces: 前置条件检查脚本（后续任务将使用）

- [ ] **Step 1: 检查 git 是否可用**

```bash
git --version
```

- [ ] **Step 2: 检查 uv 是否可用**

```bash
uv --version
```

- [ ] **Step 3: 检查 Python 版本是否符合要求**

```bash
python --version
```

- [ ] **Step 4: 记录前置条件结果到日志文件**

```bash
{
  echo "=== 前置条件检查 ==="
  echo "git: $(git --version 2>&1 || echo '未找到')"
  echo "uv: $(uv --version 2>&1 || echo '未找到')"
  echo "python: $(python --version 2>&1 || echo '未找到')"
} > logs/prerequisites.log
```

- [ ] **Step 5: 提交前置条件检查记录**

```bash
git add docs/superpowers/plans/2026-10-19-local-installation-plan.md logs/prerequisites.log
git commit -m "feat: 添加 LangBot 本地安装计划及前置条件检查"
```

### Task 2: 准备工作目录并克隆仓库

**Files:**
- Modify: `docs/superpowers/plans/2026-10-19-local-installation-plan.md`
- Create: `installation_log.txt`（在项目根目录）

**Interfaces:**
- Consumes: 前置条件检查通过（若未通过则需人工干预）
- Produces: 已克隆的 LangBot 仓库副本

- [ ] **Step 1: 选择工作目录（假设为当前目录）**

```bash
WORKDIR=$(pwd)
echo "工作目录: $WORKDIR" >> installation_log.txt
```

- [ ] **Step 2: 如果目录中已有 LangBot 仓库，则更新；否则克隆**

```bash
if [ -d "LangBot" ] && [ -d "LangBot/.git" ]; then
  echo "发现现有 LangBot 仓库，尝试更新..." >> installation_log.txt
  cd LangBot
  git pull origin main
  cd ..
else
  echo "克隆 LangBot 仓库..." >> installation_log.txt
  git clone https://github.com/langbot-app/LangBot.git
fi
```

- [ ] **Step 3: 进入 LangBot 目录**

```bash
cd LangBot
echo "当前目录: $(pwd)" >> ../installation_log.txt
```

- [ ] **Step 4: 提交克隆/更新记录**

```bash
git add ../installation_log.txt
git commit -m "feat: 准备工作目录并获取 LangBot 代码"
```

### Task 3: 使用 uv 安装依赖并启动服务

**Files:**
- Modify: `docs/superpowers/plans/2026-10-19-local-installation-plan.md`
- Create: `startup_log.txt`

**Interfaces:**
- Consumes: 已就绪的 LangBot 仓库
- Produces: 正在运行的 LangBot 服务（后台进程）及其日志

- [ ] **Step 1: 使用 uv 同步依赖（确保环境与 pyproject.toml 一致）**

```bash
uv sync
```

- [ ] **Step 2: 记录依赖安装开始时间**

```bash
echo "依赖安装完成时间: $(date)" >> ../startup_log.txt
```

- [ ] **Step 3: 启动 LangBot 服务（后台运行）并重定向输出**

```bash
# 使用 uvx 启动（推荐的一行启动方式）
uvx langbot > ../startup_log.txt 2>&1 &
LANGBOT_PID=$!
echo $! > ../langbot.pid
echo "LangBot 已启动，PID: $LANGBOT_PID" >> ../startup_log.txt
```

- [ ] **Step 4: 等待服务就绪（最多 60 秒），每秒检查一次端口 5300 是否可达**

```bash
TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  if curl -sf http://localhost:5300/ > /dev/null 2>&1; then
    echo "服务已就绪！用时 ${ELAPSED} 秒" >> ../startup_log.txt
    break
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done

if [ $ELAPSED -eq $TIMEOUT ]; then
  echo "错误：服务在 ${TIMEOUT} 秒内未就绪，请检查日志" >> ../startup_log.txt
fi
```

- [ ] **Step 5: 提交启动日志和 PID 文件**

```bash
git add ../startup_log.txt ../langbot.pid
git commit -m "feat: 启动 LangBot 服务并记录启动过程"
```

### Task 4: 验证服务可访问并完成验证

**Files:**
- Modify: `docs/superpowers/plans/2026-10-19-local-installation-plan.md`
- Create: `verification_result.txt`

**Interfaces:**
- Consumes: 正在运行的 LangBot 服务
- Produces: 验证结果（成功或失败）

- [ ] **Step 1: 再次确认服务可达并获取响应内容**

```bash
RESPONSE=$(curl -s http://localhost:5300/ | head -5)
echo "服务响应预览:" >> ../verification_result.txt
echo "$RESPONSE" >> ../verification_result.txt
```

- [ ] **Step 2: 检查响应中是否包含期望的关键字（如 LangBot、Dashboard 等）**

```bash
if echo "$RESPONSE" | grep -qi "langbot\|dashboard\|web.*ui"; then
  echo "验证成功：Web UI 可访问且包含期望内容" >> ../verification_result.txt
else
  echo "验证失败：响应中未发现期望关键字" >> ../verification_result.txt
fi
```

- [ ] **Step 3: （可选）检查服务进程是否仍在运行**

```bash
if ps -p $(cat ../langbot.pid) > /dev/null 2>&1; then
  echo "LangBot 进程仍在运行 (PID: $(cat ../langbot.pid))" >> ../verification_result.txt
else
  echo "警告：LangBot 进程已退出" >> ../verification_result.txt
fi
```

- [ ] **Step 4: 提交验证结果**

```bash
git add ../verification_result.txt
git commit -m "feat: 验证 LangBot 安装并记录结果"
```

### Task 5: 清理（可选，由验证者决定是否保留）

**Files:**
- Modify: `docs/superpowers/plans/2026-10-19-local-installation-plan.md`

**Interfaces:**
- Consumes: 验证完成
- Produces: 可选的清理步骤

- [ ] **Step 1: 询问验证者是否要停止服务并清理进程**

> 注意：此步骤由验证者（本 agent）在收到验证结果后决定是否执行。计划中仅作说明，不自动执行。

```bash
# 如果需要停止服务：
# kill $(cat langbot.pid)
# rm langbot.pid
```

- [ ] **Step 2: 提交最终状态（如果执行了清理）**

```bash
# git add langbot.pid
# git commit -m "feat: 清理 LangBot 后台进程"
```

---

**Plan complete and saved to `docs/superpowers/plans/2026-10-19-local-installation-plan.md`. Please review the plan. Which execution approach would you prefer?**

- **Subagent-driven** - A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. Most thorough; costs a fresh context per task and per review.
- **Native** - I implement every task myself in this session, the way this harness runs work, then one fresh reviewer on the most capable model checks the whole branch. Cheapest and fastest; no independent review until the end. Runs well with a mid-tier session model, since the plan carries the design.

**For this plan I recommend Subagent-driven, because the tasks involve external processes (network cloning, dependency installation, service startup) that benefit from isolated verification and reduce the risk of leaving the session in an inconsistent state. Does the plan capture what you want, and which approach should we use?**