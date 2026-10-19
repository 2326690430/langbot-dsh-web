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