import { useState } from 'react';

export default function TagSelector({ label, options, selectedTags, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
        {label}
      </label>
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px 12px',
          border: '1px solid var(--text)',
          borderRadius: '4px',
          cursor: 'pointer',
          background: 'var(--bg-input)',
          minHeight: '38px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px'
        }}
      >
        {selectedTags.length > 0 ? (
          selectedTags.map(tag => (
            <span
              key={tag}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleTag(tag);
              }}
              style={{
                background: 'var(--text)',
                color: 'var(--bg)',
                padding: '4px 8px',
                borderRadius: '3px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              {tag}
              <span style={{ marginLeft: '4px', fontWeight: 'bold' }}>×</span>
            </span>
          ))
        ) : (
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {placeholder}
          </span>
        )}
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--text)',
            borderRadius: '4px',
            marginTop: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          {options.map(option => (
            <div
              key={option}
              onClick={() => handleToggleTag(option)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                background: selectedTags.includes(option) ? 'var(--accent-light)' : 'transparent',
                borderBottom: '1px solid var(--border)',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <input
                type="checkbox"
                checked={selectedTags.includes(option)}
                readOnly
                style={{ cursor: 'pointer' }}
              />
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
