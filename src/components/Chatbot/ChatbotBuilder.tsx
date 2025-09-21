import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  OnConnect,
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Bot, MessageSquare, Clock, GitBranch } from 'lucide-react';

const initialNodes: Node[] = [
  { id: '1', type: 'input', data: { label: 'Início do Fluxo' }, position: { x: 250, y: 5 } },
];

const initialEdges: Edge[] = [];

const SidebarNode = ({ type, label, icon: Icon }: { type: string, label: string, icon: React.ElementType }) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };
  return (
    <div draggable onDragStart={(event) => onDragStart(event, type)} className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-grab hover:bg-gray-100 dark:hover:bg-gray-700">
      <Icon size={20} className="text-green-500" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

let id = 2;
const getId = () => `${id++}`;

export const ChatbotBuilder: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }
      
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { label: `${type === 'default' ? 'Novo' : type} Nó` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      <aside className="w-64 p-4 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-bold mb-4">Nós do Fluxo</h3>
        <div className="space-y-3">
          <SidebarNode type="default" label="Enviar Mensagem" icon={MessageSquare} />
          <SidebarNode type="default" label="Aguardar" icon={Clock} />
          <SidebarNode type="default" label="Condição" icon={GitBranch} />
          <SidebarNode type="output" label="Finalizar Fluxo" icon={Bot} />
        </div>
      </aside>
      <div className="flex-1" ref={reactFlowWrapper} onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          deleteKeyCode={46}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
};
