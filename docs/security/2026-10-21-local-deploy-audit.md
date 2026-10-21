# 本地部署安全审计报告

**审计范围**：本地部署配置（vercel.json / .circleci/config.yml / 后端 CORS）+ 本次会话全部 web/ 变更
**审计日期**：2026-10-21
**方法**：threat-model → security-scan → triage-finding → fix-finding → verify-fix（按指定顺序手动执行；6 个命名 skill 本会话不可用）

## 威胁模型

| 资产 | 暴露面 | 评估 |
|---|---|---|
| 后端 5300（绑定 0.0.0.0） | 本机/LAN/公网 | CORS 配置 + API key 是主要控制点 |
| 前端 3000（Vite dev） | 仅开发用 | 不作为攻击面 |
| 部署文件（vercel.json/.circleci/.vercelignore） | 供应链 + 构建时凭据 | 需确认无硬编码 token |
| data/config.yaml（untracked） | 本地用户数据 | 不入 git、不入 Vercel |
| /mcp 端点 | 跨源 agent 接入 | API key 鉴权已生效（401 实测） |

## 扫描结果

### 密钥扫描
- 模式：sk-/ghp_/xoxb-/lbk_/AKIA
- 命中 1 处：`tests/unit_tests/platform/test_slack_eba_adapter.py:83` 的 `'xoxb-token'` —— 为测试 fixture 占位值（同文件 84 行 signing_secret 同为占位），**非真实凭据**，排除。
- 已提交 diff（含本次全部 web 变更）：**0 真实密钥**。

### 部署配置
- `vercel.json`：buildCommand 使用 `pnpm install --frozen-lockfile`（供应链受锁约束，正向）。无 token 硬编码。
- `.vercelignore`：排除 `data/`（用户内容/config 不上传 Vercel，正向）；`*.py`/src/ 不上传（后端不上 Vercel，符合"仅前端"）。
- `.circleci/config.yml`：部署步骤为占位 echo，token 经 `context: web-deploy` 注入（不在仓库中，正向）。

### CORS（唯一实质发现）
- `src/langbot/pkg/api/http/controller/main.py:79`：`quart_cors.cors(self.quart_app, allow_origin='*')` 对**全部路由**（含 service API）开放通配 origin。
- 与 `api.host: 0.0.0.0:5300` 叠加时：任意恶意网页可对本机 LangBot 发起跨域请求。数据保护仍依赖账户 token + API key（实测 /mcp 无凭证 401、service API 401），故**非直接数据泄漏**，但属放大攻击面的**中危**缺陷。

## 分诊

| # | 发现 | 严重度 | 处置 |
|---|---|---|---|
| F1 | CORS `allow_origin='*'` 对全部路由通配 | **中** | fix-finding：新增 `LANGBOT_CORS_ORIGINS` 环境变量，默认 `*`（保持本地/dev 行为不变），可逗号分隔限制 origin |
| F2 | xoxb-token 出现在测试 | 信息 | 排除（fixture 占位） |
| F3 | .vercelignore 排除 data/ | 信息 | 正向（无需修） |
| F4 | vercel 用 frozen-lockfile | 信息 | 正向（供应链受控） |

## 修复（fix-finding）

`main.py` 第 79 行改为：

```python
cors_origins = os.environ.get("LANGBOT_CORS_ORIGINS", "*").strip()
allow_origin: str | list[str] = (
    [o.strip() for o in cors_origins.split(",") if o.strip()]
    if cors_origins != "*"
    else "*"
)
quart_cors.cors(self.quart_app, allow_origin=allow_origin)
```

- 默认值 `*` → 本地/dev 行为**零变化**（向后兼容）。
- 生产暴露 5300 到 LAN/VPS 时，设 `LANGBOT_CORS_ORIGINS=http://127.0.0.1:3000,https://your-domain` 即可收紧。
- 未改路由/鉴权逻辑，仅 CORS 头配置。

## 验证（verify-fix）

- `ast.parse` + spec 加载：OK。
- 启动后端设 `LANGBOT_CORS_ORIGINS=http://127.0.0.1:3000` 实测：
  - 白名单 origin（127.0.0.1:3000）→ ACAO 回显该 origin（允许）
  - 恶意 origin（evil.example）→ ACAO 空（拒绝）
  - 修复生效。
- 复扫（rescan）：
  - 已提交 + 工作树 diff 密钥模式 → **0 新增高危**（唯一 xoxb 命中仍为测试 fixture）。
  - 跟踪的 `.env` 真实文件仅 `skills/skills/.env`（内容为 127.0.0.1 默认 URL，无密钥）。
  - 无新引入的内网资源、无新 sink（innerHTML/eval/document.write 仍为 0）。

## 结论

本地部署**无新增高危**。唯一中危发现（F1 CORS 通配）已通过 `LANGBOT_CORS_ORIGINS` 环境变量修复并实测验证；默认行为不变，生产暴露时可一键收紧。

## 遗留观察（非代码缺陷，供部署时注意）

- 生产暴露 5300 到公网时务必：设强 `api.global_api_key`（当前本地为空）+ 设 `LANGBOT_CORS_ORIGINS` + 用反代终结 TLS + 限制 5300 仅绑定内网。
- Vite dev server 仅作本地开发，勿直接对外。
