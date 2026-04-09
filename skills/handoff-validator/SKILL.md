# handoff-validator Skill

> **作用**：校验 Handoff Artifact 格式，确保交接正确
> **触发**：每次 Handoff 发送前
> **版本**：v1.0

---

## 一、Artifact Schema 定义

### 1.1 handoff_demand

```json
{
  "artifact_type": "handoff_demand",
  "version": "1.0",
  "timestamp": "2026-04-08T17:47:00+08:00",
  "from_agent": "ceo",
  "to_agent": "product",
  "content": {
    "demand_id": "DM-001",
    "source": "user|system|iteration",
    "original_text": "用户原始需求描述",
    "demand_type": "new_project|feature_add|bug_fix|iteration",
    "priority": "p0|p1|p2",
    "constraints": {
      "timeline": "预期时间",
      "budget": "预算限制",
      "tech": "技术约束"
    }
  },
  "validation": {
    "required_fields": ["artifact_type", "version", "from_agent", "to_agent", "content"],
    "validated": false,
    "errors": []
  },
  "next_action_required": "product_analyzes_and_responds"
}
```

### 1.2 handoff_prd

```json
{
  "artifact_type": "handoff_prd",
  "version": "1.0",
  "timestamp": "2026-04-08T17:47:00+08:00",
  "from_agent": "product",
  "to_agent": "ceo",
  "content": {
    "project_name": "项目名称",
    "summary": "一段话描述解决的问题",
    "user_stories": {
      "p0": ["P0用户故事"],
      "p1": ["P1用户故事"],
      "p2": ["P2用户故事"]
    },
    "features": {
      "p0": [{"name": "功能名", "description": "描述", "acceptance_criteria": "验收标准"}],
      "p1": [],
      "p2": []
    },
    "out_of_scope": ["不在范围内的功能"],
    "constraints": {"timeline": "", "budget": ""},
    "market_analysis": {"target_users": "", "market_size": ""},
    "competitor_analysis": {"competitors": [], "differentiators": []}
  },
  "validation": {
    "required_fields": ["artifact_type", "version", "from_agent", "to_agent", "content", "content.project_name", "content.features"],
    "validated": false,
    "validated_by": "",
    "errors": []
  },
  "quality_gate": {
    "status": "ready_for_review"
  },
  "next_action_required": "ceo_reviews_and_confirms"
}
```

### 1.3 handoff_tech_design

```json
{
  "artifact_type": "handoff_tech_design",
  "version": "1.0",
  "timestamp": "2026-04-08T17:47:00+08:00",
  "from_agent": "developer",
  "to_agent": "ceo",
  "content": {
    "project_name": "项目名称",
    "tech_stack": {
      "framework": "Flutter",
      "backend": "Supabase",
      "dependencies": ["package1", "package2"]
    },
    "architecture": "架构描述",
    "modules": [
      {"name": "模块名", "responsibility": "职责", "files": ["file1.dart"]}
    ],
    "database": {"tables": []},
    "api_design": {"endpoints": []},
    "file_structure": "目录结构"
  },
  "validation": {
    "required_fields": ["artifact_type", "version", "from_agent", "to_agent", "content", "content.tech_stack", "content.architecture"],
    "validated": false,
    "errors": []
  },
  "quality_gate": {
    "status": "ready_for_development"
  },
  "next_action_required": "ceo_confirms_and_dispatches"
}
```

### 1.4 handoff_code

```json
{
  "artifact_type": "handoff_code",
  "version": "1.0",
  "timestamp": "2026-04-08T17:47:00+08:00",
  "from_agent": "developer",
  "to_agent": "tester",
  "content": {
    "project_name": "项目名称",
    "files_changed": ["file1.dart", "file2.dart"],
    "new_files": ["file3.dart"],
    "deleted_files": [],
    "self_test_results": {
      "compile": "pass|fail",
      "unit_tests": {"total": 10, "passed": 9, "failed": 1},
      "integration_tests": {"total": 5, "passed": 5, "failed": 0}
    },
    "test_coverage": "80%",
    "known_issues": [{"issue": "描述", "severity": "S0|S1|S2|S3", "workaround": "解决方案"}],
    "deployment_notes": "部署说明"
  },
  "validation": {
    "required_fields": ["artifact_type", "version", "from_agent", "to_agent", "content", "content.self_test_results"],
    "validated": false,
    "errors": []
  },
  "quality_gate": {
    "status": "ready_for_testing"
  },
  "next_action_required": "tester_starts_testing"
}
```

### 1.5 handoff_test_report

