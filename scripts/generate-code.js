#!/usr/bin/env node
/**
 * generate-code.js
 * 代码生成器 - 自动生成重复代码
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];

const TEMPLATES = {
  // Flutter Model
  model: `class {{name}} {
  final String id;
  final DateTime createdAt;
  final DateTime updatedAt;

  {{name}}({
    required this.id,
    required this.createdAt,
    required this.updatedAt,
  });

  factory {{name}}.fromJson(Map<String, dynamic> json) {
    return {{name}}(
      id: json['id'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  {{name}} copyWith({
    String? id,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return {{name}}(
      id: id ?? this.id,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
`,

  // Flutter Repository
  repository: `class {{name}}Repository {
  final ApiClient _client;

  {{name}}Repository({ApiClient? client}) : _client = client ?? ApiClient();

  Future<List<{{name}}>> getAll({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _client.get('/{{lowercaseName}}', queryParameters: {
      'page': page,
      'limit': limit,
    });
    return (response.data['data'] as List)
        .map((json) => {{name}}.fromJson(json))
        .toList();
  }

  Future<{{name}}> getById(String id) async {
    final response = await _client.get('/{{lowercaseName}}/\$id');
    return {{name}}.fromJson(response.data);
  }

  Future<{{name}}> create({{name}} {{lowercaseName}}) async {
    final response = await _client.post(
      '/{{lowercaseName}}',
      data: {{lowercaseName}}.toJson(),
    );
    return {{name}}.fromJson(response.data);
  }

  Future<{{name}}> update({{name}} {{lowercaseName}}) async {
    final response = await _client.put(
      '/{{lowercaseName}}/\${ {{lowercaseName}}.id}',
      data: {{lowercaseName}}.toJson(),
    );
    return {{name}}.fromJson(response.data);
  }

  Future<void> delete(String id) async {
    await _client.delete('/{{lowercaseName}}/\$id');
  }
}
`,

  // Flutter Provider/State Management
  provider: `import 'package:flutter/foundation.dart';
import '../models/{{lowercaseName}}.model.dart';
import '../repositories/{{lowercaseName}}.repository.dart';

class {{name}}Provider extends ChangeNotifier {
  final {{name}}Repository _repository;

  {{name}}Provider({{{name}}Repository? repository})
      : _repository = repository ?? {{name}}Repository();

  List<{{name}}> _items = [];
  bool _isLoading = false;
  String? _error;

  List<{{name}}> get items => _items;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _items = await _repository.getAll();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> create({{name}} item) async {
    _isLoading = true;
    notifyListeners();

    try {
      final newItem = await _repository.create(item);
      _items.add(newItem);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> update({{name}} item) async {
    _isLoading = true;
    notifyListeners();

    try {
      final updatedItem = await _repository.update(item);
      final index = _items.indexWhere((i) => i.id == item.id);
      if (index != -1) {
        _items[index] = updatedItem;
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> delete(String id) async {
    try {
      await _repository.delete(id);
      _items.removeWhere((i) => i.id == id);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }
}
`,

  // Flutter Widget
  widget: `import 'package:flutter/material.dart';
import '../models/{{lowercaseName}}.model.dart';

class {{name}}Card extends StatelessWidget {
  final {{name}} {{lowercaseName}};
  final VoidCallback? onTap;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const {{name}}Card({
    super.key,
    required this.{{lowercaseName}},
    this.onTap,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      {{lowercaseName}}.id,
                      style: Theme.of(context).textTheme.titleMedium,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  PopupMenuButton<String>(
                    onSelected: (value) {
                      switch (value) {
                        case 'edit':
                          onEdit?.call();
                          break;
                        case 'delete':
                          onDelete?.call();
                          break;
                      }
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'edit',
                        child: Text('Edit'),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Text('Delete'),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Created: \${ {{lowercaseName}}.createdAt}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
`,

  // Test Template
  test: `import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/models/{{lowercaseName}}.model.dart';

void main() {
  group('{{name}} Model', () {
    test('fromJson creates valid model', () {
      final json = {
        'id': 'test-id',
        'created_at': '2026-04-09T12:00:00Z',
        'updated_at': '2026-04-09T12:00:00Z',
      };

      final model = {{name}}.fromJson(json);

      expect(model.id, 'test-id');
      expect(model.createdAt, isA<DateTime>());
      expect(model.updatedAt, isA<DateTime>());
    });

    test('toJson creates valid json', () {
      final model = {{name}}(
        id: 'test-id',
        createdAt: DateTime(2026, 4, 9, 12, 0, 0),
        updatedAt: DateTime(2026, 4, 9, 12, 0, 0),
      );

      final json = model.toJson();

      expect(json['id'], 'test-id');
      expect(json['created_at'], isA<String>());
      expect(json['updated_at'], isA<String>());
    });

    test('copyWith creates modified copy', () {
      final original = {{name}}(
        id: 'original-id',
        createdAt: DateTime(2026, 4, 9, 12, 0, 0),
        updatedAt: DateTime(2026, 4, 9, 12, 0, 0),
      );

      final copy = original.copyWith(id: 'new-id');

      expect(copy.id, 'new-id');
      expect(copy.createdAt, original.createdAt);
      expect(copy.updatedAt, original.updatedAt);
    });
  });
}
`,

  // API Client
  apiClient: `import 'package:dio/dio.dart';

class ApiClient {
  late final Dio _dio;

  ApiClient({String? baseUrl, String? token}) {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl ?? 'https://api.example.com/v1',
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer \$token',
      },
    ));

    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      error: true,
    ));
  }

  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    return _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(
    String path, {
    dynamic data,
  }) async {
    return _dio.post(path, data: data);
  }

  Future<Response> put(
    String path, {
    dynamic data,
  }) async {
    return _dio.put(path, data: data);
  }

  Future<Response> patch(
    String path, {
    dynamic data,
  }) async {
    return _dio.patch(path, data: data);
  }

  Future<Response> delete(String path) async {
    return _dio.delete(path);
  }
}
`
};

function generateCode(type, name, outputDir) {
  const template = TEMPLATES[type];
  if (!template) {
    console.log(`❌ Unknown template: ${type}`);
    console.log(`Available templates: ${Object.keys(TEMPLATES).join(', ')}`);
    return;
  }

  const lowercaseName = name.charAt(0).toLowerCase() + name.slice(1);
  const code = template
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{lowercaseName\}\}/g, lowercaseName);

  // 确定文件扩展名
  const extensions = {
    model: '.model.dart',
    repository: '.repository.dart',
    provider: '.provider.dart',
    widget: '.card.dart',
    test: '.test.dart',
    apiClient: '.api_client.dart'
  };

  const ext = extensions[type];
  const fileName = `${lowercaseName}${ext}`;
  const filePath = path.join(outputDir || '.', fileName);

  fs.writeFileSync(filePath, code);
  console.log(`✅ Generated: ${filePath}`);
}

function showHelp() {
  console.log(`
code-gen.js - 代码生成器

用法:
  node generate-code.js <template> <name> [output_dir]

模板:
  model       - 生成Flutter数据模型
  repository  - 生成Flutter仓库层
  provider    - 生成Flutter状态管理
  widget      - 生成Flutter卡片组件
  test        - 生成Flutter测试
  apiClient   - 生成API客户端

示例:
  # 生成用户模型
  node generate-code.js model User lib/models

  # 生成用户仓库
  node generate-code.js repository User lib/repositories

  # 生成用户Provider
  node generate-code.js provider User lib/providers

  # 生成完整模块（所有模板）
  node generate-code.js all User lib
`);
}

function generateAll(name, outputDir) {
  const types = ['model', 'repository', 'provider', 'widget', 'test', 'apiClient'];
  for (const type of types) {
    generateCode(type, name, outputDir);
  }
}

function main() {
  if (!command || command === 'help') {
    showHelp();
    return;
  }

  if (command === 'all') {
    const name = args[1];
    const outputDir = args[2];
    if (!name) {
      console.log('❌ Please specify a name');
      showHelp();
      return;
    }
    generateAll(name, outputDir);
    return;
  }

  const name = args[1];
  const outputDir = args[2];

  if (!name) {
    console.log('❌ Please specify a name');
    showHelp();
    return;
  }

  generateCode(command, name, outputDir);
}

main();
