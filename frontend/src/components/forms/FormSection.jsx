import React from 'react';
import { tokens } from '../../design-system/tokens';

/**
 * FormSection - Generic form section component for organizing fields
 * Supports flexible row-based layout with customizable column spans
 * 
 * Usage:
 * <FormSection
 *   title="Personal Information"
 *   subtitle="Required for verification"
 *   rows={[
 *     { fields: ['firstName', 'lastName'], cols: [1, 1] },
 *     { fields: ['email'], cols: [2] },
 *     { fields: ['city', 'state', 'pinCode'], cols: [1, 1, 1] },
 *   ]}
 *   renderField={renderField}
 *   isCompact={isMobile}
 * />
 */
const FormSection = ({
  title,
  subtitle,
  rows = [],
  renderField,
  isCompact = false,
  icon,
  isFieldVisible, // Optional function to check field visibility
}) => {
  if (!rows.length || !renderField) {
    return null;
  }

  return (
    <section
      style={{
        backgroundColor: 'transparent',
        borderRadius: isCompact ? tokens.borderRadius.lg : tokens.borderRadius.xl,
        border: 'none',
        boxShadow: 'none',
        padding: isCompact ? tokens.spacing.md : tokens.spacing.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: isCompact ? tokens.spacing.md : tokens.spacing.lg,
      }}
    >
      {/* Section Header */}
      {(title || subtitle) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: tokens.spacing.sm,
          }}
        >
          {icon && (
            <span
              aria-hidden="true"
              style={{
                fontSize: isCompact ? '1.25rem' : '1.5rem',
                lineHeight: 1,
                marginTop: '0.25rem',
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && (
              <p
                style={{
                  fontSize: isCompact ? tokens.typography.fontSize.base : tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: tokens.colors.gray[900],
                  marginBottom: subtitle ? tokens.spacing.xs : 0,
                  margin: 0,
                  lineHeight: '1.3',
                }}
              >
                {title}
              </p>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: isCompact ? tokens.typography.fontSize.xs : tokens.typography.fontSize.sm,
                  color: tokens.colors.gray[600],
                  lineHeight: tokens.typography.lineHeight.textRegular,
                  margin: 0,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Field Rows */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isCompact ? tokens.spacing.sm : tokens.spacing.md,
        }}
      >
        {rows.map((row, rowIdx) => {
          // Filter out hidden fields
          const visibleFields = row.fields?.filter((fieldName) => {
            // Use visibility check function if provided, otherwise check render result
            if (isFieldVisible) {
              return isFieldVisible(fieldName);
            }
            // Fallback: check if renderField returns null
            const rendered = renderField(fieldName);
            return rendered !== null && rendered !== undefined;
          }) || [];

          // Skip empty rows
          if (visibleFields.length === 0) {
            return null;
          }

          // Adjust column spans for visible fields only
          const visibleCols = row.cols ? 
            row.cols.filter((_, idx) => {
              const fieldName = row.fields?.[idx];
              return fieldName && visibleFields.includes(fieldName);
            }) : 
            visibleFields.map(() => 1);

          return (
            <div
              key={`row-${rowIdx}`}
              style={{
                display: 'grid',
                gridTemplateColumns: isCompact
                  ? '1fr'
                  : visibleCols.length === 1
                  ? '1fr'
                  : `repeat(${visibleCols.length}, minmax(0, 1fr))`,
                gap: isCompact ? tokens.spacing.sm : tokens.spacing.md,
              }}
            >
              {visibleFields.map((fieldName) => (
                <div key={fieldName}>{renderField(fieldName)}</div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FormSection;

