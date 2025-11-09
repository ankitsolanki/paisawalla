import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import MobileFormRenderer from './MobileFormRenderer';
import TabletFormRenderer from './TabletFormRenderer';
import DesktopFormRenderer from './DesktopFormRenderer';

/**
 * ResponsiveFormRenderer
 * Automatically selects the appropriate form renderer based on device type
 */
const ResponsiveFormRenderer = (props) => {
  const { deviceType } = useResponsive();

  switch (deviceType) {
    case 'mobile':
      return <MobileFormRenderer {...props} />;
    case 'tablet':
      return <TabletFormRenderer {...props} />;
    case 'desktop':
    default:
      return <DesktopFormRenderer {...props} />;
  }
};

export default ResponsiveFormRenderer;

