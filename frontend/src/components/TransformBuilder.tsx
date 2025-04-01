import React, { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import ProjectModal from "./builders/ProjectModal";
import "../styles/global.css";
import "../styles/TransformBuilder.css";
import { useNavigate } from "react-router-dom";
import { SubTransform } from "./builders/SubTransformList";

interface TransformProject {
  id: string;
  name: string;
  type: string;
  description?: string;
  subTransforms: SubTransform[];
}

interface TransformBuilderProps {
  activeTenant: string | null;
}

const TransformBuilder: React.FC<TransformBuilderProps> = ({ activeTenant }) => {
  const [projects, setProjects] = useState<TransformProject[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProject, setEditProject] = useState<TransformProject | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [typeInput, setTypeInput] = useState("concat");
  const hasLoaded = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeTenant) return;
    try {
      const stored = localStorage.getItem(`transformProjects_${activeTenant}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setProjects(parsed);
        }
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.warn("Failed to parse stored projects:", err);
    }

    hasLoaded.current = false;
  }, [activeTenant]);

  useEffect(() => {
    if (!activeTenant) return;
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      return;
    }

    try {
      localStorage.setItem(`transformProjects_${activeTenant}`, JSON.stringify(projects));
    } catch (err) {
      console.error("Error saving projects:", err);
    }
  }, [projects, activeTenant]);

  const generateTopLevelSubTransform = (
    projectId: string,
    type: string,
    name: string
  ): SubTransform => {
    const base: SubTransform = {
      id: `top-${projectId}`,
      type,
      name,
      nestingLevel: 0,
      projectId,
      attributes: {},
      index: 0,
      isTopLevel: true,
    };

    switch (type) {
      case "concat":
        base.attributes = { values: [] };
        break;
      case "lookup":
        base.attributes = { table: {} };
        break;
      default:
        base.attributes = {};
        break;
    }

    return base;
  };

  const handleAddProject = () => {
    const projectId = uuidv4();
    const trimmedName = nameInput.trim() || "Untitled Project";

    const newProject: TransformProject = {
      id: projectId,
      name: trimmedName,
      type: typeInput || "static",
      subTransforms: [
        generateTopLevelSubTransform(projectId, typeInput, trimmedName)
      ]
    };

    const updated = [...projects, newProject];
    setProjects(updated);
    closeModal();
  };

  const handleEdit = () => {
    if (!editProject) return;

    const updated = projects.map((p) =>
      p.id === editProject.id ? { ...editProject, name: nameInput, type: typeInput } : p
    );

    setProjects(updated);
    closeModal();
  };

  const handleDelete = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
  };

  const openEditModal = (project: TransformProject) => {
    setEditProject(project);
    setNameInput(project.name);
    setTypeInput(project.type);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditProject(null);
    setNameInput("");
    setTypeInput("concat");
  };

  return (
    <div className="transforms-container">
      <div className="transforms-list">
        <div className="transforms-list-header">
          <h3>Transform Projects</h3>
          <button className="primary-btn" onClick={() => setShowAddModal(true)}>
            + New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <p className="no-projects-message">No transform projects yet.</p>
        ) : (
          <div className="table-container">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/transformproject/${activeTenant}/${project.id}`)}
                    >
                      {project.name}
                    </td>
                    <td>{project.type}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="complementary-btn"
                        onClick={() => openEditModal(project)}
                      >
                        Edit
                      </button>
                      <button
                        className="accent-btn"
                        onClick={() => handleDelete(project.id)}
                        style={{ marginLeft: "8px" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(showAddModal || editProject) && (
        <ProjectModal
          isOpen={showAddModal || !!editProject}
          title={editProject ? "Edit Project" : "New Project"}
          name={nameInput}
          setName={setNameInput}
          type={typeInput}
          setType={setTypeInput}
          onClose={closeModal}
          onSave={editProject ? handleEdit : handleAddProject}
          actionLabel={editProject ? "Save Changes" : "Add Project"}
        />
      )}
    </div>
  );
};

export default TransformBuilder;
