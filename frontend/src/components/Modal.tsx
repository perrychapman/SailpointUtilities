import React from "react";
import "../styles/global.css";
import "../styles/Modal.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  width?: "normal" | "wide";
}

const Modal: React.FC<ModalProps> = (props) => {
  const {
    isOpen,
    onClose,
    title,
    children,
    actionLabel,
    onAction,
    width = "normal",
  } = props;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className={`modal-content ${width === "wide" ? "modal-wide" : ""}`}>
        <h2 className="modal-title">{title}</h2>
        <div className="modal-body">{children}</div>

        <div className="modal-buttons">
          <button className="secondary-btn" onClick={onClose}>Close</button>
          {onAction && actionLabel && (
            <button className="primary-btn" onClick={onAction}>{actionLabel}</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
