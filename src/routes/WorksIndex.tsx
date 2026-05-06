import { useMemo } from 'react'
import ProjectCard from '../components/ProjectCard'
import { useContent, type SectionId } from '../lib/content'

export default function WorksIndex({ section }: { section: SectionId }) {
  const content = useContent()
  if (content.status !== 'ready') return null

  const projects = useMemo(
    () => content.projects.filter((p) => p.section === section),
    [content.projects, section],
  )

  return (
    <div className="container works">
      <div className="works-list">
        {projects.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </div>
  )
}
