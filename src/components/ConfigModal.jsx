import { Editor } from '@monaco-editor/react';

export default function ConfigModal({ modalHook }) {
    const { isOpen, modalContent, openModal, closeModal } = modalHook;
    if (!isOpen) return null;    
    return (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>Hi</h3>
    
            <Editor
              height="350px"
              language="yaml"
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                automaticLayout: true,
              }}
              value="hi"
            />
          </div>
          <button style={styles.button} onClick={closeModal}>Close</button>
        </div>
      );
}

const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0,
      width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    },
    modal: {
      background: 'white',
      padding: '20px',
      width: '450px',
      borderRadius: '6px',
      boxShadow: '0 0 20px rgba(0,0,0,0.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    button: {
        padding: '6px 12px',
        background: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }
  };

