import React, { useState, useEffect, createContext, useContext } from 'react';
import { tokens } from '../design-system/tokens';

/**
 * Standard device resolutions
 */
export const STANDARD_RESOLUTIONS = [
  { label: 'Full Width', width: '100%', height: 'auto', type: 'custom' },
  { label: 'iPhone SE', width: 375, height: 667, type: 'mobile' },
  { label: 'iPhone 12/13', width: 390, height: 844, type: 'mobile' },
  { label: 'iPhone 14 Pro Max', width: 430, height: 932, type: 'mobile' },
  { label: 'iPad Mini', width: 768, height: 1024, type: 'tablet' },
  { label: 'iPad Air', width: 820, height: 1180, type: 'tablet' },
  { label: 'iPad Pro', width: 1024, height: 1366, type: 'tablet' },
  { label: 'Desktop (HD)', width: 1280, height: 720, type: 'desktop' },
  { label: 'Desktop (Full HD)', width: 1920, height: 1080, type: 'desktop' },
  { label: 'Desktop (2K)', width: 2560, height: 1440, type: 'desktop' },
  { label: 'Custom', width: '', height: '', type: 'custom' },
];

// Context for sharing resolution state
const ResponsiveTesterContext = createContext();

export const useResponsiveTester = () => {
  const context = useContext(ResponsiveTesterContext);
  if (!context) {
    return { containerWidth: '100%', containerHeight: 'auto' };
  }
  return context;
};

/**
 * ResponsiveTester Controls Component
 * Displays resolution selector and custom inputs
 */
export const ResponsiveTesterControls = ({ onSizeChange }) => {
  const [selectedResolution, setSelectedResolution] = useState('Full Width');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [containerWidth, setContainerWidth] = useState('100%');
  const [containerHeight, setContainerHeight] = useState('auto');
  const [showCustomInputs, setShowCustomInputs] = useState(false);

  useEffect(() => {
    const resolution = STANDARD_RESOLUTIONS.find((r) => r.label === selectedResolution);
    if (resolution) {
      if (resolution.type === 'custom' && selectedResolution === 'Custom') {
        // Custom mode - use input values (only update if both are provided)
        if (customWidth && customHeight) {
          const widthNum = parseInt(customWidth, 10);
          const heightNum = parseInt(customHeight, 10);
          if (!isNaN(widthNum) && !isNaN(heightNum)) {
            setContainerWidth(`${widthNum}px`);
            setContainerHeight(`${heightNum}px`);
            onSizeChange?.({ width: widthNum, height: heightNum });
          }
        }
      } else if (resolution.width === '100%') {
        // Full width mode
        setContainerWidth('100%');
        setContainerHeight('auto');
        onSizeChange?.({ width: '100%', height: 'auto' });
      } else {
        // Standard resolution
        setContainerWidth(`${resolution.width}px`);
        setContainerHeight(`${resolution.height}px`);
        onSizeChange?.({ width: resolution.width, height: resolution.height });
      }
    }
  }, [selectedResolution, customWidth, customHeight, onSizeChange]);

  const handleResolutionChange = (e) => {
    const value = e.target.value;
    setSelectedResolution(value);
    setShowCustomInputs(value === 'Custom');

    if (value === 'Full Width') {
      setCustomWidth('');
      setCustomHeight('');
    }
  };

  const handleCustomWidthChange = (e) => {
    const value = e.target.value;
    setCustomWidth(value);
  };

  const handleCustomHeightChange = (e) => {
    const value = e.target.value;
    setCustomHeight(value);
  };

  const currentResolution = STANDARD_RESOLUTIONS.find((r) => r.label === selectedResolution);
  const isFullWidth = selectedResolution === 'Full Width';

  return (
    <div style={{ display: 'flex', gap: tokens.spacing.sm, alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.gray[600] }}>
        Resolution:
      </span>
      <select
        value={selectedResolution}
        onChange={handleResolutionChange}
        style={{
          padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
          fontSize: tokens.typography.fontSize.sm,
          border: `1px solid ${tokens.colors.gray[300]}`,
          borderRadius: tokens.borderRadius.sm,
          backgroundColor: 'white',
          color: tokens.colors.gray[700],
          cursor: 'pointer',
          minWidth: '180px',
        }}
      >
        {STANDARD_RESOLUTIONS.map((res) => (
          <option key={res.label} value={res.label}>
            {res.label}
          </option>
        ))}
      </select>

      {showCustomInputs && (
        <>
          <input
            type="number"
            placeholder="Width (px)"
            value={customWidth}
            onChange={handleCustomWidthChange}
            style={{
              padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
              fontSize: tokens.typography.fontSize.sm,
              border: `1px solid ${tokens.colors.gray[300]}`,
              borderRadius: tokens.borderRadius.sm,
              width: '100px',
            }}
          />
          <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.gray[600] }}>×</span>
          <input
            type="number"
            placeholder="Height (px)"
            value={customHeight}
            onChange={handleCustomHeightChange}
            style={{
              padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
              fontSize: tokens.typography.fontSize.sm,
              border: `1px solid ${tokens.colors.gray[300]}`,
              borderRadius: tokens.borderRadius.sm,
              width: '100px',
            }}
          />
        </>
      )}

      {!isFullWidth && (
        <span
          style={{
            fontSize: tokens.typography.fontSize.xs,
            color: tokens.colors.gray[500],
            fontFamily: tokens.typography.fontFamily.mono.join(', '),
          }}
        >
          {containerWidth} × {containerHeight}
        </span>
      )}
    </div>
  );
};

