import { X } from "lucide-react";
import { ReactNode } from "react";

export const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) => (
  <div className="modal-backdrop" role="dialog" aria-modal="true">
    <div className="modal">
      <header>
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
      </header>
      {children}
    </div>
  </div>
);
