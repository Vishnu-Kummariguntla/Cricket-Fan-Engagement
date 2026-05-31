import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'

function useIsCompactLayout() {
  const [isCompact, setIsCompact] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth <= 760 : false
  })

  useEffect(() => {
    const match = window.matchMedia('(max-width: 760px)')
    const handleChange = () => setIsCompact(match.matches)

    handleChange()
    match.addEventListener('change', handleChange)
    return () => match.removeEventListener('change', handleChange)
  }, [])

  return isCompact
}

export default function IplMuseumScene({ onReady }) {
  const canvasRef = useRef(null)
  const isCompact = useIsCompactLayout()
  const readyRef = useRef(false)

  useEffect(() => {
    const notifyReady = () => {
      if (!readyRef.current) {
        readyRef.current = true
        onReady?.()
      }
    }

    if (isCompact) {
      notifyReady()
      return undefined
    }

    const canvas = canvasRef.current
    if (!canvas) {
      notifyReady()
      return undefined
    }

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(1.25, 48, 48),
      new THREE.MeshStandardMaterial({ color: 0xd72638, roughness: 0.36, metalness: 0.18 }),
    )
    const seam = new THREE.Mesh(
      new THREE.TorusGeometry(1.27, 0.03, 16, 96),
      new THREE.MeshBasicMaterial({ color: 0xf8fafc }),
    )
    const trophy = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.72, 1.6, 40),
      new THREE.MeshStandardMaterial({ color: 0xf7c948, roughness: 0.2, metalness: 0.85 }),
    )
    const lights = [-4, -2, 0, 2, 4].map((x, index) => {
      const light = new THREE.SpotLight(0xffffff, 0, 16, Math.PI / 6, 0.6, 1.2)
      light.position.set(x, 4.5, 3)
      gsap.to(light, { intensity: 12, delay: index * 0.22, duration: 0.7, ease: 'power2.out' })
      scene.add(light)
      return light
    })

    camera.position.set(0, 0.25, 7)
    ball.add(seam)
    seam.rotation.x = Math.PI / 2
    trophy.position.set(0, -0.18, -4)
    trophy.scale.set(0.46, 0.46, 0.46)
    scene.add(ball, trophy, new THREE.AmbientLight(0x335577, 1.8))

    const resize = () => {
      const { clientWidth, clientHeight } = canvas
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(clientWidth, clientHeight, false)
      camera.aspect = clientWidth / Math.max(clientHeight, 1)
      camera.updateProjectionMatrix()
    }

    let frameId = 0
    const render = () => {
      ball.rotation.y += 0.014
      ball.rotation.x += 0.006
      trophy.rotation.y += 0.004
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(render)
    }

    resize()
    render()
    notifyReady()
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      lights.forEach((light) => scene.remove(light))
      renderer.dispose()
      ball.geometry.dispose()
      seam.geometry.dispose()
      trophy.geometry.dispose()
    }
  }, [isCompact, onReady])

  if (isCompact) {
    return (
      <div className="ipl-museum-placeholder" aria-hidden="true">
        <div className="placeholder-icon" />
        <div className="placeholder-copy">
          <strong>IPL Stadium Ready</strong>
          <span>Reduced motion mode for a faster mobile experience.</span>
        </div>
      </div>
    )
  }

  return <canvas className="ipl-museum-canvas" ref={canvasRef} aria-label="Spinning cricket ball in stadium lights" />
}
