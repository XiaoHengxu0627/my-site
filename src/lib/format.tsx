import { Fragment } from 'react'

export function renderBold(text: string): (string | { text: string; bold: boolean })[] {
  const parts: (string | { text: string; bold: boolean })[] = []
  let lastIndex = 0
  const regex = /\*\*(.+?)\*\*/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push({ text: match[1], bold: true })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

export function BoldText({ text }: { text: string }) {
  const parts = renderBold(text)
  return (
    <>
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          <Fragment key={i}>{part}</Fragment>
        ) : (
          <strong key={i}>{part.text}</strong>
        ),
      )}
    </>
  )
}
