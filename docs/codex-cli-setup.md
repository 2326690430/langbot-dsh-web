# Codex CLI 安装和集成指南

本指南将帮助您安装和配置 OpenAI Codex CLI，以便与 LangBot 协同工作。LangBot 内置 [Model Context Protocol](https://modelcontextprotocol.io/) 服务器，位于 `/mcp`，Codex CLI 通过它调用 LangBot 的 MCP 工具，程序化管理机器人、流水线、模型、知识库等。

> **说明**：Codex CLI 本身是编码代理，它把 MCP 服务器当作工具源。你在 Codex 会话里用自然语言下达任务，Codex 自行决定调用哪个 LangBot MCP 工具；也可以显式点名工具。下面的"使用示例"给出的是这些 MCP 工具的名称和参数，而不是要手工敲的命令。

## 前置条件

1. **Node.js 和 npm** - 用于安装和运行 Codex CLI
   - Node.js 18.0 或更高版本
   - 可以通过 [Node.js 官网](https://nodejs.org/) 下载安装

2. **运行中的 LangBot 实例** - 一个可访问的 LangBot 工作区
   - 可以是本地开发实例、Docker 容器或 LangBot Cloud
   - 确认能访问 LangBot 的 Web 管理界面和 API

3. **有效的 OpenAI 账号** - Codex CLI 使用 ChatGPT 登录（Plus/Pro/Enterprise）或 API Key

4. **基本的命令行操作知识** - 本指南假设您熟悉终端操作

## 安装 Codex CLI

### 方法 1：通过 npm 安装（推荐）

```bash
# 安装 Codex CLI
npm install -g @openai/codex

# 验证安装
codex --version
```

### 方法 2：通过 npx 临时使用

如果您不想全局安装，可以使用 npx 临时运行：

```bash
npx @openai/codex --version
```

## 将 LangBot MCP 服务器接入 Codex CLI

Codex CLI 通过 `codex mcp add` 把一个 MCP 服务器注册为工具源。LangBot 的 MCP 服务器是 **streamable-HTTP** 端点，用 LangBot API Key 鉴权。

### 步骤 1：获取 LangBot MCP 端点

1. 启动您的 LangBot 实例（如果尚未运行）
2. 访问 LangBot Web 管理面板
3. 导航到 **API & MCP** 选项卡
4. 记录 MCP 服务器端点 URL，通常形如：
   - `http://localhost:5300/mcp`（本地开发）
   - `https://your-langbot-instance.com/mcp`（生产环境）

### 步骤 2：获取 LangBot API 密钥

1. 在 LangBot Web 管理面板的 **API Keys** 部分创建或复用一个 API 密钥
2. 该密钥可以是 Web UI 创建的 `lbk_...` 用户密钥，也可以是 `config.yaml` 里的全局 API Key
3. 保存好，注册 MCP 服务器时要用到

### 步骤 3：把 LangBot MCP 服务器加入 Codex

```bash
# 注册一个 HTTP MCP 服务器（streamable HTTP 传输），携带鉴权头
codex mcp add langbot --url http://localhost:5300/mcp --header "Authorization: Bearer <your-langbot-api-key>"

# 验证已注册
codex mcp list
```

> LangBot 的 `/mcp` 端点接受 `X-API-Key` 或 `Authorization: Bearer <key>` 两种方式，等价。

### 方式 2：编辑配置文件

也可以直接编辑 `~/.codex/config.toml`（Codex 的 MCP 配置项）：

```toml
[mcp_servers.langbot]
url = "http://localhost:5300/mcp"
headers = { Authorization = "Bearer <your-langbot-api-key>" }
```

> **安全提示**：生产环境不要把 API 密钥硬编码进提交到版本库的配置文件。用环境变量或密钥管理方案。

## 在 Codex 会话中使用

注册后，在 `codex` 交互会话里直接用自然语言驱动，Codex 会按需调用 LangBot 的 MCP 工具：

```text
$ codex
> 列出我工作区里所有的机器人和它们的流水线
> 给 uuid 为 xxxx 的机器人改一下欢迎语
> 拉一次最近 100 条 LLM 调用记录，看看哪条最慢
```

Codex 会读取 LangBot MCP 服务器暴露的工具清单并自行选择。下面这一节是这些工具的真实名称与参数，供你核对 Codex 是否调对了，或在需要时显式指名调用。

## LangBot MCP 工具参考（与 server 实现一一对应）

> 工具名取自 `src/langbot/pkg/api/mcp/server.py`，与 LangBot 当前实现严格对齐。完整参数请运行 `codex` 后在会话内 `/mcp` 查看工具 schema。

**机器人（Bots）**

| 工具 | 说明 | 关键参数 |
|---|---|---|
| `list_bots` | 列出所有消息平台机器人（密钥已脱敏） | 无 |
| `get_bot` | 按 UUID 取单个机器人 | `bot_uuid` |
| `create_bot` | 创建机器人 | `bot_data` |
| `update_bot` | 按 UUID 更新机器人 | `bot_uuid`, `bot_data` |
| `delete_bot` | 按 UUID 删除机器人 | `bot_uuid` |
| `list_bot_event_route_statuses` | 列出某机器人的事件路由近期运行状态 | `bot_uuid` |

**流水线（Pipelines）**

| 工具 | 说明 | 关键参数 |
|---|---|---|
| `list_pipelines` | 列出所有流水线 | 无 |
| `get_pipeline` | 按 UUID 取单个流水线 | `pipeline_uuid` |
| `create_pipeline` | 创建流水线（参数同 HTTP PUT/POST 请求体） | `pipeline_data` |
| `update_pipeline` | 按 UUID 更新流水线 | `pipeline_uuid`, `pipeline_data` |
| `delete_pipeline` | 按 UUID 删除流水线 | `pipeline_uuid` |
| `run_pipeline` | 在新会话里跑一轮流水线 | `pipeline_uuid`, `message` |
| `get_pipeline_extensions` | 读流水线扩展绑定 | `pipeline_uuid` |
| `update_pipeline_extensions` | 替换流水线扩展绑定 | `pipeline_uuid`, ... |

**处理器 / Agent / 事件（Processors）**

| 工具 | 说明 | 关键参数 |
|---|---|---|
| `list_processors` | 列出 Agent、Pipeline、事件处理器 | 无 |
| `get_processor` | 按 UUID 取处理器 | `processor_uuid` |
| `create_processor` | 创建处理器 | `processor_data` |
| `update_processor` | 更新处理器 | `processor_uuid`, `processor_data` |
| `delete_processor` | 删除处理器 | `processor_uuid` |
| `list_processor_runs` | 列出某处理器的运行历史 | `processor_uuid`, `before_id?` |
| `get_processor_run_events` | 读某次运行的日志与动作结果 | ... |
| `debug_agent` | 调试某 Agent/处理器 | `processor_uuid`, `payload` |

**模型 / 知识库 / 技能**

| 工具 | 说明 | 关键参数 |
|---|---|---|
| `list_llm_models` | 列出 LLM 模型 | 无 |
| `list_embedding_models` | 列出嵌入模型 | 无 |
| `list_model_providers` | 列出模型供应商 | 无 |
| `get_starred_model` / `set_starred_model` | 读/写收藏的模型 | `model_uuid?` |
| `get_default_model` | 解析默认模型 | 无 |
| `list_knowledge_bases` | 列出知识库 | 无 |
| `retrieve_knowledge_base` | 检索知识库 | `kb_uuid`, `query` |
| `list_skills` / `get_skill` | 列出/取技能 | `skill_name` |

**监控 / 运维**

| 工具 | 说明 | 关键参数 |
|---|---|---|
| `get_system_info` | 版本、版本类型 | 无 |
| `get_monitoring_records` | 读 LLM 调用/会话记录（可过滤） | `kind`, `bot_ids?`, ... |
| `get_monitoring_details` | 读单条消息/会话详情 | `kind`, `identifier` |
| `get_inflight_executions` | 读在跑与刚启动的执行快照 | 无 |
| `get_sandbox_diagnostics` | 读沙箱状态/会话/错误 | `kind` |
| `reset_session_context` | 重置某机器人会话上下文 | `bot_id`, `session_id` |
| `get_workspace_message_language` / `set_workspace_message_language` | 读/写工作区消息语言 | 无 |

> 注意：LangBot MCP 服务器**不暴露** `install_plugin` / `get_bot_status` / `list_plugins` 这类工具。插件安装请走插件市场 / `lbctl`；机器人状态请用 `list_bot_event_route_statuses` 或 `get_monitoring_records`。

## 故障排除

**MCP 服务器连不上**
1. 确认 LangBot 实例在运行，`/mcp` 端口（默认 5300）可达
2. 检查 URL 是否以 `/mcp` 结尾
3. 防火墙/安全组是否放行了该端口

**鉴权失败（401）**
1. API 密钥是否正确、未过期
2. 密钥是否有该工作区的访问权限
3. 是否用 `Authorization: Bearer <key>` 或 `X-API-Key` 头（两者等价）

**Codex 找不到工具**
1. `codex mcp list` 确认 LangBot 服务器已注册
2. 在 Codex 会话内 `/mcp` 查看工具是否加载
3. 若 LangBot 重启过，确认 `/mcp` 的 streamable-HTTP 会话已重新建立

**密钥泄露**
- 立即在 LangBot Web 面板里吊销该 API Key，重新生成
- 检查有没有把密钥写进提交到版本库的文件

## 后续步骤

- 跑一轮 `codex`，让它用 LangBot 工具做一件真实的事（比如 `list_bots` + `get_monitoring_records`）
- 把常用工作流固化成自然语言提示词，放进你的提示词库
- 需要脚本化 / 非交互场景时，考虑用 `lbctl`（LangBot CLI）而非 Codex

如需更多帮助，参考：
- [LangBot 文档](https://langbot.app/docs)
- [OpenAI Codex CLI](https://github.com/openai/codex)
- [Model Context Protocol 规范](https://modelcontextprotocol.io/)
