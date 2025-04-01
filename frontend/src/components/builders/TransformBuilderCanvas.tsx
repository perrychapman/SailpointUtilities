import React, { useState } from "react";
import { FaTrash, FaEdit } from "react-icons/fa";
import { SubTransform } from "./models/TransformModels";
import EditorPanel from "./EditorPanel";
import { deleteTransformAndChildren } from "../../utils/deleteTransformAndChildren";
import "../../styles/TransformProjectDetails.css";
import "../../styles/TransformBuilderCanvas.css";

interface TransformBuilderCanvasProps {
  builtTransform: SubTransform[];
  setBuiltTransform: React.Dispatch<React.SetStateAction<SubTransform[]>>;
}

const TransformBuilderCanvas: React.FC<TransformBuilderCanvasProps> = ({
  builtTransform,
  setBuiltTransform,
}) => {
  const [showJson, setShowJson] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorStack, setEditorStack] = useState<SubTransform[]>([]);

  const handleRemove = (id: string) => {
    const updated = deleteTransformAndChildren(id, builtTransform);
    setBuiltTransform(updated);
  };

  const persistUpdate = (updated: SubTransform) => {
    setBuiltTransform((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  const handleAddNestedTransform = (nested: SubTransform) => {
    setBuiltTransform((prev) => [...prev, nested]);
  };

  const handleRemoveNestedTransform = (nestedId: string) => {
    setBuiltTransform((prev) =>
      prev.filter((t) => t.id !== nestedId && t.parentId !== nestedId)
    );
  };

  const deleteTransformAndChildrenRecursive = (id: string) => {
    const updated = deleteTransformAndChildren(id, builtTransform);
    setBuiltTransform(updated);
  };

  const flattenTransforms = (transforms: SubTransform[]): SubTransform[] => {
    const result: SubTransform[] = [];

    const addWithChildren = (parent: SubTransform, path: string) => {
      const updatedParent = { ...parent, displayPath: path };
      result.push(updatedParent);

      const children = transforms
        .filter((t) => t.parentId === parent.id)
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

      children.forEach((child, idx) =>
        addWithChildren(child, `${path}.${idx + 1}`)
      );
    };

    const roots = transforms
      .filter((t) => t.isTopLevel)
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

    roots.forEach((root, idx) => addWithChildren(root, `${idx + 1}`));

    return result;
  };

  const buildFinalJson = () => {
    const top = builtTransform.find((t) => t.isTopLevel);
    if (!top) return {};

    const clean = JSON.parse(JSON.stringify(top));

    delete clean.subTransforms;
    delete clean.projectId;
    delete clean.index;
    delete clean.nestingLevel;
    delete clean.parentId;
    delete clean.isTopLevel;
    delete clean.id;
    delete clean.displayPath;

    const cleanNested = (transforms: any[]) =>
      transforms.map((t) => {
        const c = { ...t };
        delete c.id;
        delete c.name;
        delete c.projectId;
        delete c.nestingLevel;
        delete c.index;
        delete c.parentId;
        delete c.displayPath;
        if (Array.isArray(c.attributes?.values)) {
          c.attributes.values = c.attributes.values.map((v: any) =>
            typeof v === "string" ? v : cleanNested([v])[0]
          );
        }
        return c;
      });

    if (Array.isArray(clean.attributes?.values)) {
      clean.attributes.values = clean.attributes.values.map((v: any) =>
        typeof v === "string" ? v : cleanNested([v])[0]
      );
    }

    return clean;
  };

  return (
    <div className="builder-container">
      <div className="transform-builder-canvas">
        <div className="canvas-header">
          <h3>Transform Builder</h3>
          <button className="secondary-btn" onClick={() => setShowJson(!showJson)}>
            {showJson ? "Hide JSON" : "Show JSON"}
          </button>
        </div>

        {showJson ? (
          <pre className="json-preview">{JSON.stringify(buildFinalJson(), null, 2)}</pre>
        ) : builtTransform.length === 0 ? (
          <p className="empty-message">No transforms added yet.</p>
        ) : (
          <div className="builder-list">
            {flattenTransforms(builtTransform).map((transform) => (
              <div key={transform.id}>
                <div
                  className="builder-item"
                  style={{ marginLeft: `${(transform.nestingLevel ?? 0) * 20}px` }}
                >
                  <div className="builder-item-content">
                    <strong>
                      {transform.displayPath}. {transform.name || transform.type}
                    </strong>
                    <div className="builder-item-actions">
                      {!transform.isTopLevel && (
                        <button
                          className="builder-remove-btn"
                          onClick={() => handleRemove(transform.id)}
                        >
                          <FaTrash />
                        </button>
                      )}
                      <button
                        className="builder-remove-btn"
                        onClick={() => {
                          setEditorStack([transform]);
                          setEditorOpen(true);
                        }}
                      >
                        <FaEdit />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editorOpen && editorStack.length > 0 && (
        <EditorPanel
          editorStack={editorStack}
          setEditorStack={setEditorStack}
          onClose={() => setEditorOpen(false)}
          onAddNestedTransform={handleAddNestedTransform}
          onRemoveNestedTransform={handleRemoveNestedTransform}
          onRecursiveDelete={deleteTransformAndChildrenRecursive}
          setBuiltTransform={setBuiltTransform}
          builtTransform={builtTransform}
        />
      )}
    </div>
  );
};

export default TransformBuilderCanvas;
