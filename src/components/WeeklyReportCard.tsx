import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BoldText } from '../lib/format'

interface SummaryItem {
  tag: string
  title: string
  impact: string
}

interface DetailItem {
  techBreakthrough: string
  performance: string
  scenarios: string
  commercialPotential: string
  userExperience: string
}

const tagColors: Record<string, { label: string; color: string; bg: string }> = {
  '多模态': { label: '多模态', color: '#7C3AED', bg: '#F5F3FF' },
  '大语言模型': { label: '大语言模型', color: '#2563EB', bg: '#EFF6FF' },
  'AI基础设施': { label: 'AI 基础设施', color: '#059669', bg: '#ECFDF5' },
  'AI应用落地': { label: 'AI 应用落地', color: '#D97706', bg: '#FFFBEB' },
  'default': { label: '前沿技术', color: '#6B7280', bg: '#F9FAFB' },
}

function parseContent(text: string): { summaries: SummaryItem[]; details: DetailItem[]; keywords: string[] } {
  const blocks = text.split(/\n(?=🔖)/)
  const summaries: SummaryItem[] = []
  const details: DetailItem[] = []

  for (const block of blocks) {
    if (!block.trim()) continue

    const tagMatch = block.match(/🔖\s*(.+)/)
    const titleMatch = block.match(/📌\s*\*{0,2}(.+?)\*{0,2}(?:\n|$)/)
    const impactMatch = block.match(/🎯\s*([\s\S]+?)(?=\n===DETAIL===|$)/)

    if (tagMatch) {
      summaries.push({
        tag: tagMatch[1].trim(),
        title: titleMatch ? titleMatch[1].trim() : '',
        impact: impactMatch ? impactMatch[1].trim() : '',
      })
    }

    if (block.includes('===DETAIL===')) {
      const detailSection = block.split('===DETAIL===').slice(1).join(' ')
      details.push({
        techBreakthrough: (detailSection.match(/🔬\s*\*{0,2}技术原理创新\*{0,2}[：:]\s*([\s\S]+?)(?=\n📈|$)/)?.[1] || '').trim(),
        performance: (detailSection.match(/📈\s*\*{0,2}性能指标提升\*{0,2}[：:]\s*([\s\S]+?)(?=\n🌍|$)/)?.[1] || '').trim(),
        scenarios: (detailSection.match(/🌍\s*\*{0,2}应用场景扩展\*{0,2}[：:]\s*([\s\S]+?)(?=\n💰|$)/)?.[1] || '').trim(),
        commercialPotential: (detailSection.match(/💰\s*\*{0,2}商业化潜力\*{0,2}[：:]\s*([\s\S]+?)(?=\n🎯|$)/)?.[1] || '').trim(),
        userExperience: (detailSection.match(/🎯\s*\*{0,2}用户体验变革\*{0,2}[：:]\s*([\s\S]+)/)?.[1] || '').trim(),
      })
    }
  }

  const keywordMatch = text.match(/本周关键词速览[：:]\s*(.+?)(?:\n|$)/)
  const keywords = keywordMatch
    ? keywordMatch[1].split(/[、，,\/\/]/).map((k) => k.trim()).filter(Boolean)
    : []

  return { summaries, details, keywords }
}

function DetailBlock({ detail }: { detail: DetailItem }) {
  const [expanded, setExpanded] = useState(false)
  const sections = [
    { icon: '🔬', label: '技术原理创新', value: detail.techBreakthrough },
    { icon: '📈', label: '性能指标提升', value: detail.performance },
    { icon: '🌍', label: '应用场景扩展', value: detail.scenarios },
    { icon: '💰', label: '商业化潜力', value: detail.commercialPotential },
    { icon: '🎯', label: '用户体验变革', value: detail.userExperience },
  ].filter((s) => s.value)

  if (sections.length === 0) return null

  return (
    <div className="weekly-detail-wrap">
      <button
        type="button"
        className={`weekly-expand-btn${expanded ? ' expanded' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <span>{expanded ? '收起深度分析' : '展开深度分析'}</span>
        <svg
          className="weekly-expand-icon"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          style={{ transform: expanded ? 'rotate(180deg)' : '' }}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className="weekly-detail-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="weekly-detail-inner">
              {sections.map((s, i) => (
                <div key={i} className="weekly-detail-item">
                  <div className="weekly-detail-item-head">
                    <span className="weekly-detail-item-icon">{s.icon}</span>
                    <span className="weekly-detail-item-label">{s.label}</span>
                  </div>
                  <div className="weekly-detail-item-text"><BoldText text={s.value} /></div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function WeeklyReportCard({ text }: { text: string }) {
  const { summaries, details, keywords } = useMemo(() => parseContent(text), [text])

  if (summaries.length === 0) {
    return <div className="weekly-report-text">{text}</div>
  }

  return (
    <div className="weekly-report-wrap">
      <div className="weekly-report-header">
        <span className="weekly-report-header-icon">📬</span>
        <span className="weekly-report-header-title">AI 前沿周报</span>
        <span className="weekly-report-header-badge">本周</span>
      </div>

      {summaries.map((item, i) => {
        const style = tagColors[item.tag] || tagColors.default
        const detail = details[i]

        return (
          <motion.div
            key={i}
            className="weekly-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.08 }}
          >
            <div className="weekly-card-head" style={{ borderLeftColor: style.color }}>
              <span className="weekly-card-tag" style={{ background: style.bg, color: style.color }}>
                {style.label}
              </span>
            </div>

            <div className="weekly-card-title"><BoldText text={item.title} /></div>

            <div className="weekly-card-impact">
              <span className="weekly-card-impact-icon">🎯</span>
              <span className="weekly-card-impact-text"><BoldText text={item.impact} /></span>
            </div>

            {detail && <DetailBlock detail={detail} />}
          </motion.div>
        )
      })}

      {keywords.length > 0 && (
        <div className="weekly-keywords">
          <span className="weekly-keywords-label">本周关键词</span>
          <div className="weekly-keywords-list">
            {keywords.map((kw, i) => (
              <span key={i} className="weekly-keyword-pill">{kw}</span>
            ))}
          </div>
        </div>
      )}

      <div className="weekly-footer">需要我针对某一条深入展开吗？</div>
    </div>
  )
}
