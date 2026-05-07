import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import type { Project } from '../lib/content'
import { useContent } from '../lib/content'
import { cx } from '../lib/cx'

export default function ProjectCard({ project }: { project: Project }) {
  const content = useContent()
  const location = useLocation()
  const title = content.t(project.title)
  const subtitle = content.t(project.subtitle)

  return (
    <motion.article
      className={cx(
        'project-card',
        project.slug === 'urban-oasis' && 'project-card-featured',
      )}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Link
        to={{ pathname: `/${project.slug}`, search: location.search }}
        className="project-link"
      >
        <div className="project-media">
          <img
            src={project.cover}
            alt={title}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="project-meta">
          <h3 className="project-title">{title}</h3>
          <div className="project-subtitle">
            {subtitle}
            {project.year ? ` / ${project.year}` : ''}
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
