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
}
declare const Modal: React.FC<ModalProps>;
export default Modal;
