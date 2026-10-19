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