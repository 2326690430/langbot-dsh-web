# Codex CLI 集成计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一个全面的安装和配置指南，帮助用户将OpenAI Codex CLI与LangBot集成，以便通过模型上下文协议（MCP）和CLI工具实现对LangBot功能的程序化访问。

**Architecture:** 此计划建立Codex CLI与LangBot之间的双向集成：
- Codex CLI可以通过LangBot的MCP服务器管理机器人、流水线和插件
- LangBot可以通过其现有的ChatGPT登录集成利用Codex作为LLM提供者

**Tech Stack:** OpenAI Codex CLI, LangBot MCP服务器, LangBot CLI (lbctl), Python, Docker (optional)

**Spec:** 基于文档审查的README.md, CODEX_SUBSCRIPTION.md, WEBSOCKET_README.md, 和源代码分析

## 全局约束
- Python 3.10-3.13 必须
- 必须保持现有LangBot功能不变
- Codex CLI 集成必须与LangBot的插件架构兼容
- 认证必须遵循LangBot的安全模型
- MCP服务器端点：`/mcp` (如README所述)

## 审查重点
- 认证流程复杂性用于程序化访问
- MCP服务器发现和连接程序
- 网络中断的错误处理
-  Codex和LangBot操作之间的权限边界
- 配置在会话间的持久性

---

### 任务1：文档分析和差距识别

**文件:**
- 读取: `docs/CODEX_SUBSCRIPTION.md`
- 读取: `docs/WEBSOCKET_README.md`
- 读取: `README.md` (MCP和CLI部分)
- 读取: `AGENTS.md`

**接口:**
- 消费: 现有文档结构
- 产生: Codex CLI集成差距分析报告

- [ ] **步骤1: 审查现有Codex文档**
  - 分析CODEX_SUBSCRIPTION.md了解当前能力
  - 识别缺少CLI/程序化访问的内容

- [ ] **步骤2: 检查MCP服务器文档**
  - 审查README.md了解MCP服务器详情
  - 检查AGENTS.md了解架构惯例

- [ ] **步骤3: 识别文档差距**
  - 缺少Codex CLI安装说明
  - 缺少编程化MCP连接示例
  - 缺少将Codex用作LangBot开发代理的指导

- [ ] **步骤4: 创建差距分析文档**
  - 文件: 创建: `docs/superpowers/gaps/codex-cli-integration-gaps.md`

- [ ] **步骤5: 提交**
  ```bash
  git add docs/superpowers/gaps/codex-cli-integration-gaps.md
  git commit -m "docs: 识别Codex CLI集成文档的差距"
  ```

### 任务2：创建Codex CLI安装指南

**文件:**
- 创建: `docs/codex-cli-setup.md`
- 修改: `docs/README.md:150-170` (在"Built for AI Agents"部分添加Codex CLI章节)

**接口:**
- 消费: 任务1的差距分析
- 产生: 安装指南和更新的README

- [ ] **步骤1: 大纲Codex CLI先决条件**
  - Node.js/npm用于Codex CLI安装
  - 运行中的LangBot实例
  - 有效的ChatGPT Plus/Enterprise订阅

- [ ] **步骤2: 记录Codex CLI安装**
  ```bash
  # 安装Codex CLI（如果尚未可用）
  npm install -g @openai/codex
  # 或通过其他方法
  ```

- [ ] **步骤3: 配置Codex以与LangBot MCP协同工作**
  - 解释如何发现LangBot的MCP服务器端点
  - 提供Codex的MCP配置示例
  - 展示如何将Codex连接到LangBot的`/mcp`端点

- [ ] **步骤4: 在README中添加Codex CLI章节**
  - 插入在"CLI (`lbctl`)"小节之后
  - 引用新的安装指南

- [ ] **步骤5: 创建使用示例**
  - 展示Codex命令用于列出LangBot机器人
  - 演示通过Codex管理流水线
  - 说明通过Codex安装插件

