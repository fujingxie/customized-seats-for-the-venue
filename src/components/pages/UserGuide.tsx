import { LayoutGrid, Users, Armchair, Eye, MessageCircle, CheckCircle2 } from 'lucide-react'

interface Section {
  icon: React.ReactNode
  color: string
  title: string
  subtitle: string
  steps: string[]
  tips?: string[]
}

const SECTIONS: Section[] = [
  {
    icon: <LayoutGrid size={20} />,
    color: '#6366f1',
    title: '会场管理',
    subtitle: '第一步：创建你的会场',
    steps: [
      '点击右上角「新建会场」按钮',
      '填写会场名称，选择会场类型（圆形、椭圆形、方形、U型）',
      '根据实际情况配置座位数量（台上人数、台下排数/列数等）',
      '创建完成后，点击会场卡片上的「排座」进入排座流程',
    ],
    tips: [
      '方形和U型会场支持台上嘉宾区与台下参会区',
      '圆形和椭圆形适合圆桌会议，无台上台下之分',
      '可以创建多个会场，分别管理不同场次',
    ],
  },
  {
    icon: <Users size={20} />,
    color: '#10b981',
    title: '人员管理',
    subtitle: '第二步：维护全局人员库',
    steps: [
      '点击「人员管理」进入全局人员库',
      '手动添加：填写姓名和所属标签（如公司名）后点击「添加」',
      '批量导入：点击「导入」，支持 Excel 或文本格式，可为这批人打上统一标签',
      '导入格式：Excel 第一列为姓名，无需填写排名（排名在分配到会场时设置）',
      '支持按标签筛选查看，方便管理来自不同单位的人员',
    ],
    tips: [
      '人员库是全局共用的，导入一次即可用于所有会场',
      '标签（如「腾讯」「阿里」）用于区分人员来源，方便筛选',
      '支持批量选中后一键删除',
    ],
  },
  {
    icon: <Armchair size={20} />,
    color: '#f59e0b',
    title: '座位排序',
    subtitle: '第三步：分配人员并自动排座',
    steps: [
      '在左侧选择要排座的会场',
      '点击右上角「从人员库选人」，从全局人员库中勾选参会人员',
      '选人时需选择区域（台上嘉宾组 / 参会人员组），系统自动分配排名',
      '选择排序规则（从中间左右交替、顺时针、逆时针）',
      '点击「自动生成座位方案」，系统根据规则自动完成座位分配',
      '可拖拽右侧人员列表调整顺序，也可点击两个座位互换位置',
    ],
    tips: [
      '「从中间左右交替」适合主席台：1号居中，2号左侧，3号右侧……',
      '调整排序规则后，座位方案会立即重新生成',
      '可点击「清空排座」重新来过，人员信息不会丢失',
    ],
  },
  {
    icon: <Eye size={20} />,
    color: '#3b82f6',
    title: '预览与导出',
    subtitle: '第四步：查看并导出座位方案',
    steps: [
      '点击底部「预览与导出方案」或导航栏「预览与导出」',
      '查看完整的座位示意图和图例',
      '点击「导出图片」将座位图保存为 PNG 文件',
      '点击「导出 PDF」生成 A4 横向 PDF 文档',
      '点击「打印」直接调用系统打印，打印内容仅为座位图',
    ],
    tips: [
      '导出前请确认所有座位均已分配（已落座状态）',
      '如有未分配人员，可返回座位排序补充或调整',
    ],
  },
]

export default function UserGuide() {
  return (
    <div className="page-content" style={{ maxWidth: 860, margin: '0 auto' }}>

      {/* 快速流程 */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f122 0%, #10b98122 100%)',
        border: '1px solid #6366f133',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 28,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 14 }}>快速上手流程</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
          {['创建会场', '维护人员库', '分配人员 & 排座', '导出方案'].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '8px 14px',
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#6366f1', color: 'white',
                  fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>{i + 1}</span>
                <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{step}</span>
              </div>
              {i < 3 && (
                <span style={{ color: 'var(--text3)', fontSize: 16, margin: '0 6px' }}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 各模块详细说明 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {SECTIONS.map((sec, idx) => (
          <div key={idx} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              background: sec.color + '0d',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: sec.color + '22',
                border: `1px solid ${sec.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: sec.color, flexShrink: 0,
              }}>
                {sec.icon}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{sec.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{sec.subtitle}</div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '16px 20px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {/* Steps */}
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>操作步骤</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sec.steps.map((step, si) => (
                    <div key={si} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: sec.color + '18',
                        border: `1px solid ${sec.color}44`,
                        color: sec.color,
                        fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: 1,
                      }}>{si + 1}</span>
                      <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              {sec.tips && (
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>💡 小提示</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {sec.tips.map((tip, ti) => (
                      <div key={ti} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <CheckCircle2 size={13} color={sec.color} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 联系方式 */}
      <div style={{
        marginTop: 28,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: '#07c16022', border: '1px solid #07c16044',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#07c160', flexShrink: 0,
          }}>
            <MessageCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
              有问题？联系开发者
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>
              功能咨询、问题反馈、正式授权
            </div>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#07c16012',
          border: '1px solid #07c16033',
          borderRadius: 8, padding: '10px 18px',
        }}>
          <MessageCircle size={16} color="#07c160" />
          <div>
            <div style={{ fontSize: 11, color: '#07c160', marginBottom: 2 }}>微信号</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.02em' }}>
              xxieSir
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
