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
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacing.lg,
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
                fontSize: '1.5rem',
                lineHeight: 1,
                marginTop: '0.25rem',
              }}
            >
              {icon}
            </span>
          )}
          <div>
            {title && (
              <p
                style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: tokens.colors.gray[900],
                  marginBottom: subtitle ? tokens.spacing.xs : 0,
                  margin: 0,
                }}
              >
                {title}
              </p>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: tokens.typography.fontSize.sm,
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
          gap: tokens.spacing.md,
        }}
      >
        {rows.map((row, rowIdx) => (
          <div
            key={`row-${rowIdx}`}
            style={{
              display: 'grid',
              gridTemplateColumns: isCompact
                ? row.cols?.length === 1
                  ? '1fr'
                  : `repeat(${row.cols?.length || 1}, 1fr)`
                : row.cols?.length === 1
                ? '1fr'
                : `repeat(${row.cols?.length || 1}, minmax(0, 1fr))`,
              gap: tokens.spacing.md,
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

