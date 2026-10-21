# 安全审计报告：本次变更集

**审计范围**：最近 5 次提交（HEAD~5..HEAD）——垃圾清理、Codex 文档修正、CLAUDE.md 符号链接、DSH 视觉重构
**审计日期**：2026-10-21
**方法**：威胁建模 → 定向扫描 → 分诊 → 修复 → 复扫验证

## 威胁模型（本变更集的攻击面）

| 资产 | 威胁 | 评估 |
|---|---|---|
| 新写的 Codex 文档（codex-cli-setup/mcp-examples/troubleshooting） | 文档内嵌真实 API 密钥被提交到仓库 | 全部使用 `<your-langbot-api-key>` 占位符，无真实密钥 |
| 示例脚本（examples/codex-langbot-integration/） | 硬编码凭据 | 一律从环境变量 `LANGBOT_API_KEY` 读取，无硬编码 |
| .gitignore 变更 | 误忽略导致敏感文件意外入库 | 新增 10 行全部针对垃圾文件模式（`langbot*.log`、`web/package-lock.json`、`=*` 等），无正常配置被误伤 |
| CLAUDE.md 符号链接 | 符号链接指向仓库外路径（符号链接投毒） | 目标为相对路径 `AGENTS.md`（仓库内），git blob 47dc3e3 内容为 `AGENTS.md`，无绝对路径 |
| DSH 视觉重构（global.css + 10 个 web 文件） | 引入 XSS sink、eval、document.write、第三方 CDN 资源 | 全部为 className/CSS 变量修改，无 DOM sink 新增 |
| 删除 install-plugin.sh | 其他文档残留引用指向不存在的文件（可用性，非安全） | 已修复 |

## 扫描结果

### 密钥泄露扫描
- 模式：`sk-[A-Za-z0-9]{16,}` / `ghp_` / `lbk_` / `xoxb-` / `AKIA[0-9A-Z]{16}`
- 范围：已提交 diff（HEAD~5..HEAD）+ 未提交工作树
- **结果：0 命中**

### 文档内密钥
- `docs/` 全目录命中 1 处：`docs/event-based-agents/adapters/slack.md:21` 的 `xoxb-...` 为 Slack 文档中"token 格式示例"（说明性文字，非真实 token）——非本次变更引入，排除。

### XSS / 代码注入 sink 扫描
- 范围：`web/src/` 全量 `.ts/.tsx`
- 模式：`dangerouslySetInnerHTML` / `innerHTML =` / `document.write` / `eval(` / `new Function(`
- **结果：0 命中**（基线：本仓库前端不使用这些 API）

### 第三方资源 / 供应链
- 本次变更未引入新的 npm 依赖、CDN 链接或远程脚本。
- `web/package-lock.json`（12k 行）已删除——pnpm 项目不应跟踪 npm lock，删除本身降低供应链混淆风险。

### 符号链接
- `CLAUDE.md`：git 存储 blob 为相对目标 `AGENTS.md`（9 字节），mode 120000。无绝对路径、无指向仓库外的 target。

## 分诊与修复

| # | 发现 | 严重度 | 处置 |
|---|---|---|---|
| F1 | `docs/superpowers/plans/2026-10-19-codex-cli-integration-plan.md:124` 仍引用已删除的 `install-plugin.sh` | 低（文档可用性） | 已在行尾标注"（已移除：…）"，提交 4f8c583 |

## 复扫确认（verify-fix）

- 全 `docs/` 目录重扫 `install-plugin` 引用：仅剩 1 处，为已标注"已移除"的说明行，无裸引用
- 密钥模式对已提交 + 未提交 diff 重扫：**0 命中**
- `web/src` 全量 sink 扫描：**0 命中**
- `git status`：无意外新文件；`=1.4.4` 等垃圾文件全部不在仓库

## 结论

本次变更集**未引入新增高危或中危安全风险**。唯一低危发现（F1 残留引用）已修复并复扫确认。

## 遗留观察（不在本次审计范围，仅供记录）

- `src/langbot/__main__.py` 未提交改动为 ASCII banner 的尾部空格清理，无安全影响
- `data/config.yaml` 的 `api.global_api_key` 字段若在生产环境设置为弱值或空值，则 `/mcp` 端点的鉴权强度取决于该值——此为部署配置问题，非代码缺陷