```json
{
  "artifact_type": "handoff_test_report",
  "version": "1.0",
  "timestamp": "2026-04-08T17:47:00+08:00",
  "from_agent": "tester",
  "to_agent": "ceo",
  "content": {
    "project_name": "项目名称",
    "test_date": "2026-04-08",
    "test_summary": {
      "total_cases": 50,
      "passed": 45,
      "failed": 5,
      "pass_rate": "90%"
    },
    "p0_test_results": [
      {"feature": "功能名", "cases": 10, "passed": 10, "failed": 0, "status": "pass|fail"}
    ],
    "bugs": [
      {
        "id": "BUG-001",
        "severity": "S0|S1|S2|S3",
        "description": "描述",
        "steps_to_reproduce": ["步骤1", "步骤2"],
        "expected": "预期结果",
        "actual": "实际结果",
        "status": "open|fixed|verified"
      }
    ],
    "quality_score": "8/10",
    "recommendation": "can_deliver|need_fix|cannot_deliver"
  },
  "validation": {
    "required_fields": ["artifact_type", "version", "from_agent", "to_agent", "content", "content.test_summary", "content.bugs"],
    "validated": false,
    "errors": []
  },
  "quality_gate": {
    "status": "ready_for_delivery"
  },
  "next_action_required": "ceo_reviews_and_delivers"
}
```

---

## 二、校验规则

### 2.1 必须字段校验

```python
def validate_required_fields(artifact, schema):
    """校验必填字段"""
    errors = []
    required = schema["required_fields"]
    
    for field in required:
        if field not in artifact:
            errors.append(f"Missing required field: {field}")
    
    return errors
```

### 2.2 类型校验

```python
def validate_types(artifact):
    """校验字段类型"""
    errors = []
    
    # version 必须是字符串
    if "version" in artifact and not isinstance(artifact["version"], str):
        errors.append("version must be string")
    
    # timestamp 必须是 ISO 格式
    if "timestamp" in artifact:
        try:
            datetime.fromisoformat(artifact["timestamp"].replace("Z", "+00:00"))
        except:
            errors.append("timestamp must be ISO format")
    
    # from_agent 和 to_agent 必须是已知 Agent
    known_agents = ["ceo", "product", "developer", "tester"]
    if artifact.get("from_agent") not in known_agents:
        errors.append(f"Unknown from_agent: {artifact.get('from_agent')}")
    if artifact.get("to_agent") not in known_agents:
        errors.append(f"Unknown to_agent: {artifact.get('to_agent')}")
    
    return errors
```

### 2.3 内容校验

```python
def validate_content(artifact):
    """校验 content 内容"""
    errors = []
    content = artifact.get("content", {})
    artifact_type = artifact.get("artifact_type")
    
    if artifact_type == "handoff_prd":
        if "features" not in content:
            errors.append("PRD must have features")
        elif not content["features"].get("p0"):
            errors.append("PRD must have at least one P0 feature")
    
    elif artifact_type == "handoff_code":
        if "self_test_results" not in content:
            errors.append("Code handoff must have self_test_results")
        elif content["self_test_results"].get("compile") == "fail":
            errors.append("Cannot deliver code that fails to compile")
    
    elif artifact_type == "handoff_test_report":
        if content.get("recommendation") == "cannot_deliver":
            errors.append("Test report recommends cannot deliver")
    
    return errors
```

---

## 三、校验执行

### 3.1 发送前校验

```markdown
## Handoff 发送流程

1. Agent 生成 Artifact
2. 执行 handoff-validator 校验
3. 如有错误：
   - 返回错误信息
   - 要求 Agent 修复
4. 如无错误：
   - 设置 validated: true
   - 添加 validated_by
   - 发送 Artifact
```

### 3.2 接收后确认

```markdown
## Handoff 接收流程

1. 接收 Artifact
2. 再次校验格式
3. 检查字段完整性
4. 如有问题：
   - 拒绝接收
   - 要求重新发送
5. 如无问题：
   - 确认接收
   - 开始处理
```

---

## 四、错误处理

### 4.1 校验失败响应

```json
{
  "validation": {
    "validated": false,
    "errors": [
      "Missing required field: content.features",
      "version must be string"
    ],
    "rejected_at": "2026-04-08T17:47:00+08:00",
    "message": "Handoff rejected. Please fix errors and resend."
  }
}
```

### 4.2 回退机制

```markdown
## 回退流程

当 Handoff 失败时：

1. 记录失败原因
   → artifacts/history/failed_[type]_[timestamp].json

2. 恢复上一状态
   → 读取上一个 valid artifact

3. 通知发送方
   → "Handoff 校验失败：
      错误：[列表]
      请修复后重新发送"

4. 保留失败记录
   → 用于后续分析和改进
```

---

## 五、验证输出格式

```markdown
## ✅ Handoff 校验通过

```
Artifact: handoff_prd
Version: 1.0
From: product → To: ceo
Validated: ✅ 通过
Validated by: system
Time: 2026-04-08 17:47:00

Content Summary:
- Project: 项目名称
- P0 Features: 3
- P1 Features: 5
- P2 Features: 2

Next Action: CEO reviews and confirms
```

---

## 六、版本历史

- v1.0（2026-04-08）：初始版本
