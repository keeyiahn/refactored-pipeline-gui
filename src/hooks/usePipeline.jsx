import { useState, useCallback, useEffect } from "react";
import { 
    applyNodeChanges, 
    applyEdgeChanges, 
    addEdge,
    useNodesState,
    useEdgesState
 } from "@xyflow/react";

export default function usePipeline() {
  
  const [nodes, setNodes, handleNodesChange] = useNodesState([]);
  const [edges, setEdges, handleEdgesChange] = useEdgesState([]);

  const handleConnect = useCallback((connection) => {
    setEdges((eds) => addEdge(connection, eds));
    //console.log(`connection: ${connection.source} to ${connection.target}`);
  }, []);

  const addNode = useCallback((nd, position) => {
    const node = JSON.parse(nd);
    setNodes((nds) => [
      ...nds,
      {
        id: node.id,
        type: node.type,
        position: {
          x: position.x ?? 0,
          y: position.y ?? 0,
        },
        data: { label: node.id },
      },
    ]);
  }, []);

  useEffect(() => {
    console.log("Nodes updated:", nodes);
  }, [nodes]);

  return {
    nodes,
    edges,
    handleNodesChange,
    handleEdgesChange,
    handleConnect,
    addNode
  };
}