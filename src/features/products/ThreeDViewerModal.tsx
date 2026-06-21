import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { apiFetch } from '../../utils/api'
import { computeRayFromBbox } from '../../utils/raycasterUtils'
import type { Damage, ProductImage } from '../../utils/types'
import styles from './ThreeDViewerModal.module.css'

const MAPPABLE_ANGLES = new Set(['front', 'back', 'right', 'left'])

type GLBModelProps = {
  url: string
  damages: Damage[]
  images: ProductImage[]
}

function GLBModel({ url, damages, images }: GLBModelProps) {
  const { scene } = useGLTF(url)
  const normalizedGroupRef = useRef<THREE.Group>(null)
  const patchedIdsRef = useRef<Set<string>>(new Set())
  const markerGroupsRef = useRef<THREE.Group[]>([])

  useFrame(({ clock, camera }) => {
    const s = 1 + 0.3 * Math.sin(clock.elapsedTime * 3)
    for (const markerGroup of markerGroupsRef.current) {
      const sphere = markerGroup.children[0] as THREE.Mesh
      sphere.scale.setScalar(s)
      const ring = markerGroup.children[1] as THREE.Mesh
      ring.lookAt(camera.position)
    }
  })

  useEffect(() => {
    const group = normalizedGroupRef.current
    if (!group) return

    // Reset scene to identity before normalizing (handles cached scene reuse)
    scene.position.set(0, 0, 0)
    scene.scale.set(1, 1, 1)
    scene.rotation.set(0, 0, 0)

    // Compute bbox and apply combined center + scale normalization
    const prebox = new THREE.Box3().setFromObject(group)
    const center = new THREE.Vector3()
    prebox.getCenter(center)
    const size = new THREE.Vector3()
    prebox.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = maxDim > 0 ? 1 / maxDim : 1

    // scene.position = -scale * center ensures model center stays at world origin after scaling
    scene.scale.setScalar(scale)
    scene.position.copy(center).multiplyScalar(-scale)

    // Recompute normalized bbox for raycasting formulas
    const box = new THREE.Box3().setFromObject(group)

    // Collect GLB meshes before adding marker meshes (marker追加前に収集してmarkerがraycastに混入しないようにする)
    const modelMeshes: THREE.Mesh[] = []
    group.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) modelMeshes.push(obj as THREE.Mesh)
    })

    const sphereMaterial = new THREE.MeshBasicMaterial({ color: '#ff3333' })
    const sphereGeometry = new THREE.SphereGeometry(0.025, 16, 16)
    const ringMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide })
    const ringGeometry = new THREE.RingGeometry(0.035, 0.055, 32)
    const addedGroups: THREE.Group[] = []

    function addMarker(position: THREE.Vector3) {
      const markerGroup = new THREE.Group()
      markerGroup.position.copy(position)
      markerGroup.add(new THREE.Mesh(sphereGeometry, sphereMaterial))
      markerGroup.add(new THREE.Mesh(ringGeometry, ringMaterial))
      group!.add(markerGroup)
      addedGroups.push(markerGroup)
      markerGroupsRef.current.push(markerGroup)
    }

    // Display existing 3D markers
    for (const d of damages) {
      if (d.model_x !== null && d.model_y !== null && d.model_z !== null) {
        addMarker(new THREE.Vector3(d.model_x, d.model_y, d.model_z))
      }
    }

    // Raycast damages without 3D coords
    if (modelMeshes.length > 0) {
      const raycaster = new THREE.Raycaster()
      const pendingDamages = damages.filter(
        d => (d.model_x === null || d.model_y === null || d.model_z === null)
          && !patchedIdsRef.current.has(d.id),
      )

      for (const dmg of pendingDamages) {
        const image = images.find(img => img.id === dmg.image_id)
        if (!image || !MAPPABLE_ANGLES.has(image.angle)) continue

        const ray = computeRayFromBbox(
          dmg.bbox_x1,
          dmg.bbox_y1,
          dmg.bbox_x2,
          dmg.bbox_y2,
          image.angle as 'front' | 'back' | 'right' | 'left',
          box,
        )

        raycaster.set(ray.origin, ray.direction)
        const hits = raycaster.intersectObjects(modelMeshes, false)
        if (hits.length === 0) continue

        const localPoint = group.worldToLocal(hits[0].point.clone())
        addMarker(localPoint)

        apiFetch(`/api/damages/${dmg.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ model_x: localPoint.x, model_y: localPoint.y, model_z: localPoint.z }),
        })
          .then(() => patchedIdsRef.current.add(dmg.id))
          .catch(err => console.error(`Failed to persist 3D coords for damage ${dmg.id}`, err))
      }
    }

    return () => {
      for (const markerGroup of addedGroups) {
        group.remove(markerGroup)
      }
      markerGroupsRef.current = markerGroupsRef.current.filter(g => !addedGroups.includes(g))
      sphereGeometry.dispose()
      sphereMaterial.dispose()
      ringGeometry.dispose()
      ringMaterial.dispose()
    }
  }, [scene, damages, images])

  return (
    <group ref={normalizedGroupRef}>
      <primitive object={scene} />
    </group>
  )
}

type Props = {
  glbUrl: string
  damages: Damage[]
  images: ProductImage[]
  onClose: () => void
}

export default function ThreeDViewerModal({ glbUrl, damages, images, onClose }: Props) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>3Dモデルビューア</span>
          <button className={styles.closeBtn} onClick={onClose}>閉じる</button>
        </div>
        <div className={styles.canvasWrapper}>
          <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <OrbitControls makeDefault />
            <Suspense fallback={null}>
              <GLBModel url={glbUrl} damages={damages} images={images} />
              <Environment preset="city" />
            </Suspense>
          </Canvas>
        </div>
      </div>
    </div>
  )
}
