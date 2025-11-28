#!/usr/bin/env node

/**
 * Clash 配置转换脚本
 * 用法: node convert.js [输入文件] [输出文件]
 * 示例: node convert.js config.yml config_new.yml
 */
import { readFileSync, writeFileSync } from "fs";
import { load, dump } from "js-yaml";

// 从 global.js 加载 main 函数
import globalJs from "./global.js";

// 解析命令行参数
const inputFile = process.argv[2] || "config.yml";
const outputFile = process.argv[3] || "config_new.yml";

console.log("📖 读取配置文件:", inputFile);

try {
  // 读取 YAML 文件
  const yamlContent = readFileSync(inputFile, "utf8");
  const config = load(yamlContent);

  console.log("✅ 配置文件解析成功");
  console.log("📊 原始代理数量:", config?.proxies?.length || 0);

  // 调用 main 函数处理配置
  console.log("🔧 正在处理配置...");
  const processedConfig = globalJs(config);

  console.log("✅ 配置处理完成");
  console.log("📊 处理后代理数量:", processedConfig?.proxies?.length || 0);
  console.log("📊 策略组数量:", processedConfig?.["proxy-groups"]?.length || 0);

  // 转换回 YAML
  const outputYaml = dump(processedConfig, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
  });

  // 写入输出文件
  writeFileSync(outputFile, outputYaml, "utf8");

  console.log("💾 新配置已保存到:", outputFile);
  console.log("✨ 转换完成！");
} catch (error) {
  console.error("❌ 错误:", error.message);
  process.exit(1);
}
