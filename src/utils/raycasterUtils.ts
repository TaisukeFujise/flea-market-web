import * as THREE from 'three'

type MappableAngle = 'front' | 'back' | 'right' | 'left'

export function computeRayFromBbox(
  bbox_x1: number,
  bbox_y1: number,
  bbox_x2: number,
  bbox_y2: number,
  angle: MappableAngle,
  box: THREE.Box3,
): { origin: THREE.Vector3; direction: THREE.Vector3 } {
  const u = (bbox_x1 + bbox_x2) / 2000
  const v = (bbox_y1 + bbox_y2) / 2000

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

export function collectMeshes(object: THREE.Object3D): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = []
  object.traverse(obj => {
    if ((obj as THREE.Mesh).isMesh) {
      meshes.push(obj as THREE.Mesh)
    }
  })
  return meshes
}
