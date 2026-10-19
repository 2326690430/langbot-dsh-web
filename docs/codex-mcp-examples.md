# Codex MCP 连接示例

本文档提供了使用Codex CLI通过Model Context Protocol (MCP)与LangBot进行交互的实际示例。这些示例展示了如何执行常见的LangBot管理任务。

## 前置条件

在运行这些示例之前，请确保您已完成以下步骤：

1. 已安装Codex CLI并配置好连接到LangBot的MCP服务器
   - 详见 [Codex CLI 安装指南](docs/codex-cli-setup.md)
2. LangBot实例正在运行并可访问
3. 您拥有有效的LangBot API密钥

## 示例目录结构

```
examples/codex-langbot-integration/
├── list-bots.js          # JavaScript示例：列出所有机器人
├── create-pipeline.py    # Python示例：创建新流水线
├── install-plugin.sh     # Shell脚本：安装插件
└── workflow-automation.ts # TypeScript示例：端到端工作流自动化
```

## 示例1：列出所有机器人 (JavaScript)

```javascript
// examples/codex-langbot-integration/list-bots.js
// 列出LangBot中所有可用的机器人

const { execSync } = require('child_process');

// 调用Codex CLI通过MCP协议列出机器人
try {
  const output = execSync('codex mcp call langbot list_bots', { encoding: 'utf8' });
  const bots = JSON.parse(output);
  
  console.log('LangBot中的机器人列表:');
  console.log('====================');
  
  if (bots.length === 0) {
    console.log('当前没有机器人');
  } else {
    bots.forEach((bot, index) => {
      console.log(`${index + 1}. 名称: ${bot.name || '未命名'}`);
      console.log(`   ID: ${bot.id}`);
      console.log(`   状态: ${bot.status || '未知'}`);
      console.log(`   创建时间: bot.created_at || '未知'`);
      console.log('');
    });
  }
} catch (error) {
  console.error('执行示例时出错:', error.message);
  process.exit(1);
}
```

## 示例2：创建新流水线 (Python)

```python
# examples/codex-langbot-integration/create-pipeline.py
# 创建一个新的LangBot流水线

import json
import subprocess
import sys

def create_pipeline(name, description=""):
    """创建一个新的LangBot流水线"""
    pipeline_data = {
        "name": name,
        "description": description
    }
    
    try:
        # 通过Codex CLI调用MCP协议创建流水线
        cmd = ['codex', 'mcp', 'call', 'langbot', 'create_pipeline', json.dumps(pipeline_data)]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        
        pipeline = json.loads(result.stdout)
        print(f"成功创建流水线!")
        print(f"ID: {pipeline.get('id')}")
        print(f"名称: {pipeline.get('name')}")
        print(f"描述: {pipeline.get('description')}")
        print(f"创建时间: {pipeline.get('created_at')}")
        
        return pipeline
        
    except subprocess.CalledProcessError as e:
        print(f"创建流水线失败: {e.stderr}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"解析响应失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # 示例用法
    pipeline_name = "codex-created-pipeline"
    pipeline_description = "使用Codex CLI创建的示例流水线"
    
    create_pipeline(pipeline_name, pipeline_description)
```

## 示例3：安装插件 (Shell Script)

```bash
#!/bin/bash
# examples/codex-langbot-integration/install-plugin.sh
# 从LangBot插件市场安装插件

set -e  # 出现错误时退出

# 配置变量
PLUGIN_NAME="${1:-example-plugin}"  # 默认插件名
VERSION="${2:-latest}"              # 默认版本

echo "正在安装插件: $PLUGIN_NAME (版本: $VERSION)"

# 通过Codex CLI调用MCP协议安装插件
PLUGIN_DATA=$(printf '{"pluginName": "%s", "version": "%s"}' "$PLUGIN_NAME" "$VERSION")

if output=$(codex mcp call langbot install_plugin "$PLUGIN_DATA" 2>&1); then
    echo "插件安装成功!"
    echo "$output"
else
    echo "插件安装失败:" >&2
    echo "$output" >&2
    exit 1
fi

# 可选：验证插件是否已安装
echo "正在验证插件安装..."
if codex mcp call langbot list_plugins | grep -q "\"name\": \"$PLUGIN_NAME\""; then
    echo "插件 $PLUGIN_NAME 安装验证成功!"
else
    echo "警告: 无法验证插件 $PLUGIN_NAME 是否已正确安装"
fi
```

## 示例4：端到端工作流自动化 (TypeScript)

