import React, { useState } from 'react';

const Sidebar = ({ templatesHook, modalHook }) => {

    const { templates, addTemplate } = templatesHook;
    const { isOpen, modalContent, openModal, closeModal } = modalHook;

    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(templates[nodeType]));
        event.dataTransfer.effectAllowed = 'move';
    };

    const onClickNew = () => {
        openModal("new template", "new template", 'test')
    };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.header}>Vertices</div>
      <button style={styles.addBtn} onClick={onClickNew}>
        hi
      </button>
      {/* <div
        style={styles.item}
        draggable
        onDragStart={(e) => onDragStart(e, "generator-source")}
        className="sidebar-item"
      >
        Generator Source
      </div> */}
        {Object.entries(templates).map(([key, value]) => (
        <div
          key={key}
          style={styles.item}
          draggable
          onDragStart={(e) => onDragStart(e, key)}
          onClick={() => openModal("template", key, value.data.config)}
        >
          {key}
        </div>
        ))}

    </aside>
  );
};

const styles = {
  sidebar: {
    height: '100vh',
    width: '180px',
    background: 'white',
    borderRight: '1px solid #dddddd',
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    gap: '8px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px'
  },
  header: {
    fontWeight: '600',
    fontSize: '15px',
    color: '#333'
  },
  addBtn: {
    padding: '6px 10px',
    borderRadius: '4px',
    background: '#1976d2',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '8px'
  },
  item: {
    padding: '8px 10px',
    background: 'white',
    borderRadius: '6px',
    border: '1px solid #d3d3d3',
    cursor: 'grab',
    transition: '0.15s',
    userSelect: 'none',
    color: '#333'
  }
};

export default Sidebar;
