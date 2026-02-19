import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

function CameraController({ cameraView, controlsRef, viewTrigger }) {
    const { camera } = useThree()

    useEffect(() => {
        if (!camera || !controlsRef.current) return

        let targetPosition
        // Note: Lenses are rotated 90° around X-axis, so we need to adjust camera positions
        switch (cameraView) {
            case 'top':
                targetPosition = [0, 250, 0] // Looking from top (Y+) shows top view due to rotation
                break
            case 'front':
                targetPosition = [0, 0, 250] // Looking from front (Z+) shows front view due to rotation
                break
            case 'side':
                targetPosition = [250, 0, 0] // Looking from side (X+) shows side view
                break
            default:
                targetPosition = [0, 0, 250]
        }

        camera.position.set(...targetPosition)
        controlsRef.current.target.set(0, 0, 0)
        controlsRef.current.update()
    }, [cameraView, viewTrigger, camera, controlsRef])

    return null
}

export default CameraController
