import clsx from 'clsx'

export type Step = 1 | 2 | 3 | 4

interface Props {
  current: Step
  onChange: (s: Step) => void
}

const STEPS = [
  { n: 1 as Step, label: '选择会场' },
  { n: 2 as Step, label: '人员设置' },
  { n: 3 as Step, label: '座位排序规则' },
  { n: 4 as Step, label: '预览与导出' },
]

export default function StepWizard({ current, onChange }: Props) {
  return (
    <div className="step-wizard">
      {STEPS.map((s, i) => (
        <>
          <div
            key={s.n}
            className={clsx('step-item', current === s.n && 'active', current > s.n && 'done')}
            onClick={() => onChange(s.n)}
          >
            <div className="step-num">
              {current > s.n ? '✓' : s.n}
            </div>
            <span className="step-label">{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div key={`c${i}`} className={clsx('step-connector', current > s.n && 'done')} />
          )}
        </>
      ))}
    </div>
  )
}
