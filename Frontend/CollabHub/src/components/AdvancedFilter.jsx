import { useState } from 'react';
import TagSelector from './TagSelector';
import { TECH_STACK_OPTIONS, ROLE_OPTIONS } from '../constants/options';

export default function AdvancedFilter({ onFilter, onClose }) {
  const [skills, setSkills] = useState([]);
  const [roles, setRoles] = useState([]);

  const handleApply = () => {
    onFilter({ tech_stack: skills, roles });
  };

  const handleClear = () => {
    setSkills([]);
    setRoles([]);
    onFilter({ tech_stack: [], roles: [] });
  };

  return (
    <div className="advanced-filter-overlay" style={{
      position: 'absolute',
      top: 'calc(100% + 12px)',
      left: 0,
      right: 0,
      background: 'var(--bg-card)',
      border: '2px solid var(--text)',
      boxShadow: '8px 8px 0 var(--text)',
      padding: '24px',
      zIndex: 100,
      animation: 'fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <TagSelector
          label="Filter by Tech Stack"
          options={TECH_STACK_OPTIONS}
          selectedTags={skills}
          onChange={setSkills}
          placeholder="All technologies..."
        />
        <TagSelector
          label="Filter by Roles Needed"
          options={ROLE_OPTIONS}
          selectedTags={roles}
          onChange={setRoles}
          placeholder="All roles..."
        />
      </div>

      <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button 
          onClick={handleClear} 
          className="btn btn-outline btn-sm"
          style={{ padding: '8px 16px' }}
        >
          Clear Filters
        </button>
        <button 
          onClick={handleApply} 
          className="btn btn-primary btn-sm"
          style={{ padding: '8px 24px' }}
        >
          Apply Filters
        </button>
        <button 
          onClick={onClose} 
          className="btn btn-danger btn-sm"
          style={{ padding: '8px 16px', background: 'transparent' }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