/**
 * ResponsiveTester Container Component
 * Wraps children in a resizable container
 */
const ResponsiveTesterContainer = ({ children, containerWidth, containerHeight, currentResolution }) => {
  const isFullWidth = containerWidth === '100%';
  const isCustom = currentResolution?.label === 'Custom';

  return (
    <div
      style={{
        width: containerWidth,
        height: containerHeight,
        margin: '0 auto',
        border: isFullWidth ? 'none' : `2px dashed ${tokens.colors.gray[300]}`,
        borderRadius: tokens.borderRadius.md,
        overflow: 'auto',
        backgroundColor: isFullWidth ? 'transparent' : tokens.colors.gray[50],
        position: 'relative',
        transition: 'all 0.3s ease',
      }}
    >
      {!isFullWidth && (
        <div
          style={{
            position: 'absolute',
            top: tokens.spacing.xs,
            right: tokens.spacing.xs,
            fontSize: tokens.typography.fontSize.xs,
            color: tokens.colors.gray[400],
            backgroundColor: 'white',
            padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
            borderRadius: tokens.borderRadius.sm,
            border: `1px solid ${tokens.colors.gray[200]}`,
            zIndex: 10,
          }}
        >
          {currentResolution?.type === 'mobile' && '📱 Mobile'}
          {currentResolution?.type === 'tablet' && '📱 Tablet'}
          {currentResolution?.type === 'desktop' && '🖥️ Desktop'}
          {isCustom && '⚙️ Custom'}
        </div>
      )}
      <div style={{ width: '100%', height: '100%' }}>{children}</div>
    </div>
  );
};

/**
 * ResponsiveTester Component
 * Main component that wraps children in a resizable container
 */
const ResponsiveTester = ({ children, containerSize = { width: '100%', height: 'auto' } }) => {
  const containerWidth = typeof containerSize.width === 'number' 
    ? `${containerSize.width}px` 
    : containerSize.width;
  const containerHeight = typeof containerSize.height === 'number' 
    ? `${containerSize.height}px` 
    : containerSize.height;

  // Find current resolution based on size
  const currentResolution = STANDARD_RESOLUTIONS.find((r) => {
    if (r.width === '100%') return containerWidth === '100%';
    if (typeof r.width === 'number') {
      return containerWidth === `${r.width}px`;
    }
    return false;
  }) || { label: 'Custom', type: 'custom' };

  return (
    <ResponsiveTesterContainer
      containerWidth={containerWidth}
      containerHeight={containerHeight}
      currentResolution={currentResolution}
    >
      {children}
    </ResponsiveTesterContainer>
  );
};

export default ResponsiveTester;

