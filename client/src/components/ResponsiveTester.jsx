import { useState, useEffect, createContext, useContext } from 'react';

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

const ResponsiveTesterContext = createContext();

export const useResponsiveTester = () => {
  const context = useContext(ResponsiveTesterContext);
  if (!context) {
    return { containerWidth: '100%', containerHeight: 'auto' };
  }
  return context;
};

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
        setContainerWidth('100%');
        setContainerHeight('auto');
        onSizeChange?.({ width: '100%', height: 'auto' });
      } else {
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
    <div className="flex gap-2 items-center flex-wrap">
      <span className="text-sm text-muted-foreground">
        Resolution:
      </span>
      <select
        value={selectedResolution}
        onChange={handleResolutionChange}
        className="px-2 py-1 text-sm border border-border rounded-sm bg-background text-foreground cursor-pointer min-w-[180px]"
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
            className="px-2 py-1 text-sm border border-border rounded-sm w-[100px]"
          />
          <span className="text-sm text-muted-foreground">×</span>
          <input
            type="number"
            placeholder="Height (px)"
            value={customHeight}
            onChange={handleCustomHeightChange}
            className="px-2 py-1 text-sm border border-border rounded-sm w-[100px]"
          />
        </>
      )}

      {!isFullWidth && (
        <span className="text-xs text-muted-foreground font-mono">
          {containerWidth} × {containerHeight}
        </span>
      )}
    </div>
  );
};

const ResponsiveTesterContainer = ({ children, containerWidth, containerHeight, currentResolution }) => {
  const isFullWidth = containerWidth === '100%';
  const isCustom = currentResolution?.label === 'Custom';

  return (
    <div
      className={`mx-auto rounded-md relative transition-all duration-300 ${isFullWidth ? '' : 'border-2 border-dashed border-border bg-muted'}`}
      style={{
        width: containerWidth,
        height: containerHeight,
        overflow: 'auto',
      }}
    >
      {!isFullWidth && (
        <div className="absolute top-1 right-1 text-xs text-muted-foreground bg-background px-2 py-1 rounded-sm border border-border z-10">
          {currentResolution?.type === 'mobile' && 'Mobile'}
          {currentResolution?.type === 'tablet' && 'Tablet'}
          {currentResolution?.type === 'desktop' && 'Desktop'}
          {isCustom && 'Custom'}
        </div>
      )}
      <div className="w-full h-full">{children}</div>
    </div>
  );
};

const ResponsiveTester = ({ children, containerSize = { width: '100%', height: 'auto' } }) => {
  const containerWidth = typeof containerSize.width === 'number' 
    ? `${containerSize.width}px` 
    : containerSize.width;
  const containerHeight = typeof containerSize.height === 'number' 
    ? `${containerSize.height}px` 
    : containerSize.height;

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
