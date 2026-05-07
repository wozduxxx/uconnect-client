export default function BgOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div
        className="absolute rounded-full"
        style={{
          width: 700,
          height: 700,
          background: 'radial-gradient(circle, rgba(59,130,246,0.16) 0%, transparent 70%)',
          filter: 'blur(80px)',
          top: -250,
          left: -150,
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(139,92,246,0.13) 0%, transparent 70%)',
          filter: 'blur(80px)',
          bottom: -200,
          right: -150,
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(16,185,129,0.09) 0%, transparent 70%)',
          filter: 'blur(60px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  )
}
