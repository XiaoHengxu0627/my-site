import type { ContentState, LocalizedString } from './content'

function extractBullet(
  item: { bullets?: LocalizedString[]; bulletsZh?: string[]; bulletsEn?: string[] },
  locale: 'zh' | 'en',
): string[] {
  if (item.bullets && item.bullets.length > 0) {
    return item.bullets.map((b) => (locale === 'en' ? b.en : b.zh))
  }
  return []
}

export function buildUserProjectContext(
  state: ContentState,
  locale: 'zh' | 'en',
): string {
  if (state.status !== 'ready') return ''
  const isZh = locale === 'zh'

  if (!isZh) {
    return [
      '## Project A [Recommendation Strategy]',
      '- Meituan Smart Merchant AI Chat Revamp',
      '- Layered recommendation: first-screen dynamic priority (store status driven),',
      '  dialogue recommendation (intent prediction + cold-start fallback)',
      '- Key tradeoff: dropped full-tag recommendation, focused on few high-priority scenarios with rule-based approach;',
      '  kept free-text input instead of fully enclosed click-based dialogue',
      '',
      '## Project B [Evaluation System]',
      '- Xiaomi Collision Accident AI Evaluation System',
      '- Four-layer assessment: Safety / Factual / Task / Value layers',
      '- Intent-driven adversarial evaluation set',
      '- Key design: use rules to bound reasoning, then multi-modal model for automated judgment',
      '',
      '## Project C [Data Portal]',
      '- Vehicle Data Unified Platform',
      '- Converged 42 dashboards into 9 themes (by business value / usage frequency / data accuracy)',
      '- Built term-field semantic mapping for ChatBI natural language querying',
      '',
      '## Project D [Experience Design]',
      '- Workplace mental health multi-sensory therapeutic product',
      '- Decomposed biophilic theory into interactive sensory components (touch/smell/hearing/sight)',
    ].join('\n')
  }

  return [
    '## 项目A【推荐策略】',
    '- 美团智能掌柜 AI 会话改版',
    '- 分层推荐策略：首屏动态优先级推荐（商家经营状态驱动），',
    '  对话推荐问（意图预测 + 冷启动兜底）',
    '- 关键权衡：放弃全标签推荐，聚焦少数高优场景做规则化；',
    '  保留输入框，没做全封闭点选式对话',
    '',
    '## 项目B【评测体系】',
    '- 小米碰撞事故 AI 评测体系',
    '- 四层评估框架：安全层 / 事实层 / 任务层 / 价值层',
    '- 意图驱动的对抗性评测集',
    '- 关键设计：先用规则约束推理边界，再用多模态模型做自动化判定',
    '',
    '## 项目C【数据门户】',
    '- 整车数据统一平台',
    '- 42 个看板按业务价值 / 使用频率 / 数据准确性收敛成 9 大专题',
    '- 建术语 - 字段语义映射实现 ChatBI 自然语言取数',
    '',
    '## 项目D【体验设计】',
    '- 职场心理健康多感官疗愈产品',
    '- 把亲生物理论拆成可交互的感官组件（触觉/嗅觉/听觉/视觉四层叠加）',
  ].join('\n')
}

