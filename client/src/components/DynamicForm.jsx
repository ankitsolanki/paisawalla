import React from 'react';
import ResponsiveFormRenderer from './forms/ResponsiveFormRenderer';

/**
 * DynamicForm - Renders forms dynamically from JSON schema
 * Now uses responsive renderers for optimal UX across devices:
 * - Mobile: Single column, stacked buttons, optimized for touch
 * - Tablet: 2-column grid, balanced spacing
 * - Desktop: Multi-column grid, generous spacing
 */
const DynamicForm = ({ schema, theme = 'light', title, description }) => {
  return <ResponsiveFormRenderer schema={schema} theme={theme} title={title} description={description} />;
};

export default DynamicForm;
