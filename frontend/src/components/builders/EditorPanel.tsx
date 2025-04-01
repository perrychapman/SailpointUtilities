import React from "react";
import { SubTransform } from "./models/TransformModels";
import { getTransformComponent } from "./TranformTypeRegistry";
import { deleteTransformAndChildren } from "../../utils/deleteTransformAndChildren";
import "../../styles/TransformProjectDetails.css";
import "../../styles/TransformBuilderCanvas.css";

interface EditorPanelProps {
  editorStack: SubTransform[];
  setEditorStack: React.Dispatch<React.SetStateAction<SubTransform[]>>;
  onClose: () => void;
  onAddNestedTransform?: (nested: SubTransform) => void;
  onRemoveNestedTransform?: (nestedId: string) => void;
  onRecursiveDelete?: (id: string) => void;
  setBuiltTransform: React.Dispatch<React.SetStateAction<SubTransform[]>>;
  builtTransform: SubTransform[];
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  editorStack,
  setEditorStack,
  onClose,
  onAddNestedTransform,
  onRemoveNestedTransform,
  onRecursiveDelete,
  setBuiltTransform,
  builtTransform,
}) => {
  const currentTransform = editorStack[editorStack.length - 1];

  const updateTransformStack = (updated: SubTransform) => {
    // Update stack chain
    const newStack = [...editorStack];
    newStack[newStack.length - 1] = updated;

    for (let i = newStack.length - 2; i >= 0; i--) {
      const parent = newStack[i];
      const child = newStack[i + 1];

      const updatedValues = (parent.attributes?.values || []).map((v: any) =>
        typeof v === "string" ? v : v.id === child.id ? child : v
      );

      newStack[i] = {
        ...parent,
        attributes: {
          ...parent.attributes,
          values: updatedValues,
        },
      };
    }

    setEditorStack(newStack);

    // Also update builtTransform
    setBuiltTransform((prev) =>
      prev.map((t) => (t.id === newStack[0].id ? newStack[0] : t))
    );
  };

  const handleEditNested = (nested: SubTransform) => {
    setEditorStack((prev) => [...prev, nested]);
  };

  const handleAddNestedTransform = (nested: SubTransform) => {
    onAddNestedTransform?.(nested);
  };

  const handleRemoveNestedTransform = (nestedId: string) => {
    onRemoveNestedTransform?.(nestedId);
    onRecursiveDelete?.(nestedId);

    const updated = {
      ...currentTransform,
      attributes: {
        ...currentTransform.attributes,
        values: (currentTransform.attributes?.values || []).filter(
          (v: any) => typeof v === "string" || v.id !== nestedId
        ),
      },
    };

    updateTransformStack(updated);

    const cleaned = deleteTransformAndChildren(nestedId, builtTransform);
    setBuiltTransform(cleaned);

    setEditorStack((prev) => prev.filter((t) => t.id !== nestedId));
    if (currentTransform.id === nestedId) {
      onClose();
    }
  };

  const handleBack = () => {
    if (editorStack.length > 1) {
      setEditorStack((prev) => prev.slice(0, -1));
    }
  };

  const TransformEditor = getTransformComponent(currentTransform.type);

  return (
    <div className="editor-panel slide-in">
      <div className="editor-header">
        <div className="breadcrumb">
          {editorStack.map((t, i) => (
            <span key={i}>
              {t.name || t.type}
              {i < editorStack.length - 1 && (
                <span className="breadcrumb-separator"> &gt; </span>
              )}
            </span>
          ))}
        </div>
        <div className="editor-buttons">
          {editorStack.length > 1 && (
            <button className="secondary-btn" onClick={handleBack}>
              Back
            </button>
          )}
          <button className="primary-btn" onClick={onClose}>
            Close Editor
          </button>
        </div>
      </div>

      <div className="editor-body">
        {TransformEditor ? (
          <TransformEditor
            transform={currentTransform}
            updateTransform={updateTransformStack}
            removeTransform={() => onRecursiveDelete?.(currentTransform.id)}
            onEditNested={handleEditNested}
            onAddNestedTransform={handleAddNestedTransform}
            onRemoveNestedTransform={handleRemoveNestedTransform}
            onRecursiveDelete={onRecursiveDelete}
          />
        ) : (
          <p>Unsupported transform type: {currentTransform.type}</p>
        )}
      </div>
    </div>
  );
};

export default EditorPanel;
