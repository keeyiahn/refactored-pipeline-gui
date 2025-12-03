import ReactFlow, { 
    useReactFlow,
    Background,
    MiniMap,
    Controls,
} from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import {
    useCallback
} from "react";

import { nameGen } from '../utils/nameGen';
import { exportPipeline, importYaml } from '../utils/yamlTools';
import yaml from 'js-yaml';

export default function Canvas({ pipelineHook, modalHook }) {

    const { nodes, edges, handleNodesChange, handleEdgesChange, handleConnect, addNode, setNodes, setEdges } = pipelineHook;
    const { isOpen, modalContent, openModal, closeModal } = modalHook;
    const { screenToFlowPosition } = useReactFlow();

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
        (event) => {
          event.preventDefault();
    
          const nodeTemplate = event.dataTransfer.getData("application/reactflow");
          const newNode = JSON.parse(nodeTemplate);
          const newName = nameGen(nodes, newNode.data.label);
          newNode.id = newName;
          console.log(newNode);
          console.log(newName);
          if (!nodeTemplate) return;
    
          const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY
          });
    
          addNode(newNode, position);
        },
        [nodes]
    );

    const onNodeClick = useCallback((event, node) => {
        event.preventDefault();
        openModal("node", node.id, node.data.config);
        console.log('node click', node);
    }, []);

    const onNodeRightClick = useCallback((event, node) => {
        event.preventDefault();
        setNodes((nds) => nds.filter((n) => n.id !== node.id));
        setEdges((eds) =>
          eds.filter((e) => e.source !== node.id && e.target !== node.id)
        );
    }, [setEdges]);

    const onEdgeClick = useCallback((event, edge) => { 
        event.preventDefault();
        openModal("edge", edge.id, edge.data?.conditions || []);
    }, []);

    const onEdgeRightClick = useCallback((event, edge) => {
        event.preventDefault();
        console.log(`edge id: ${edge.id}`);
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }, [setNodes, setEdges]);

    const onClickExport = () => {
        const pipeline = exportPipeline(nodes, edges);
        openModal("exported pipeline", "my-pipeline", yaml.load(pipeline) );
    };

    const onClickImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
    
        try {
          await importYaml(file, setNodes, setEdges);
        } catch (err) {
          alert("Import failed: " + err.message);
        }
      };

    return (
        <div style={{ width: '80%%', height: '100%' }}>
        <button
          onClick={onClickExport}
          style={{
            position: 'relative',
            zIndex: 10,
            top: 10,
            left: 20,
            padding: '8px 12px',
            fontSize: '14px'
          }}
        >
          Export pipeline
        </button>
        <input
          type="file"
          accept=".yaml,.yml"
          onChange={onClickImport}
          style={{ position: "absolute", top: 10, right: 0 }}
        />
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            fitView
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onNodeContextMenu={onNodeRightClick}
            onEdgeContextMenu={onEdgeRightClick}
        >
            <Background />
            <MiniMap />
            <Controls />
        </ReactFlow>
        </div>
    );
}