import React from "react";
import Modal from "../Modal";
import { FaChevronDown } from "react-icons/fa";

interface ProjectModalProps {
    isOpen: boolean;
    title: string;
    name: string;
    setName: (val: string) => void;
    type: string;
    setType: (val: string) => void;
    onClose: () => void;
    onSave: () => void;
    actionLabel: string;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
    isOpen,
    title,
    name,
    setName,
    type,
    setType,
    onClose,
    onSave,
    actionLabel
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            onAction={onSave}
            actionLabel={actionLabel}
        >
            <div className="modal-body">
                <div className="form-group">
                    <label htmlFor="project-name">Project Name</label>
                    <input
                        id="project-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter project name"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="project-type">Transform Type</label>
                    <div className="select-wrapper">
                        <select
                            id="project-type"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="" disabled hidden>
                                Select Type
                            </option>
                            <option value="static">Static</option>
                            <option value="concat">Concat</option>
                            <option value="lookup">Lookup</option>
                            {/* Add more transform types here */}
                        </select>
                        <FaChevronDown className="select-icon" />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ProjectModal;
