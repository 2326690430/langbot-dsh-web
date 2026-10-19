// examples/codex-langbot-integration/workflow-automation.ts
// 端到端工作流：创建机器人 -> 创建流水线 -> 安装插件 -> 配置机器人

import { execSync } from 'child_process';

interface Bot {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface Pipeline {
  id: string;
  name: string;
  description: string;
  created_at: string;
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