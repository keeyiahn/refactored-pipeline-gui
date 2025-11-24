import { 
    ReactFlow,
    useReactFlow,
    Background,
    MiniMap,
    Controls,
} from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import {
    useCallback
} from "react";


export default function Canvas({pipeline}) {

    const { nodes, edges, handleNodesChange, handleEdgesChange, handleConnect, addNode } = pipeline;
    const { screenToFlowPosition } = useReactFlow();

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
        (event) => {
          event.preventDefault();
    
          const nodeType = event.dataTransfer.getData("application/reactflow");
          if (!nodeType) return;
    
          const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY
          });
    
          addNode(nodeType, position);
        },
        [screenToFlowPosition, addNode]
    );

    return (
        <div style={{ width: '80%%', height: '100%' }}>
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            fitView
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            <Background />
            <MiniMap />
            <Controls />
        </ReactFlow>
        </div>
    );
}