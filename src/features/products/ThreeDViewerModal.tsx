import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF, Center, Bounds } from '@react-three/drei'
import styles from './ThreeDViewerModal.module.css'

function GLBModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return (
    <Bounds fit clip observe margin={1.2}>
      <Center>
        <primitive object={scene} />
      </Center>
    </Bounds>
  )
}

type Props = {
  glbUrl: string
  onClose: () => void
}

export default function ThreeDViewerModal({ glbUrl, onClose }: Props) {
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
              <GLBModel url={glbUrl} />
              <Environment preset="city" />
            </Suspense>
          </Canvas>
        </div>
      </div>
    </div>
  )
}
