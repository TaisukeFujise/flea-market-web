export const ANGLES = ['front', 'right', 'back', 'left', 'top'] as const
export type Angle = (typeof ANGLES)[number]

export const ANGLE_LABELS: Record<Angle, string> = {
  front: '正面',
  back: '背面',
  right: '右側面',
  left: '左側面',
  top: '上面',
}

export const CONDITION_LABELS: Record<'good' | 'fair' | 'poor', string> = {
  good: 'ほぼ新品',
  fair: '目立つ傷少なめ',
  poor: '使用感あり',
}

export const DAMAGE_TYPE_LABELS: Record<string, string> = {
  scratch: '傷',
  dirt: '汚れ',
  wear: '使用感',
}
