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
      console.log(`   创建时间: ${bot.created_at || '未知'}`);
      console.log('');
    });
  }
} catch (error) {
  console.error('执行示例时出错:', error.message);
  process.exit(1);
}