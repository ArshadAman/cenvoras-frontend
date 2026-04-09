import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Text, Rect, Transformer } from 'react-konva';
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
          onTransformEnd={() => {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            node.scaleX(1);
            node.scaleY(1);
            onChange({
              ...shapeProps,
              x: node.x(),
              y: node.y(),
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
          onTransformEnd={() => {
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
    // Top background accent
    { id: 'bg1', type: 'rect', x: 0, y: 0, width: 595, height: 110, fill: '#ededed' },
    
    // Header - Right
    { id: 'h1', type: 'text', text: 'KAMAL ENTERPRISES', x: 250, y: 25, fontSize: 24, fill: '#cc0000', width: 305, align: 'right', fontStyle: 'bold' },
    { id: 'h2', type: 'text', text: 'Plot No.LIG-409, K-4, Kalinga Nagar, Bhubaneswar, Odisha- 751019\nPh- 9337678495, email-kamal76enterprises@gmail.com\nGST- 21BHMPD9226P1Z0\nGEM ID- 217D200001242188', x: 200, y: 55, fontSize: 10, fill: '#333', width: 355, align: 'right', lineHeight: 1.4 },

    // Addresses
    { id: 'addr1', type: 'text', text: 'Shipping Address\n{{shipping_address_line1}}\n{{shipping_address_line2}}', x: 40, y: 130, fontSize: 11, fill: '#333', lineHeight: 1.4 },
    { id: 'addr2', type: 'text', text: 'Billed To\n{{billing_address_line1}}\n{{billing_address_line2}}\nGSTIN: {{billing_gstin}}', x: 300, y: 130, fontSize: 11, fill: '#333', lineHeight: 1.4 },

    // Title
    { id: 'title', type: 'text', text: 'Proforma Invoice - {{invoice_number}}', x: 0, y: 220, fontSize: 24, fill: '#000', width: 595, align: 'center' },

    // Table Header (Background)
    { id: 'th_bg', type: 'rect', x: 30, y: 280, width: 535, height: 25, fill: '#ffffff', stroke: '#333', strokeWidth: 1 },
    // Table Header Texts
    { id: 'th_1', type: 'text', text: 'SI.', x: 35, y: 287, fontSize: 10, fill: '#000', fontStyle: 'bold' },
    { id: 'th_2', type: 'text', text: 'DESCRIPTION', x: 120, y: 287, fontSize: 10, fill: '#000', fontStyle: 'bold' },
    { id: 'th_3', type: 'text', text: 'HSNC', x: 290, y: 287, fontSize: 10, fill: '#000', fontStyle: 'bold' },
    { id: 'th_4', type: 'text', text: 'QTY', x: 340, y: 287, fontSize: 10, fill: '#000', fontStyle: 'bold' },
    { id: 'th_5', type: 'text', text: 'UNIT PRICE', x: 380, y: 287, fontSize: 10, fill: '#000', fontStyle: 'bold' },
    { id: 'th_6', type: 'text', text: 'TAX', x: 450, y: 287, fontSize: 10, fill: '#000', fontStyle: 'bold' },
    { id: 'th_7', type: 'text', text: 'AMOUNT', x: 500, y: 287, fontSize: 10, fill: '#000', fontStyle: 'bold' },

    // Table Body Area
    { id: 'tb_bg', type: 'rect', x: 30, y: 305, width: 535, height: 60, fill: '#ffffff', stroke: '#333', strokeWidth: 1 },
    { id: 'tb_content', type: 'text', text: '{{dynamic_items_table_rows}}', x: 30, y: 330, fontSize: 11, fill: '#666', width: 535, align: 'center' },

    // Bank Details
    { id: 'bank', type: 'text', text: 'Our Bank Details:\nBank Name: {{bank_name}}\nAccount Number: {{account_number}}\nNEFT/IFSC Code: {{ifsc_code}}', x: 30, y: 390, fontSize: 11, fill: '#333', lineHeight: 1.5 },

    // Totals Box
    { id: 'tot_bg', type: 'rect', x: 365, y: 375, width: 200, height: 80, fill: '#ffffff', stroke: '#333', strokeWidth: 1 },
    { id: 'tot_1', type: 'text', text: 'Untaxed Amount', x: 375, y: 385, fontSize: 10, fill: '#333' },
    { id: 'tot_1_val', type: 'text', text: '₹ {{subtotal}}', x: 465, y: 385, fontSize: 10, fill: '#333', width: 90, align: 'right' },
    
    { id: 'tot_2', type: 'text', text: 'IGST', x: 375, y: 405, fontSize: 10, fill: '#333' },
    { id: 'tot_2_val', type: 'text', text: '₹ {{tax_total}}', x: 465, y: 405, fontSize: 10, fill: '#333', width: 90, align: 'right' },
    
    { id: 'tot_3', type: 'text', text: 'Total', x: 375, y: 430, fontSize: 12, fill: '#000', fontStyle: 'bold' },
    { id: 'tot_3_val', type: 'text', text: '₹ {{grand_total}}', x: 465, y: 430, fontSize: 12, fill: '#000', width: 90, align: 'right', fontStyle: 'bold' },
  ]);
  const [selectedId, selectShape] = useState(null);

  const checkDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  const addTextNode = (text = 'New Text', props = {}) => {
    setNodes([...nodes, {
      id: uuidv4(),
      type: 'text',
      text,
      x: 100,
      y: 100,
      fontSize: 16,
      fill: '#000000',
      ...props
    }]);
  };

  const addRectNode = () => {
    setNodes([...nodes, {
      id: uuidv4(),
      type: 'rect',
      x: 100,
      y: 100,
      width: 150,
      height: 50,
      fill: 'transparent',
      stroke: '#000',
      strokeWidth: 1
    }]);
  };

  const deleteSelected = () => {
    if (selectedId) {
      setNodes(nodes.filter(n => n.id !== selectedId));
      selectShape(null);
    }
  };

  const handleSave = () => {
    const templateConfig = JSON.stringify(nodes);
    console.log("Saved Template Config:", templateConfig);
    alert("Template saved!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex h-screen bg-[#0c0c0e] text-white">
      <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500/40">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      {/* Sidebar Tooling */}
      <div className="w-64 bg-[#111] border-r border-white/10 p-6 flex flex-col gap-4 overflow-y-auto relative z-40">
        <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-4">Invoice Blocks</h2>
        <button onClick={() => addTextNode('{{company_name}}', { fontSize: 24, fill: '#cc0000', fontStyle: 'bold' })} className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
          + Company Identity
        </button>
        <button onClick={() => addTextNode('{{shipping_address}}')} className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
          + Shipping Address
        </button>
        <button onClick={() => addTextNode('{{billing_address}}')} className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
          + Billing Address
        </button>
        <button onClick={() => addTextNode('{{grand_total}}')} className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
          + Variables (Total)
        </button>
        <button onClick={() => addTextNode('Custom Text')} className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
          + Plain Text Node
        </button>
        <button onClick={addRectNode} className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
          + Box / Line Shape
        </button>
        <div className="mt-8 border-t border-white/10 pt-4">
          <button onClick={deleteSelected} disabled={!selectedId} className="w-full p-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 transition font-medium">
            Delete Selected
          </button>
        </div>
        <button onClick={handleSave} className="w-full mt-auto p-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition shadow-lg shadow-cyan-500/20">
          Save Template
        </button>
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 flex justify-center items-center bg-black/50 overflow-auto py-10 relative">
        <div className="shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-white relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, minWidth: CANVAS_WIDTH, minHeight: CANVAS_HEIGHT }}>
          <Stage
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={checkDeselect}
            onTouchStart={checkDeselect}
            className="w-full h-full absolute inset-0"
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