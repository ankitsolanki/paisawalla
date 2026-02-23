import React from 'react';

const FormSection = ({
  title,
  subtitle,
  rows = [],
  renderField,
  isCompact = false,
  icon,
  isFieldVisible,
}) => {
  if (!rows.length || !renderField) {
    return null;
  }

  return (
    <section className={`flex flex-col ${isCompact ? 'gap-4' : 'gap-6'}`}>
      {(title || subtitle) && (
        <div className="flex items-start gap-2">
          {icon && (
            <span
              aria-hidden="true"
              className={`${isCompact ? 'text-xl' : 'text-2xl'} leading-none mt-1 shrink-0`}
            >
              {icon}
            </span>
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <p
                className={`${isCompact ? 'text-base' : 'text-lg'} font-semibold text-foreground leading-tight m-0`}
              >
                {title}
              </p>
            )}
            {subtitle && (
              <p
                className={`${isCompact ? 'text-xs' : 'text-sm'} text-muted-foreground leading-normal m-0`}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      <div className={`flex flex-col ${isCompact ? 'gap-2' : 'gap-4'}`}>
        {rows.map((row, rowIdx) => {
          const visibleFields = row.fields?.filter((fieldName) => {
            if (isFieldVisible) {
              return isFieldVisible(fieldName);
            }
            const rendered = renderField(fieldName);
            return rendered !== null && rendered !== undefined;
          }) || [];

          if (visibleFields.length === 0) {
            return null;
          }

          const visibleCols = row.cols ? 
            row.cols.filter((_, idx) => {
              const fieldName = row.fields?.[idx];
              return fieldName && visibleFields.includes(fieldName);
            }) : 
            visibleFields.map(() => 1);

          const gridClass = isCompact
            ? 'grid-cols-1'
            : visibleCols.length === 1
            ? 'grid-cols-1'
            : '';

          const gridStyle = (!isCompact && visibleCols.length > 1)
            ? { gridTemplateColumns: `repeat(${visibleCols.length}, minmax(0, 1fr))` }
            : undefined;

          return (
            <div
              key={`row-${rowIdx}`}
              className={`grid gap-2 sm:gap-4 ${gridClass}`}
              style={gridStyle}
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
