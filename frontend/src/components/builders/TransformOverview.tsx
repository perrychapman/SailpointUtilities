import React, { useEffect, useState } from "react";

interface TransformProject {
  id: string;
  name: string;
  type: string;
  description?: string;
}

interface TransformOverviewProps {
  projectId: string;
  activeTenant: string;
}

const TransformOverview: React.FC<TransformOverviewProps> = ({ projectId, activeTenant }) => {
  const [project, setProject] = useState<TransformProject | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`transformProjects_${activeTenant}`);
    if (stored) {
      const parsed: TransformProject[] = JSON.parse(stored);
      const found = parsed.find((p) => p.id === projectId);
      if (found) setProject(found);
    }
  }, [projectId, activeTenant]);

  if (!project) {
    return <p className="error-msg">Project not found.</p>;
  }

  return (
    <div className="transform-overview">
      <h3>{project.name}</h3>
      <p><strong>Type:</strong> {project.type}</p>
      {project.description && (
        <p><strong>Description:</strong> {project.description}</p>
      )}
    </div>
  );
};

export default TransformOverview;
