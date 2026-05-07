export default function Input({ label, type = 'text', placeholder, value, onChange, id }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="field"
      />
    </div>
  )
}
