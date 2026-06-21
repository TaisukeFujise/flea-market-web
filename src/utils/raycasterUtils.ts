import * as THREE from 'three'

// bbox座標はAPI仕様書で 0–1000 の正規化値として定義されている
const BBOX_MAX = 1000

type MappableAngle = 'front' | 'back' | 'right' | 'left'

export function computeRayFromBbox(
  bbox_x1: number,
  bbox_y1: number,
  bbox_x2: number,
  bbox_y2: number,
  angle: MappableAngle,
  box: THREE.Box3,
): { origin: THREE.Vector3; direction: THREE.Vector3 } {
  // bboxの中心をUV座標（0–1）に変換
  const u = (bbox_x1 + bbox_x2) / (BBOX_MAX * 2)
  const v = (bbox_y1 + bbox_y2) / (BBOX_MAX * 2)

  const { min, max } = box
  const size = new THREE.Vector3()
  box.getSize(size)
  const far = Math.max(size.x, size.y, size.z) * 2

  switch (angle) {
    case 'front': {
      const x = min.x + u * size.x
      const y = max.y - v * size.y
      return {
        origin: new THREE.Vector3(x, y, max.z + far),
        direction: new THREE.Vector3(0, 0, -1),
      }
    }
    case 'back': {
      const x = max.x - u * size.x
      const y = max.y - v * size.y
      return {
        origin: new THREE.Vector3(x, y, min.z - far),
        direction: new THREE.Vector3(0, 0, 1),
      }
    }
    case 'right': {
      const z = max.z - u * size.z
      const y = max.y - v * size.y
      return {
        origin: new THREE.Vector3(max.x + far, y, z),
        direction: new THREE.Vector3(-1, 0, 0),
      }
    }
    case 'left': {
      const z = min.z + u * size.z
      const y = max.y - v * size.y
      return {
        origin: new THREE.Vector3(min.x - far, y, z),
        direction: new THREE.Vector3(1, 0, 0),
      }
    }
  }
}

