import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { GRID_SIZE } from '../LayoutDesigner.constants';

const PanelInner = styled.div`
  padding: 1rem 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const NameInput = styled.input`
  flex: 1;
  font-weight: 600;
  font-size: 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  outline: none;
  background: #f9fafb;
  transition: border-color 0.2s, background 0.2s;
  &:focus { border-color: #4f46e5; background: #fff; }
`;

const DimBadge = styled.div`
  background: #eef2ff;
  color: #4338ca;
  font-weight: 600;
  font-size: 0.65rem;
  padding: 0.4rem 0.6rem;
  border-radius: 999px;
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
`;

const Section = styled.div``;
const SectionTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #6b7280;
`;

const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const HeightSlider = styled.input`
  flex: 1;
  accent-color: #4f46e5;
`;

const ValueBadge = styled.div`
  background: #f3f4f6;
  padding: 0.4rem 0.55rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #374151;
  min-width: 52px;
  text-align: center;
`;

const ColorwayRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ColorwayOption = styled.button`
  flex: 1;
  cursor: pointer;
  border: 2px solid ${p => p.$active ? '#4f46e5' : 'transparent'};
  background: #f9fafb;
  border-radius: 10px;
  padding: 0.5rem 0.4rem 0.6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.25s;
  position: relative;
  &:hover { background: #eef2ff; }
  &:before { content: ''; width: 26px; height: 26px; border-radius: 8px; background: ${p => p.$bin}; box-shadow: inset 0 0 0 2px rgba(0,0,0,0.05); }
  &:after { content: ''; width: 26px; height: 6px; border-radius: 3px; background: ${p => p.$bed}; margin-top: -4px; }
`;

const SaveButton = styled.button`
  background: #4f46e5;
  color: #fff;
  border: none;
  padding: 0.6rem 0.85rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.8rem;
  width: 100%;
  margin-top: 0.25rem;
  transition: background 0.25s, transform 0.25s;
  &:hover { background: #4338ca; transform: translateY(-1px); }
  &:active { transform: translateY(0); }
`;

const colorwayDefs = [
  { id: 'cream', name: 'Cream', bin: '#F5E6C8', bed: '#4A4A58' },
  { id: 'blue', name: 'Blue', bin: '#1A237E', bed: '#90CAF9' },
  { id: 'black', name: 'Black', bin: '#222222', bed: '#B2FF59' }
];

export default function BinOptionsPanel({ open, bin, onSave, onLiveChange }) {
  const [localName, setLocalName] = useState('');
  const [localHeight, setLocalHeight] = useState(21);
  const [localColorway, setLocalColorway] = useState('cream');
  const updateTimeoutRef = useRef(null);

  useEffect(() => {
    if (bin) {
      setLocalName(bin.name || '');
      setLocalHeight(bin.height || 21);
      setLocalColorway(bin.colorway || 'cream');
    }
  }, [bin]);

  // Remove continuous live updates; we will fire on blur / explicit apply
  useEffect(() => { /* no continuous updates */ }, []);

  const clearPending = () => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
  };

  const emitLiveUpdate = (override = {}, delay = 0) => {
    clearPending();
    updateTimeoutRef.current = setTimeout(() => {
      if (!bin) return;
      onLiveChange?.({
        ...bin,
        name: localName,
        height: localHeight,
        colorway: localColorway,
        color: colorwayDefs.find(c => c.id === localColorway)?.bin,
        ...override
      });
    }, delay);
  };

  if (!bin) return null;

  const cols = Math.round(bin.width / GRID_SIZE);
  const rows = Math.round(bin.length / GRID_SIZE);

  const handleSave = () => {
    if (!bin) return;
    clearPending();
    const updated = { 
      ...bin, 
      name: localName, 
      height: localHeight, 
      colorway: localColorway, 
      color: colorwayDefs.find(c => c.id === localColorway)?.bin 
    };
    // Immediately push final changes (no timeout) so parent state reflects before deselect
    onLiveChange?.(updated);
    onSave?.(updated);
  };

  return (
    <PanelInner style={{ opacity: open ? 1 : 0 }}>
      <TitleRow>
        <NameInput value={localName} onChange={e => setLocalName(e.target.value)} onBlur={() => emitLiveUpdate({}, 200)} placeholder="Bin name" />
        <DimBadge>{cols}c × {rows}c</DimBadge>
      </TitleRow>

      <Section>
        <SectionTitle>Height</SectionTitle>
        <SliderRow>
          <HeightSlider type="range" min={21} max={42} step={7} value={localHeight} 
            onChange={e => setLocalHeight(parseInt(e.target.value))}
            onMouseUp={() => emitLiveUpdate({}, 0)}
            onTouchEnd={() => emitLiveUpdate({}, 0)}
            onBlur={() => emitLiveUpdate({}, 200)}
          />
          <ValueBadge>{localHeight}mm</ValueBadge>
        </SliderRow>
      </Section>

      <Section>
        <SectionTitle>Colorway</SectionTitle>
        <ColorwayRow>
          {colorwayDefs.map(cw => (
            <ColorwayOption key={cw.id} $bin={cw.bin} $bed={cw.bed} $active={localColorway === cw.id} 
              onMouseDown={() => { // set before blur from input fires
                clearPending();
                setLocalColorway(cw.id);
              }}
              onClick={() => {
                emitLiveUpdate({ color: cw.bin, colorway: cw.id }, 0);
              }}
            >
              <span style={{ fontSize: '0.55rem', fontWeight: 600, color: '#374151' }}>{cw.name}</span>
            </ColorwayOption>
          ))}
        </ColorwayRow>
      </Section>

      <SaveButton onClick={handleSave}>Save</SaveButton>
    </PanelInner>
  );
}
