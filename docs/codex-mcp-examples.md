# Codex MCP 连接示例

本文档提供通过 Model Context Protocol（MCP）与 LangBot 交互的实际示例。与 LangBot 交互有两条等价路径：

1. **Codex CLI + LangBot MCP 服务器**（交互式）：把 LangBot 的 `/mcp` 端点注册进 Codex CLI（`codex mcp add`），在 Codex 会话里用自然语言驱动，Codex 自动选择 LangBot 的 MCP 工具。安装与配置见 [Codex CLI 安装指南](docs/codex-cli-setup.md)。
2. **直接调用 HTTP API**（脚本化）：LangBot 的 HTTP Service API 与 MCP 工具同源（MCP 工具直接调用服务层），用 API Key 鉴权即可。本文档的脚本示例走这条路。

> 工具名、参数、HTTP 端点均取自 `src/langbot/pkg/api/mcp/server.py` 与 `src/langbot/pkg/api/http/controller/groups/`，与 LangBot 当前实现严格对齐。

## 前置条件

1. 一个运行中、可访问的 LangBot 实例
2. 一个 LangBot API 密钥（Web 面板的 **API Keys** 页创建，或 `config.yaml` 的全局 Key）
3. 本文脚本示例只需要 curl / Node / Python 标准库，不需要 Codex CLI

## 示例目录结构

```
examples/codex-langbot-integration/
├── list-bots.js          # JavaScript：列出所有机器人（HTTP API）
├── create-pipeline.py    # Python：创建新流水线（HTTP API）
└── workflow-automation.ts # TypeScript：端到端工作流（HTTP API）
```

> 插件安装不经过 MCP / HTTP 通用端点——LangBot 的 MCP 服务器不暴露插件安装工具。插件安装走插件市场，或 `lbctl` CLI。

## 示例 1：列出所有机器人（JavaScript）

```javascript
// examples/codex-langbot-integration/list-bots.js
// 列出 LangBot 工作区中所有机器人（走 HTTP API，等价于 MCP 工具 list_bots）

const { execSync } = require('child_process');

const BASE = process.env.LANGBOT_BASE_URL || 'http://localhost:5300';
const KEY = process.env.LANGBOT_API_KEY;
if (!KEY) { console.error('请设置 LANGBOT_API_KEY'); process.exit(1); }

try {
  const output = execSync(
    `curl -sf -H "X-API-Key: ${KEY}" ${BASE}/api/v1/bots`,
    { encoding: 'utf8' }
  );
  const body = JSON.parse(output);
  const bots = body.data ?? body; // 服务层返回 { data: [...] } 或直接 [...]

  console.log('LangBot 中的机器人列表:');
  console.log('====================');

  if (!Array.isArray(bots) || bots.length === 0) {
    console.log('当前没有机器人');
  } else {
    bots.forEach((bot, index) => {
      console.log(`${index + 1}. 名称: ${bot.name || '未命名'}`);
      console.log(`   ID: ${bot.uuid ?? bot.id ?? '未知'}`);
      console.log('');
    });
  }
} catch (error) {
  console.error('执行示例时出错:', error.message);
  process.exit(1);
}
```

对应的 MCP 工具（Codex 会话内自然语言触发）：`list_bots`，无参数，返回脱敏后的机器人列表。

## 示例 2：创建新流水线（Python）

```python
# examples/codex-langbot-integration/create-pipeline.py
# 创建一个新的 LangBot 流水线（走 HTTP API，等价于 MCP 工具 create_pipeline）

import json
import os
import sys
import urllib.request

BASE = os.environ.get('LANGBOT_BASE_URL', 'http://localhost:5300')
KEY = os.environ.get('LANGBOT_API_KEY')
if not KEY:
    sys.exit('请设置 LANGBOT_API_KEY')

def create_pipeline(name, description=""):
    """创建一个新的 LangBot 流水线。

    pipeline_data 的字段与 MCP 工具 create_pipeline 的 pipeline_data、
    以及 HTTP PUT/POST 请求体一致。
    """
    pipeline_data = {
        "name": name,
        "description": description,
    }

    req = urllib.request.Request(
        f"{BASE}/api/v1/pipelines",
        data=json.dumps(pipeline_data).encode(),
        headers={"X-API-Key": KEY, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            pipeline = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"创建流水线失败: HTTP {e.code}: {e.read().decode(errors='replace')}")
        sys.exit(1)

    print("成功创建流水线!")
    print(f"ID: {pipeline.get('uuid') or pipeline.get('id')}")
    print(f"名称: {pipeline.get('name')}")
    print(f"描述: {pipeline.get('description')}")
    return pipeline

if __name__ == "__main__":
    create_pipeline("codex-created-pipeline", "示例流水线")
```

对应的 MCP 工具：`create_pipeline(pipeline_data)`。

## 示例 3：端到端工作流（TypeScript）

