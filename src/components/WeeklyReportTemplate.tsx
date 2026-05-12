import { BoldText } from '../lib/format'

const template = `
## 一、任务描述
- **任务名称**：文本排版 & Markdown 渲染优化
- **触发原因**：AI 模型返回的 \`**加粗**\` 标记符号在界面上以原文形式（\`**...**\`）直接展示，未渲染为视觉加粗效果，影响阅读体验
- **优化目标**：消除所有 \`*\` 符号的原文暴露，实现中文排版规范下的加粗、列表等格式正确渲染

## 二、问题分析
| 问题 | 影响范围 | 优先级 |
|------|---------|:------:|
| \`**加粗**\` 显示为原文 | 聊天气泡（bot/user）、周报卡片标题、卡片详情文本 | P0 |
| 行内 Markdown 解析缺失 | 全文无格式化渲染 | P1 |

### 根因
TypewriterText 和 WeeklyReportCard 直接输出 API 返回的原始字符串，未对 Markdown 标记做任何转换。

## 三、解决方案
- **方案 A**：正则替换 \`**text**\` → JSX \`<strong>text</strong>\`
  - 轻量、无额外依赖、不改后端
  - 覆盖 TypewriterText、用户气泡、周报卡片全部文本区域
- **方案 B**：接入完整 Markdown 解析器（unified/remark）
  - 支持更多格式（列表、标题等）
  - 改动量大，当期不考虑

### 选型决策 ✅ → 方案 A

## 四、实施步骤
1. 创建 \`src/lib/format.tsx\`：导出 \`renderBold()\` 和 \`<BoldText />\` 组件
2. 修改 \`TypewriterText\`：输入完成后切换为 \`<BoldText />\` 渲染
3. 修改用户气泡：直接使用 \`<BoldText />\`
4. 修改 \`WeeklyReportCard\`：标题、影响摘要、详情文本全部包裹 \`<BoldText />\`

## 五、完成标准
- [x] \`**加粗**\` 在聊天气泡中显示为 **加粗**
- [x] \`**加粗**\` 在周报卡片标题/内容中显示为 **加粗**
- [x] 打字动画阶段暂时显示 \`**\`，完成后自动切换为加粗
- [x] 新增代码通过 TypeScript 编译检查
- [x] 构建产物中无新增运行时错误

## 六、测试验证
| 测试项 | 预期结果 | 状态 |
|--------|---------|:----:|
| Bot 气泡含 \`**\` 的回复 | 打字完成后显示加粗 | ✅ |
| 用户气泡含 \`**\` 的回复 | 直接显示加粗 | ✅ |
| 周报卡片标题含 \`**\` | 显示加粗标题 | ✅ |
| 周报卡片详情含 \`**\` | 显示加粗文本 | ✅ |
| 无 \`**\` 的普通文本 | 无变化 | ✅ |
`

export default function WeeklyReportTemplate() {
  return (
    <div style={{ padding: '20px 0' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#fff',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 14,
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '0.3px',
        }}
      >
        📋 文本排版优化周报
      </div>
      <div
        style={{
          background: '#fff',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 12,
          padding: 18,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          lineHeight: 1.7,
          fontSize: 14,
          color: '#111',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        <BoldText text={template} />
      </div>
    </div>
  )
}