export function buildSystemPrompt(
  state: ContentState,
  locale: 'zh' | 'en',
): string {
  if (state.status !== 'ready') return ''

  const site = state.site
  const sections = site.pages.about.resumeSections || []
  const projects = state.projects || []
  const isZh = locale === 'zh'

  const lines: string[] = []

  if (isZh) {
    lines.push(`# 关于肖蘅栩 Hank 的知识库`)

    lines.push(`\n## 基本信息`)
    lines.push(`- 姓名：肖蘅栩（Hank Xiao）`)
    lines.push(`- 简介：${site.pages.about.body}`)
    lines.push(`- 邮箱：${site.pages.contact.email}`)
    lines.push(`- 个人标签：${site.pages.about.personalTags?.join('、') || ''}`)

    lines.push(`\n## 教育经历`)
    const eduSection = sections.find((s) => s.title?.zh?.includes('教育'))
    if (eduSection) {
      for (const item of eduSection.items) {
        const time = item.time ? `（${item.time.zh}）` : ''
        lines.push(`- ${item.title.zh} ${time}`)
      }
    }

    lines.push(`\n## 工作经历`)
    const workSection = sections.find((s) => s.title?.zh?.includes('工作'))
    if (workSection) {
      for (const item of workSection.items) {
        const dept = locale === 'zh' && item.dept ? item.dept.zh : item.dept?.en || ''
        const title = locale === 'zh' ? item.title.zh : item.title.en
        const time = item.time ? `（${item.time.zh}）` : ''
        const desc = item.description ? item.description.zh : ''

        lines.push(`\n### ${dept} | ${title} ${time}`)
        if (desc) lines.push(`背景：${desc}`)

        if (item.productDetails && item.productDetails.length > 0) {
          lines.push(`\n负责产品：`)
          for (const pd of item.productDetails) {
            const name = locale === 'zh' ? pd.name.zh : pd.name.en
            const info = locale === 'zh' ? pd.info.zh : pd.info.en
            lines.push(`- ${name}：${info.replace(/\*\*/g, '').replace(/\n/g, ' ')}`)
          }
        }

        const bullets = extractBullet(item, locale)
        if (bullets.length > 0) {
          lines.push(`\n核心成果：`)
          for (const b of bullets) {
            lines.push(`- ${b}`)
          }
        }
      }
    }

    lines.push(`\n## 联系与社交`)
    lines.push(`- 邮箱：${site.pages.contact.email}`)
    for (const s of site.footer.socials) {
      lines.push(`- ${s.label}：${s.href}`)
    }

    lines.push(`\n## 设计作品`)
    if (projects.length > 0) {
      for (const p of projects) {
        const awards = p.awards
          ?.map((a) => a.zh)
          .join('；')
        lines.push(`\n### ${p.title.zh}（${p.subtitle.zh}）${p.year ? `- ${p.year}` : ''}`)
        lines.push(`简介：${p.description.zh}`)
        if (awards) lines.push(`荣誉：${awards}`)
      }
    }

    lines.push(`\n## 回答准则`)
    lines.push(`1. 你是 Hank 的专属 AI 助手，用第一人称"我"回复。例如开头说"我是 Hank 的专属助手..."。`)
    lines.push(`2. 回答时优先使用中文，除非对方用英文提问。`)
    lines.push(`3. **回答格式要求**：`)
    lines.push(`   - 使用分点论述（1. 2. 3. 或 - 列表）`)
    lines.push(`   - 关键数据、产品名、指标用**加粗**突出`)
    lines.push(`   - 段落清晰简短，每段不超过 3 行`)
    lines.push(`   - 重要结论放在开头`)
    lines.push(`4. 当被问到具体产品（智能掌柜、整车大数据门户、游戏助手）时，除了文字说明，还可以提示对方点击快捷标签查看详情和图片。`)
    lines.push(`5. 对于模糊问题（如"他做过什么"、"有什么成绩"），选择最有代表性的 2-3 个成果回答。`)
    lines.push(`6. 保持简洁、准确、专业，突出可量化的业务影响。`)
    lines.push(`7. 如果不知道答案，坦诚说不知道，不要编造。`)
  } else {
    lines.push(`# Knowledge Base: Hank Xiao (肖蘅栩)`)

    lines.push(`\n## Basic Info`)
    lines.push(`- Name: Hank Xiao (肖蘅栩)`)
    lines.push(`- Bio: ${site.pages.about.body}`)
    lines.push(`- Email: ${site.pages.contact.email}`)
    lines.push(`- Personal Tags: ${site.pages.about.personalTags?.join(', ') || ''}`)

    lines.push(`\n## Education`)
    const eduSection = sections.find((s) => s.title?.en?.includes('Education'))
    if (eduSection) {
      for (const item of eduSection.items) {
        const time = item.time ? ` (${item.time.en})` : ''
        lines.push(`- ${item.title.en}${time}`)
      }
    }

    lines.push(`\n## Work Experience`)
    const workSection = sections.find((s) => s.title?.en?.includes('Experience'))
    if (workSection) {
      for (const item of workSection.items) {
        const dept = item.dept?.en || ''
        const title = item.title.en
        const time = item.time ? ` (${item.time.en})` : ''
        const desc = item.description ? item.description.en : ''

        lines.push(`\n### ${dept} | ${title} ${time}`)
        if (desc) lines.push(`Scope: ${desc}`)

        if (item.productDetails && item.productDetails.length > 0) {
          lines.push(`\nProducts:`)
          for (const pd of item.productDetails) {
            const name = pd.name.en
            const info = pd.info.en
            lines.push(`- ${name}: ${info.replace(/\*\*/g, '').replace(/\n/g, ' ')}`)
          }
        }

        const bullets = extractBullet(item, locale)
        if (bullets.length > 0) {
          lines.push(`\nKey Results:`)
          for (const b of bullets) {
            lines.push(`- ${b}`)
          }
        }
      }
    }

    lines.push(`\n## Contact & Social`)
    lines.push(`- Email: ${site.pages.contact.email}`)
    for (const s of site.footer.socials) {
      lines.push(`- ${s.label}: ${s.href}`)
    }

    lines.push(`\n## Design Works`)
    if (projects.length > 0) {
      for (const p of projects) {
        const awards = p.awards
          ?.map((a) => a.en)
          .join('; ')
        lines.push(`\n### ${p.title.en} (${p.subtitle.en}) ${p.year ? `- ${p.year}` : ''}`)
        lines.push(`Description: ${p.description.en}`)
        if (awards) lines.push(`Awards: ${awards}`)
      }
    }

    lines.push(`\n## Response Guidelines`)
    lines.push(`1. You are Hank's dedicated AI assistant. Respond in first person ("I am Hank's assistant...").`)
    lines.push(`2. Answer in English when asked in English.`)
    lines.push(`3. **Formatting rules**:`)
    lines.push(`   - Use numbered or bulleted lists`)
    lines.push(`   - Use **bold** for key metrics, product names, and highlights`)
    lines.push(`   - Keep paragraphs short (max 3 lines each)`)
    lines.push(`   - Put the key takeaway first`)
    lines.push(`4. When asked about specific products (Smart Merchant Assistant, Vehicle Big Data Portal, Game Assistant), direct users to click the quick tags for details and images.`)
    lines.push(`5. For vague questions (e.g. "what has he done"), pick 2-3 representative achievements.`)
    lines.push(`6. Be concise, accurate, and professional. Highlight measurable business impact.`)
    lines.push(`7. If you don't know the answer, be honest.`)
  }

  return lines.join('\n')
}