```typescript
// examples/codex-langbot-integration/workflow-automation.ts
// 端到端工作流：列机器人 -> 建流水线 -> 绑定/验证（走 HTTP API）

const BASE = process.env.LANGBOT_BASE_URL ?? 'http://localhost:5300';
const KEY = process.env.LANGBOT_API_KEY ?? '';
if (!KEY) {
  console.error('请设置 LANGBOT_API_KEY');
  process.exit(1);
}

interface Bot { uuid?: string; id?: string; name: string }
interface Pipeline { uuid?: string; id?: string; name: string; description?: string }

async function api<T>(method: 'GET' | 'POST' | 'PUT', path: string, body?: unknown): Promise<T> {
  const resp = await fetch(BASE + path, {
    method,
    headers: { 'X-API-Key': KEY, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} on ${method} ${path}: ${await resp.text()}`);
  }
  const json = await resp.json();
  // 服务层统一返回 { data: ... }，直接取 data
  return (json.data ?? json) as T;
}

async function main() {
  console.log('开始 LangBot 自动化工作流...');

  // 步骤 1：列现有机器人（MCP 工具 list_bots）
  const bots = await api<Bot[]>('GET', '/api/v1/bots');
  console.log(`找到 ${bots.length} 个机器人`);

  // 步骤 2：创建流水线（MCP 工具 create_pipeline）
  const pipeline = await api<Pipeline>('POST', '/api/v1/pipelines', {
    name: `automated-pipeline-${Date.now()}`,
    description: '自动化工作流创建的示例流水线',
  });
  console.log(`已创建流水线: ${pipeline.name} (${pipeline.uuid ?? pipeline.id})`);

  // 步骤 3：若存在机器人，把流水线绑定到第一个机器人（MCP 工具 update_bot）
  if (bots.length > 0) {
    const bot = bots[0];
    await api('PUT', `/api/v1/bots/${bot.uuid ?? bot.id}`, {
      ...bot,
      pipeline_uuid: pipeline.uuid ?? pipeline.id, // 绑定字段以 get_bot 返回结构为准
    });
    console.log(`机器人 ${bot.name} 已绑定流水线 ${pipeline.name}`);
  } else {
    console.log('工作区内没有机器人，跳过绑定步骤');
  }

  // 步骤 4：验证（MCP 工具 get_pipeline）
  const check = await api<Pipeline>('GET', `/api/v1/pipelines/${pipeline.uuid ?? pipeline.id}`);
  console.log(`✅ 工作流完成，流水线 ${check.name} 已就绪`);
}

main().catch((e) => {
  console.error('❌ 工作流失败:', e.message);
  process.exit(1);
});
```

> 注意：机器人→流水线的绑定字段以 `get_bot` 返回的真实结构为准；不同版本的 LangBot 字段名可能不同。先 `GET /api/v1/bots/{uuid}` 看一眼再写 `update_bot` 请求体，不要照抄上面的 `pipeline_uuid`。

## 在 Codex CLI 里做同样的事（交互式）

不需要写脚本时，把 LangBot 注册进 Codex 后直接说人话：

```text
$ codex mcp add langbot --url http://localhost:5300/mcp --header "Authorization: Bearer <key>"
$ codex
> 看看我工作区里有几个机器人，叫什么名字          # -> list_bots
> 帮我建一个叫 marketing-batch 的流水线            # -> create_pipeline
> 最近 50 条 LLM 调用里最慢的是哪条，为什么        # -> get_monitoring_records + get_monitoring_details
> 把 1234-abcd 这个机器人的会话上下文清掉          # -> reset_session_context
```

## 注意事项

1. **HTTP 路径以当前 LangBot 实现为准**：脚本里的 `/api/v1/...` 路径写自 `src/langbot/pkg/api/http/controller/groups/`。如果 LangBot 升级后路径变了，以实际 API 文档 / 面板为准。
2. **认证**：`X-API-Key` 头或 `Authorization: Bearer <key>`，两者等价；密钥可以是 Web UI 的 `lbk_...` 用户密钥，或 `config.yaml` 的全局 Key。
3. **安全**：不要把真实 API 密钥写进提交到版本库的文件。脚本一律从环境变量读。
4. **MCP 与 HTTP 同源**：LangBot 的 MCP 工具直接调用 HTTP 服务层，不经过网络二次调用，所以行为一致；但 MCP 只暴露精选工具子集，不是全部 ~25 个 HTTP 路由组。

## 扩展

- 把常用工作流封装成独立 CLI，或直接使用 `lbctl`（LangBot 官方 CLI，走 Service API）
- 集成进 CI/CD：CI 里跑 LangBot 实例 + API Key 注入，再执行上面的脚本
- 需要插件安装 / 市场操作时，走插件市场 UI 或 `lbctl`，MCP 服务器不提供这些工具