- [ ] **步骤6: 提交**
  ```bash
  git add docs/codex-cli-setup.md docs/README.md
  git commit -m "docs: 添加Codex CLI安装和集成指南"
  ```

### 任务3：开发MCP服务器连接示例

**文件:**
- 创建: `docs/codex-mcp-examples.md`
- 创建: `examples/codex-langbot-integration/` (目录)

**接口:**
- 消费: LangBot的MCP服务器规范
- 产生: Codex-MCP集成的实际示例

- [ ] **步骤1: 记录MCP端点发现**
  - 解释如何找到LangBot的MCP服务器URL
  - 提供curl/示例命令来测试连接

- [ ] **步骤2: 创建基础MCP交互示例**
  - 文件: 创建: `examples/codex-langbot-integration/list-bots.js`
  - 文件: 创建: `examples/codex-langbot-integration/create-pipeline.py`
  - 文件: 创建: `examples/codex-langbot-integration/install-plugin.sh`（已移除：LangBot MCP 服务器不暴露插件安装工具，该示例指向不存在的端点）

- [ ] **步骤3: 添加认证指导**
  - 解释如何将LangBot API密钥与Codex一起使用
  - 展示长时间会话的令牌管理

- [ ] **步骤4: 创建综合示例**
  - 文件: 创建: `examples/codex-langbot-integration/workflow-automation.ts`
  - 演示端到端的机器人管理工作流

- [ ] **步骤5: 提交**
  ```bash
  git add docs/codex-mcp-examples.md examples/codex-langbot-integration/
  git commit -m "docs: 添加Codex-MCP集成示例"
  ```

### 任务4：创建故障排除和最佳实践指南

**文件:**
- 创建: `docs/codex-cli-troubleshooting.md`
- 修改: `.claude/CODE_OF_CONDUCT.md:0` (添加对新指南的引用)

**接口:**
- 消费: 从测试中得出的常见集成问题
- 产生: 用户的故障排除资源

- [ ] **步骤1: 记录常见连接问题**
  - MCP服务器未找到错误
  - 认证失败
  - 权限被拒绝场景

- [ ] **步骤2: 提供调试技术**
  - 如何启用MCP协议日志
  - WebSocket连接的网络追踪
  - Codex CLI的verbose模式

- [ ] **步骤3: 建立最佳实践**
  - 推荐的配置模式
  - API密钥处理的安全考虑
  - 性能优化技巧

- [ ] **步骤4: 添加常见问题解答部分**
  - 解决社区中的常见问题
  - 澄清网页UI和CLI使用之间的区别

- [ ] **步骤5: 提交**
  ```bash
  git add docs/codex-cli-troubleshooting.md
  git commit -m "docs: 添加Codex CLI故障排除和最佳实践指南"
  ```

### 任务5：验证和测试集成指南

**文件:**
- 读取: 所有创建的文档
- 修改: `docs/SUMMARY.md` 或等效的目录文件（如果存在）

**接口:**
- 消费: 所有先前任务的输出
- 产生: 验证过的、测试过的文档套件

- [ ] **步骤1: 审查所有文档的一致性**
  - 检查术语一致性
  - 验证代码示例是否可用
  - 确保适当的交叉引用

- [ ] **步骤2: 在隔离环境中测试示例**
  - 创建测试LangBot实例
  - 验证Codex CLI能够连接并执行命令
  - 测试错误情况和恢复程序

- [ ] **步骤3: 更新项目文档索引**
  - 确保新指南可发现
  - 将其添加到主文档的相关部分

- [ ] **步骤4: 最终提交**
  ```bash
  git add docs/
  git commit -m "docs: 验证并完成Codex CLI集成文档"
  ```

**计划完成并保存至 `docs/superpowers/plans/2026-10-19-codex-cli-integration-plan.md`。请查看计划。您更倾向于哪种执行方式？**