export function buildSuggestionQuestions(
  state: ContentState,
  locale: 'zh' | 'en',
): string[] {
  if (state.status !== 'ready') return []

  if (locale === 'zh') {
    return [
      'Hank 做过哪些产品？',
      '他在美团做出了什么成果？',
      'Hank 有什么设计作品？',
    ]
  }

  return [
    'What products has Hank built?',
    'What did Hank achieve at Meituan?',
    'What design works has Hank created?',
  ]
}

const followUpMap: { zh: Record<string, string[]>; en: Record<string, string[]> } = {
  zh: {
    '智能掌柜': ['智能掌柜有哪些核心功能？', '掌柜会话页改版有什么成果？'],
    '掌柜会话': ['智能掌柜有哪些核心功能？', '同行 PK 策略优化做了什么？'],
    '美团': ['他在美团做出了什么成果？', '智能掌柜有哪些核心功能？'],
    '付费': ['付费链路重构有什么效果？', '智能掌柜有哪些核心功能？'],
    'PK': ['同行 PK 策略优化做了什么？', '智能掌柜有哪些核心功能？'],
    '对话评测': ['AI 对话评测系统是怎样的？', '智能掌柜有哪些核心功能？'],
    '小米': ['整车大数据门户解决了什么问题？', 'ChatBI 模块是什么？'],
    '整车大数据': ['整车大数据门户解决了什么问题？', 'ChatBI 模块是什么？'],
    'ChatBI': ['ChatBI 模块是什么？', '碰撞事故自动化有什么成果？'],
    '碰撞': ['碰撞事故自动化有什么成果？', 'C 端安全分产品是什么？'],
    '安全分': ['C 端安全分产品是什么？', '整车大数据门户解决了什么问题？'],
    'OPPO': ['键鼠映射有什么成果？', '游戏助手体验优化做了什么？'],
    '游戏助手': ['键鼠映射有什么成果？', '游戏助手体验优化做了什么？'],
    '键鼠': ['键鼠映射有什么成果？', '游戏助手体验优化做了什么？'],
    '城市绿洲': ['城市绿洲获得了什么荣誉？', '万安记忆是什么作品？'],
    '万安': ['万安记忆是什么作品？', '城市绿洲获得了什么荣誉？'],
    '量化自我': ['量化自我是什么作品？', '自然生长数字艺术是什么？'],
    'EquiSeam': ['EquiSeam 是做什么的？', '城市绿洲获得了什么荣誉？'],
    '自然生长': ['自然生长数字艺术是什么？', '量化自我是什么作品？'],
    '教育': ['Hank 的教育背景是什么？', '他在美团做出了什么成果？'],
    '专利': ['Hank 有哪些专利？', '城市绿洲获得了什么荣誉？'],
    '作品': ['Hank 有什么设计作品？', '城市绿洲获得了什么荣誉？'],
    '产品': ['Hank 做过哪些产品？', '智能掌柜有哪些核心功能？'],
    '经历': ['Hank 做过哪些产品？', '他的教育背景是什么？'],
  },
  en: {
    'Smart Merchant': ['What are the core features of Smart Manager?', 'What were the results of the chat revamp?'],
    'Meituan': ['What did Hank achieve at Meituan?', 'What are the core features of Smart Manager?'],
    'Vehicle Data': ['What problems did the Vehicle Data Portal solve?', 'What is ChatBI?'],
    'Xiaomi': ['What problems did the Vehicle Data Portal solve?', 'What is ChatBI?'],
    'ChatBI': ['What is ChatBI?', 'What were the crash automation results?'],
    'crash': ['What were the crash automation results?', 'What is the consumer safety score product?'],
    'OPPO': ['What were the key-mouse mapping results?', 'What game assistant improvements were made?'],
    'Game Assistant': ['What were the key-mouse mapping results?', 'What game assistant improvements were made?'],
    'Urban Oasis': ['What awards did Urban Oasis win?', 'What is Wanan Memory?'],
    'Wanan': ['What is Wanan Memory?', 'What awards did Urban Oasis win?'],
    'Quantified Self': ['What is Quantified Self?', 'What is Nature Growth Digital Art?'],
    'EquiSeam': ['What is EquiSeam?', 'What awards did Urban Oasis win?'],
    'patent': ['What patents does Hank have?', 'What awards did Urban Oasis win?'],
    'design': ['What design works has Hank created?', 'What awards did Urban Oasis win?'],
    'product': ['What products has Hank built?', 'What are Smart Manager core features?'],
    'education': ["What is Hank's educational background?", 'What products has Hank built?'],
  },
}

export function getFollowUpsForReply(
  reply: string,
  locale: 'zh' | 'en',
  defaultQuestions: string[],
): string[] {
  const map = followUpMap[locale] || followUpMap.zh
  const matched = new Set<string>()

  for (const [keyword, questions] of Object.entries(map)) {
    if (reply.includes(keyword)) {
      for (const q of questions) {
        if (!matched.has(q)) {
          if (matched.size >= 2) break
          matched.add(q)
        }
      }
    }
    if (matched.size >= 2) break
  }

  if (matched.size === 0) {
    return defaultQuestions.slice(0, 2)
  }

  return Array.from(matched)
}
