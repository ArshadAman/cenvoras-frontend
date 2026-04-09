import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Text, Rect, Transformer, Group } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';

const CANVAS_WIDTH = 595; // A4 pt roughly
const CANVAS_HEIGHT = 842; // A4 pt roughly

// Component representing a selectable node and its transformer
const SelectableNode = ({ shapeProps, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      {shapeProps.type === 'text' && (
        <Text
          onClick={onSelect}
          onTap={onSelect}
          ref={shapeRef}
          {...shapeProps}
          draggable
          onDragEnd={(e) => {
            onChange({
              ...shapeProps,
              x: e.target.x(),
              y: e.target.y(),
            });
          }}
          onTransformEnd={(e) => {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            onChange({
              ...shapeProps,
              x: node.x(),
              y: node.y(),
              // set minimal value
              width: Math.max(5, node.width() * scaleX),
              fontSize: shapeProps.fontSize * scaleX
            });
          }}
        />
      )}
      {shapeProps.type === 'rect' && (
        <Rect
          onClick={onSelect}
          onTap={onSelect}
          ref={shapeRef}
          {...shapeProps}
          draggable
          onDragEnd={(e) => {
            onChange({
              ...shapeProps,
              x: e.target.x(),
              y: e.target.y(),
            });
          }}
          onTransformEnd={(e) => {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            onChange({
              ...shapeProps,
              x: node.x(),
              y: node.y(),
              width: Math.max(5, node.width() * scaleX),
              height: Math.max(5, node.height() * scaleY),
            });
          }}
        />
      )}
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

export default function TemplateEditor({ isOpen, onClose }) {
  const [nodes, setNodes] = useState([
    { id: '1', type: 'text', text: 'INVOICE', x: 50, y: 50, fontSize: 30, fill: '#000000' },
    { id: '2', type: 'text', text: '{{company_name}}', x: 50, y: 100, fontSize: 16, fill: '#333333' },
    { id: '3', type: 'text', text: '{{invoice_number}}', x: 400, y: 50, fontSize: 16, fill: '#333333' },
    { id: '4', type: 'text', text: '{{items_table}}', x: 50, y: 300, fontSize: 14, fill: '#777777', width: 495, align: 'center' }
  ]);
  const [selectedId, selectShape] = useState(null);

  const checkDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  const addTextNode = (text = 'New Text') => {
    setNodes([...nodes, {
      id: uuidv4(),
      type: 'text',
      text,
      x: 100,
      y: 100,
      fontSize: 16,
      fill: '#000000'
    }]);
  };

  const deleteSelected = () => {
    if (selectedId) {
      setNodes(nodes.filter(n => n.id !== selectedId));
      selectShape(null);
    }
  };

  const handleSave = () => {
    // This JSON can be stored in the DB as the "blueprint" of the template
    const templateConfig = JSON.stringify(nodes);
    console.log("Saved Template Config:", templateConfig);
    alert("Template saved!");
  };

    if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex h-screen bg-[#0c0c0e] text-white">
      {/* Close button */}
      <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500/40">
        X
      </button>
      {/* Sidebar Tooling */}
      <div className="w-64 bg-[#111] border-r border-white/10 p-6 flex flex-col gap-4">
        <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-4">Blocks</h2>
        <button onClick={() => addTextNode('{{customer_name}}')} className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition">
          + Customer Name
        </button>
        <button onClick={() => addTextNode('{{grand_total}}')} className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition">
          + Grand Total
        </button>
        <button onClick={() => addTextNode('Custom Label')} className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition">
          + Plain Text
        </button>
        <button onClick={deleteSelected} disabled={!selectedId} className="w-full mt-auto p-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 transition">
          Delete Selected
        </button>
        <button onClick={handleSave} className="w-full p-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition">
          Save Template
        </button>
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 flex justify-center items-center bg-black/50 overflow-auto py-10 relative">
        <div className="shadow-2xl bg-white" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
          <Stage
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={checkDeselect}
            onTouchStart={checkDeselect}
            className="w-full h-full"
          >
            <Layer>
              {nodes.map((node, i) => {
                return (
                  <SelectableNode
                    key={node.id}
                    shapeProps={node}
                    isSelected={node.id === selectedId}
                    onSelect={() => {
                      selectShape(node.id);
                    }}
                    onChange={(newProps) => {
                      const rects = nodes.slice();
                      rects[i] = newProps;
                      setNodes(rects);
                    }}
                  />
                );
              })}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}
