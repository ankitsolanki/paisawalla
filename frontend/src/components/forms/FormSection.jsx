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
}) => {
  if (!rows.length || !renderField) {
    return null;
  }

  return (
    <section
      style={{
        backgroundColor: '#ffffff',
        borderRadius: isCompact ? tokens.borderRadius.lg : tokens.borderRadius.xl,
        border: `1px solid ${tokens.colors.gray[200]}`,
        boxShadow: isCompact ? 'none' : '0 8px 24px rgba(22, 14, 122, 0.05)',
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
        {rows.map((row, rowIdx) => (
          <div
            key={`row-${rowIdx}`}
            style={{
              display: 'grid',
              gridTemplateColumns: isCompact
                ? '1fr'
                : row.cols?.length === 1
                ? '1fr'
                : `repeat(${row.cols?.length || 1}, minmax(0, 1fr))`,
              gap: isCompact ? tokens.spacing.sm : tokens.spacing.md,
            }}
          >
            {row.fields?.map((fieldName) => (
              <div key={fieldName}>{renderField(fieldName)}</div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default FormSection;

