import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TransformOverview from "./TransformOverview";
import TransformBuilderCanvas from "./TransformBuilderCanvas";
import { TransformProject, SubTransform } from "./models/TransformModels";
import "../../styles/TransformProjectDetails.css";
import "../../styles/global.css";

const TransformProjectDetails: React.FC = () => {
  const { tenantId, projectId } = useParams<{ tenantId: string; projectId: string }>();

  const [project, setProject] = useState<TransformProject | null>(null);
  const [subTransforms, setSubTransforms] = useState<SubTransform[]>([]);

  useEffect(() => {
    if (!tenantId || !projectId) {
      console.warn("Missing tenantId or projectId in URL params");
      return;
    }

    const key = `transformProjects_${tenantId}`;
    const stored = localStorage.getItem(key);
    if (!stored) {
      console.warn(`No data in localStorage for key: ${key}`);
      return;
    }

    try {
      const parsed: TransformProject[] = JSON.parse(stored);
      const found = parsed.find((p) => p.id === projectId);
      if (found) {
        setProject(found);
        setSubTransforms(found.subTransforms || []);
      } else {
        console.warn(`Project with ID ${projectId} not found in tenant ${tenantId}`);
      }
    } catch (err) {
      console.error("Failed to parse localStorage project data:", err);
    }
  }, [tenantId, projectId]);

  const updateSubTransforms = (updated: SubTransform[]) => {
    if (!project || !tenantId) return;

    const updatedProject: TransformProject = {
      ...project,
      subTransforms: updated,
    };
    setProject(updatedProject);
    setSubTransforms(updated);

    const key = `transformProjects_${tenantId}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed: TransformProject[] = JSON.parse(stored);
        const updatedList = parsed.map((p) =>
          p.id === project.id ? updatedProject : p
        );
        localStorage.setItem(key, JSON.stringify(updatedList));
      }
    } catch (err) {
      console.error("Error updating project in localStorage:", err);
    }
  };

  return (
    <div className="project-details-wrapper">
      {project ? (
        <>
          <div className="overview-panel">
            <TransformOverview projectId={project.id} activeTenant={tenantId!} />
          </div>

          <div className="builder-panel">
            <TransformBuilderCanvas
              builtTransform={subTransforms}
              setBuiltTransform={updateSubTransforms}
            />
          </div>
        </>
      ) : (
        <p>Loading project...</p>
      )}
    </div>
  );
};

export default TransformProjectDetails;
