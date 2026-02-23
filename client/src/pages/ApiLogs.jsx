import { useState, useEffect, useCallback } from 'react';

const SERVICE_COLORS = {
  'Karix OTP': { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  'Experian ECV': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  'Experian ECV Token': { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  'Experian BRE': { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
  'Experian BRE Token': { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' },
  'Google reCAPTCHA': { bg: '#dcfce7', text: '#166534', border: '#86efac' },
};

const ALL_SERVICES = Object.keys(SERVICE_COLORS);

function getStatusColor(code) {
  if (!code) return { bg: '#f3f4f6', text: '#6b7280' };
  if (code >= 200 && code < 300) return { bg: '#dcfce7', text: '#166534' };
  if (code >= 400 && code < 500) return { bg: '#fef3c7', text: '#92400e' };
  return { bg: '#fee2e2', text: '#991b1b' };
}

const VALUE_COLORS = {
  string: '#a5d6ff',
  number: '#79c0ff',
  boolean: '#ff7b72',
  null: '#8b949e',
  key: '#7ee787',
  bracket: '#8b949e',
  colon: '#8b949e',
};

function JsonTreeNode({ keyName, value, defaultOpen = false, depth = 0 }) {
  const [open, setOpen] = useState(defaultOpen);

  if (value === null) {
    return (
      <div style={{ paddingLeft: depth * 16, display: 'flex', alignItems: 'baseline', gap: 4, lineHeight: 1.8 }}>
        {keyName !== undefined && <span style={{ color: VALUE_COLORS.key }}>"{keyName}"</span>}
        {keyName !== undefined && <span style={{ color: VALUE_COLORS.colon }}>: </span>}
        <span style={{ color: VALUE_COLORS.null, fontStyle: 'italic' }}>null</span>
      </div>
    );
  }

  if (typeof value === 'string') {
    const display = value.length > 300 ? value.slice(0, 300) + '...' : value;
    return (
      <div style={{ paddingLeft: depth * 16, display: 'flex', alignItems: 'baseline', gap: 4, lineHeight: 1.8 }}>
        {keyName !== undefined && <span style={{ color: VALUE_COLORS.key }}>"{keyName}"</span>}
        {keyName !== undefined && <span style={{ color: VALUE_COLORS.colon }}>: </span>}
        <span style={{ color: VALUE_COLORS.string }}>"{display}"</span>
      </div>
    );
  }

  if (typeof value === 'number') {
    return (
      <div style={{ paddingLeft: depth * 16, display: 'flex', alignItems: 'baseline', gap: 4, lineHeight: 1.8 }}>
        {keyName !== undefined && <span style={{ color: VALUE_COLORS.key }}>"{keyName}"</span>}
        {keyName !== undefined && <span style={{ color: VALUE_COLORS.colon }}>: </span>}
        <span style={{ color: VALUE_COLORS.number }}>{value}</span>
      </div>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <div style={{ paddingLeft: depth * 16, display: 'flex', alignItems: 'baseline', gap: 4, lineHeight: 1.8 }}>
        {keyName !== undefined && <span style={{ color: VALUE_COLORS.key }}>"{keyName}"</span>}
        {keyName !== undefined && <span style={{ color: VALUE_COLORS.colon }}>: </span>}
        <span style={{ color: VALUE_COLORS.boolean }}>{value ? 'true' : 'false'}</span>
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);
  const count = entries.length;
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';
  const preview = count === 0
    ? (isArray ? '[]' : '{}')
    : `${count} ${isArray ? 'item' : 'key'}${count !== 1 ? 's' : ''}`;

  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'baseline', gap: 4, cursor: 'pointer', lineHeight: 1.8, userSelect: 'none' }}
      >
        <span style={{
          display: 'inline-block',
          width: 12,
          fontSize: 10,
          color: '#8b949e',
          transition: 'transform 0.1s',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          flexShrink: 0,
        }}>&#9654;</span>
        {keyName !== undefined && <span style={{ color: VALUE_COLORS.key }}>"{keyName}"</span>}
        {keyName !== undefined && <span style={{ color: VALUE_COLORS.colon }}>: </span>}
        <span style={{ color: VALUE_COLORS.bracket }}>{openBracket}</span>
        {!open && <span style={{ color: '#8b949e', fontSize: 11, fontStyle: 'italic' }}>{preview}</span>}
        {!open && <span style={{ color: VALUE_COLORS.bracket }}>{closeBracket}</span>}
      </div>
      {open && (
        <>
          {entries.map(([k, v]) => (
            <JsonTreeNode
              key={String(k)}
              keyName={isArray ? undefined : k}
              value={v}
              defaultOpen={depth < 1}
              depth={depth + 1}
            />
          ))}
          <div style={{ paddingLeft: (depth + 1) * 16 - 16, lineHeight: 1.8 }}>
            <span style={{ color: VALUE_COLORS.bracket, paddingLeft: 16 }}>{closeBracket}</span>
          </div>
        </>
      )}
    </div>
  );
}

function JsonTreeViewer({ data }) {
  return (
    <div style={{
      background: '#1e293b',
      padding: 12,
      borderRadius: 6,
      fontSize: 12,
      fontFamily: 'monospace',
      overflow: 'auto',
      maxHeight: 500,
    }}>
      <JsonTreeNode value={data} defaultOpen={true} />
    </div>
  );
}

function XmlViewer({ xml }) {
  let formatted = xml;
  try {
    let indent = 0;
    formatted = xml
      .replace(/(>)(<)(\/*)/g, '$1\n$2$3')
      .split('\n')
      .map(line => {
        line = line.trim();
        if (!line) return '';
        if (line.startsWith('</')) {
          indent = Math.max(0, indent - 1);
          const padded = '  '.repeat(indent) + line;
          return padded;
        }
        const padded = '  '.repeat(indent) + line;
        if (line.startsWith('<') && !line.startsWith('<?') && !line.startsWith('<!') && !line.endsWith('/>') && !line.includes('</')) {
          indent++;
        }
        return padded;
      })
      .filter(Boolean)
      .join('\n');
  } catch (e) {
    formatted = xml;
  }

  const highlighted = formatted
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(&lt;\/?)([\w:.-]+)/g, '$1<span style="color:#7ee787">$2</span>')
    .replace(/([\w:.-]+)(=)(".*?")/g, '<span style="color:#79c0ff">$1</span>$2<span style="color:#a5d6ff">$3</span>');

  return (
    <pre
      style={{
        background: '#1e293b',
        color: '#e2e8f0',
        padding: 12,
        borderRadius: 6,
        fontSize: 12,
        lineHeight: 1.6,
        overflow: 'auto',
        maxHeight: 500,
        margin: 0,
        whiteSpace: 'pre',
      }}
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

function TextViewer({ text }) {
  return (
    <pre style={{
      background: '#1e293b',
      color: '#e2e8f0',
      padding: 12,
      borderRadius: 6,
      fontSize: 12,
      lineHeight: 1.5,
      overflow: 'auto',
      maxHeight: 400,
      margin: 0,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    }}>{text}</pre>
  );
}

function detectDataType(data) {
  if (data === null || data === undefined) return 'empty';
  if (typeof data === 'object') return 'json';
  if (typeof data !== 'string') return 'text';
  const trimmed = data.trim();
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) return 'xml';
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try { JSON.parse(trimmed); return 'json-string'; } catch { return 'text'; }
  }
  return 'text';
}

function DataBlock({ data, label }) {
  if (data === null || data === undefined) return null;

  const type = detectDataType(data);
  const typeLabel = type === 'json' || type === 'json-string' ? 'JSON' : type === 'xml' ? 'XML' : 'TEXT';

  let content;
  if (type === 'json') {
    content = <JsonTreeViewer data={data} />;
  } else if (type === 'json-string') {
    try { content = <JsonTreeViewer data={JSON.parse(data)} />; } catch { content = <TextViewer text={data} />; }
  } else if (type === 'xml') {
    content = <XmlViewer xml={data} />;
  } else {
    content = <TextViewer text={String(data)} />;
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          padding: '1px 5px',
          borderRadius: 3,
          background: type === 'xml' ? '#fef3c7' : type === 'json' || type === 'json-string' ? '#dbeafe' : '#f3f4f6',
          color: type === 'xml' ? '#92400e' : type === 'json' || type === 'json-string' ? '#1d4ed8' : '#6b7280',
          letterSpacing: '0.05em',
        }}>{typeLabel}</span>
      </div>
      {content}
    </div>
  );
}

function LogEntry({ log }) {
  const [expanded, setExpanded] = useState(false);
  const svcColor = SERVICE_COLORS[log.service] || { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
  const statusColor = getStatusColor(log.statusCode);
  const time = new Date(log.timestamp);
  const timeStr = time.toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const hasError = !!log.error;

  return (
    <div
      data-testid={`api-log-entry-${log.id}`}
      style={{
        border: `1px solid ${hasError ? '#fca5a5' : '#e5e7eb'}`,
        borderRadius: 8,
        marginBottom: 8,
        background: hasError ? '#fef2f2' : '#fff',
        overflow: 'hidden',
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-toggle-log-${log.id}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          cursor: 'pointer',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace', minWidth: 70 }}>{timeStr}</span>
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          background: svcColor.bg,
          color: svcColor.text,
          border: `1px solid ${svcColor.border}`,
          whiteSpace: 'nowrap',
        }}>{log.service}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#374151', fontFamily: 'monospace' }}>{log.method}</span>
        <span style={{
          fontSize: 12,
          color: '#374151',
          fontFamily: 'monospace',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 100,
        }}>{log.url}</span>
        {log.statusCode && (
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 700,
            background: statusColor.bg,
            color: statusColor.text,
          }}>{log.statusCode}</span>
        )}
        {log.durationMs !== null && (
          <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{log.durationMs}ms</span>
        )}
        <span style={{ fontSize: 14, color: '#9ca3af', transition: 'transform 0.15s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>&#9654;</span>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f3f4f6' }}>
          {log.error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13, marginTop: 12 }}>
              <strong>Error:</strong> {log.error}
            </div>
          )}
          <div style={{ marginTop: log.error ? 0 : 12 }}>
            <DataBlock data={log.requestHeaders} label="Request Headers" />
            <DataBlock data={log.requestBody} label="Request Body" />
            <DataBlock data={log.rawResponse} label="Raw Response" />
            <DataBlock data={log.parsedResponse} label="Parsed Response" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApiLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [serviceFilter, setServiceFilter] = useState('All');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/api/admin/api-logs?limit=200`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch API logs', err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const handleClear = async () => {
    try {
      await fetch(`${apiBase}/api/admin/api-logs`, { method: 'DELETE' });
      setLogs([]);
      setTotal(0);
    } catch (err) {
      console.error('Failed to clear logs', err);
    }
  };

  const filteredLogs = serviceFilter === 'All'
    ? logs
    : logs.filter(l => l.service === serviceFilter);

  return (
    <div data-testid="api-logs-viewer">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Third-Party API Logs</h3>
          <span style={{ fontSize: 12, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 10 }}>
            {filteredLogs.length} / {total}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <select
            data-testid="select-service-filter"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, background: '#fff' }}
          >
            <option value="All">All Services</option>
            {ALL_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              data-testid="checkbox-auto-refresh"
            />
            Auto-refresh
          </label>

          <button
            onClick={fetchLogs}
            disabled={loading}
            data-testid="button-refresh-logs"
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              background: '#fff',
              fontSize: 13,
              cursor: loading ? 'wait' : 'pointer',
              fontWeight: 500,
            }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>

          <button
            onClick={handleClear}
            data-testid="button-clear-logs"
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid #fca5a5',
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 40,
          color: '#9ca3af',
          border: '2px dashed #e5e7eb',
          borderRadius: 8,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>No API calls logged yet</div>
          <div style={{ fontSize: 14 }}>Trigger an OTP flow or form submission to see logs here.</div>
        </div>
      ) : (
        <div>
          {filteredLogs.map(log => (
            <LogEntry key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
