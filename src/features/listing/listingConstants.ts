export const ANGLES = ['front', 'right', 'back', 'left', 'top'] as const
export type Angle = (typeof ANGLES)[number]

export const ANGLE_LABELS: Record<Angle, string> = {
  front: '正面',
  back: '背面',
  right: '右側面',
  left: '左側面',
  top: '上面',
}

// 出品フロー内のAI傷検出結果表示用ラベル
export const CONDITION_LABELS: Record<'good' | 'fair' | 'poor', string> = {
  good: '良い',
  fair: 'やや傷あり',
  poor: '傷あり',
}
