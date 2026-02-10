import clsx from 'clsx';
import { PROJECT_COLORS } from '../types/ticket';

interface ProjectFilterProps {
  projects: string[];
  selected: string | null;
  onChange: (project: string | null) => void;
}

export function ProjectFilter({ projects, selected, onChange }: ProjectFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={clsx(
          'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
          selected === null
            ? 'bg-gray-600 text-white'
            : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
        )}
      >
        All Projects
      </button>
      
      {projects.map(project => (
        <button
          key={project}
          onClick={() => onChange(project)}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            selected === project
              ? clsx(PROJECT_COLORS[project] || 'bg-gray-600', 'text-white')
              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          )}
        >
          {project}
        </button>
      ))}
    </div>
  );
}
