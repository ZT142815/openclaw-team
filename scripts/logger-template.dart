/**
 * 日志模块模板
 * 
 * Flutter 项目集成方式：
 * 1. 复制此文件到 lib/core/logger.dart
 * 2. 在 main.dart 中初始化 Logger.init()
 * 3. 全局使用 logger.d/i/w/e()
 */

import 'package:flutter/foundation.dart';

enum LogLevel {
  debug,
  info,
  warning,
  error,
}

class Logger {
  static Logger? _instance;
  static bool _enableConsole = kDebugMode;
  static String? _remoteEndpoint;

  Logger._();

  static void init({
    bool enableConsole = kDebugMode,
    String? remoteEndpoint,
  }) {
    _instance = Logger._();
    _enableConsole = enableConsole;
    _remoteEndpoint = remoteEndpoint;
  }

  void _log(LogLevel level, String message, [Object? data]) {
    final timestamp = DateTime.now().toIso8601String();
    final levelStr = level.name.toUpperCase().padRight(7);
    final logMessage = '[$timestamp] $levelStr $message';

    if (_enableConsole) {
      switch (level) {
        case LogLevel.debug:
          debugPrint(logMessage);
          break;
        case LogLevel.info:
          debugPrint(logMessage);
          break;
        case LogLevel.warning:
          debugPrint(logMessage);
          break;
        case LogLevel.error:
          debugPrint(logMessage);
          break;
      }
    }

    // TODO: 发送到远程日志服务
    // if (_remoteEndpoint != null) {
    //   _sendToRemote(level, logMessage, data);
    // }
  }

  void d(String message, [Object? data]) => _log(LogLevel.debug, message, data);
  void i(String message, [Object? data]) => _log(LogLevel.info, message, data);
  void w(String message, [Object? data]) => _log(LogLevel.warning, message, data);
  void e(String message, [Object? data]) => _log(LogLevel.error, message, data);

  // 业务事件日志
  void logEvent(String eventName, Map<String, dynamic> properties) {
    _log(LogLevel.info, 'EVENT: $eventName', properties);
  }
}

// 全局实例
final logger = Logger._();
