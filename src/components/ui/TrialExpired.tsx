export default function TrialExpired() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '48px 56px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        backdropFilter: 'blur(12px)',
        maxWidth: 440,
      }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
        <div style={{
          fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 8,
        }}>
          试用期已结束
        </div>
        <div style={{
          fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginBottom: 32,
        }}>
          您的 7 天免费试用已到期。<br />
          请联系开发者获取正式授权版本。
        </div>
        <div style={{
          display: 'inline-block',
          padding: '10px 24px',
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.4)',
          borderRadius: 8,
          color: '#a5b4fc',
          fontSize: 13,
          letterSpacing: '0.02em',
        }}>
          会场座位智能定制系统 · 离线版
        </div>
      </div>
    </div>
  )
}