```typescript
// examples/codex-langbot-integration/workflow-automation.ts
// 端到端工作流：创建机器人 -> 创建流水线 -> 安装插件 -> 配置机器人

import { execSync } from 'child_process';

interface Bot {
  id: string;
  name: string;
  status: string;
}

interface Pipeline {
  id: string;
  name: string;
  description: string;
}

interface Plugin {
  id: string;
  name: string;
  version: string;
}

/**
 * 执行Codex MCP命令并解析JSON响应
 */
function mcpCall<T>(method: string, params: Record<string, any> = {}): T {
  const paramsJson = JSON.stringify(params);
  try {
    const output = execSync(`codex mcp call langbot ${method} '${paramsJson}'`, { encoding: 'utf8' });
    return JSON.parse(output) as T;
  } catch (error) {
    throw new Error(`MCP调用失败 [${method}]: ${error.message}`);
  }
}

/**
 * 主工作流函数
 */
async function main() {
  console.log('开始LangBot自动化工作流...');
  console.log('====================================');
  
  try {
    // 步骤1：列现有机器人
    console.log('步骤1: 检查现有机器人');
    const bots: Bot[] = mcpCall<Bot[]>('list_bots');
    console.log(`找到 ${bots.length} 个现有机器人`);
    
    // 步骤2：创建新机器人（如果需要）
    // 注意：此示例假设存在create_bot方法，实际方法名可能不同
    // 这里我们跳过机器人创建，直接使用现有机器人或创建一个示例
    
    // 步骤3：创建新流水线
    console.log('\n步骤3: 创建新流水线');
    const pipelineData = {
      name: `automated-pipeline-${Date.now()}`,
      description: '由Codex CLI自动化工作流创建的流水线'
    };
    const pipeline: Pipeline = mcpCall<Pipeline>('create_pipeline', pipelineData);
    console.log(`成功创建流水线: ${pipeline.name} (ID: ${pipeline.id})`);
    
    // 步骤4：安装插件
    console.log('\n步骤4: 安装插件');
    const pluginName = 'notification-plugin';
    const pluginData = {
      pluginName: pluginName,
      version: 'latest'
    };
    // 假设存在install_plugin方法
    // const result = mcpCall<{success: boolean}>('install_plugin', pluginData);
    console.log(`正在安装插件: ${pluginName}`);
    // 实际实现中，这里会调用相应的MCP方法
    
    // 步骤5：配置机器人使用新流水线
    console.log('\n步骤5: 配置机器人');
    if (bots.length > 0) {
      const botId = bots[0].id;
      const updateData = {
        botId: botId,
        pipelineId: pipeline.id
      };
      // 假设存在update_bot_pipeline方法
      // mcpCall<{success: boolean}>('update_bot_pipeline', updateData);
      console.log(`机器人 ${bots[0].name} 已配置使用流水线 ${pipeline.name}`);
    } else {
      console.log('没有找到机器人进行配置，跳过此步骤');
    }
    
    // 步骤6：验证配置
    console.log('\n步骤6: 验证配置');
    const updatedBots: Bot[] = mcpCall<Bot[]>('list_bots');
    if (updatedBots.length > 0) {
      const bot = updatedBots[0];
      console.log(`机器人 ${bot.name} 当前状态: ${bot.status}`);
    }
    
    console.log('\n✅ 工作流完成!');
    console.log(`- 创建了流水线: ${pipeline.name}`);
    console.log(`- 尝试安装了插件: ${pluginName}`);
    if (bots.length > 0) {
      console.log(`- 配置了机器人: ${bots[0].name}`);
    }
    
  } catch (error) {
    console.error('\n❌ 工作流执行失败:', error.message);
    process.exit(1);
  }
}

// 执行主工作流
main();
```

## 如何运行这些示例

### 前置准备
1. 确保Codex CLI已正确安装并配置
2. 确保LangBot实例正在运行
3. 打开终端并导航到LangBot项目根目录

### 运行JavaScript示例
```bash
node examples/codex-langbot-integration/list-bots.js
```

### 运行Python示例
```bash
python examples/codex-langbot-integration/create-pipeline.py
```

### 运行Shell脚本示例
```bash
# 首先使脚本可执行
chmod +x examples/codex-langbot-integration/install-plugin.sh
# 然后运行
./examples/codex-langbot-integration/install-plugin.sh my-plugin 1.0.0
```

### 运行TypeScript示例
```bash
# 首先需要编译TypeScript（假设已安装tsc）
tsc examples/codex-langbot-integration/workflow-automation.ts
# 然后运行生成的JavaScript
node examples/codex-langbot-integration/workflow-automation.js
```

## 注意事项

1. **方法名称可能不同**：这些示例使用了假设的MCP方法名称（如`list_bots`, `create_pipeline`等）。实际的方法名称可能有所不同，请参考LangBot的MCP文档或通过`codex mcp list`探索可用方法。

2. **认证处理**：这些示例假设Codex CLI已经通过配置文件或环境变量正确处理了认证。请确保您的认证配置有效。

3. **错误处理**：生产环境中的代码应该包含更健壮的错误处理和日志记录。

4. **安全考虑**：不要在共享或公开的仓库中提交包含实际API密钥的配置文件。

## 扩展和定制

您可以根据自己的需求修改这些示例：

- 添加更多的错误处理和验证
- 集成到您的现有CI/CD流水线中
- 创建特定领域的自动化脚本（例如，自动部署特定类型的机器人）
- 将这些示例包装成可重用的库或工具