'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const CLAN = ['#8B1A1A','#C8960C','#4A5E3A','#2C5F7A','#7A3B6B','#8B5E1A','#1A4A3A']

// 3 nested elliptical orbits, each with a distinct tilt and speed
const ORBITS = [
  { a: 2.6, b: 1.1,  tilt: 0.38,  speed: 0.28,  count: 120, size: 0.022 },
  { a: 3.4, b: 1.55, tilt: -0.22, speed: -0.18, count: 140, size: 0.016 },
  { a: 4.1, b: 1.9,  tilt: 0.55,  speed: 0.12,  count: 110, size: 0.012 },
]

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 0, 5)

    const updateCamera = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    updateCamera()
    const positionStar = () => {
      const halfH = camera.position.z * Math.tan((camera.fov * Math.PI) / 360)
      grp.position.x = halfH * camera.aspect * 0.3
    }
    const resize = () => { updateCamera(); positionStar() }
    window.addEventListener('resize', resize)

    // Lighting — boosted for physical material
    scene.add(new THREE.AmbientLight(0xfff8f0, 0.6))

    const key = new THREE.DirectionalLight(0xfff5e0, 4.0)
    key.position.set(6, 8, 5)
    scene.add(key)

    const pl = new THREE.PointLight(0xC8960C, 5.0, 40)
    pl.position.set(5, 6, 4)
    scene.add(pl)

    const fl = new THREE.PointLight(0x2C5F7A, 1.2, 60)
    fl.position.set(-5, -3, 3)
    scene.add(fl)

    // Rim light from behind for iridescent edge catchlight
    const rim = new THREE.PointLight(0xE8B84B, 2.5, 30)
    rim.position.set(-3, -4, -3)
    scene.add(rim)

    const grp = new THREE.Group()
    scene.add(grp)

    // Star points with iridescent physical material
    const R = 1.5, r = 0.68, depth = 0.3, n = 7
    const st = (Math.PI * 2) / n, ht = st / 2

    for (let i = 0; i < n; i++) {
      const oa = i * st - Math.PI / 2
      const tip = new THREE.Vector2(R * Math.cos(oa), R * Math.sin(oa))
      const lft = new THREE.Vector2(r * Math.cos(oa - ht), r * Math.sin(oa - ht))
      const rgt = new THREE.Vector2(r * Math.cos(oa + ht), r * Math.sin(oa + ht))
      const shape = new THREE.Shape([new THREE.Vector2(0, 0), lft, tip, rgt])
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: 0.06,
        bevelSize: 0.04,
        bevelSegments: 4,
      })
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(CLAN[i]),
        metalness: 0.85,
        roughness: 0.12,
        iridescence: 1.0,
        iridescenceIOR: 1.72,
        iridescenceThicknessRange: [80, 500],
        reflectivity: 0.9,
        clearcoat: 0.6,
        clearcoatRoughness: 0.08,
      })
      grp.add(new THREE.Mesh(geo, mat))
    }
    positionStar()

    // Orbiting constellation particles
    const orbitGroups: THREE.Points[] = []
    const orbitOffsets: number[] = []

    ORBITS.forEach((orb, oi) => {
      const positions = new Float32Array(orb.count * 3)
      const colors = new Float32Array(orb.count * 3)

      for (let i = 0; i < orb.count; i++) {
        // Distribute with slight random scatter for natural look
        const phase = (i / orb.count) * Math.PI * 2 + (Math.random() - 0.5) * 0.18
        const scatter = (Math.random() - 0.5) * 0.12
        positions[i * 3]     = Math.cos(phase) * (orb.a + scatter)
        positions[i * 3 + 1] = Math.sin(phase) * (orb.b + scatter)
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3

        const c = new THREE.Color(CLAN[(i + oi * 2) % CLAN.length])
        // Vary brightness so particles twinkle subtly
        const bright = 0.6 + Math.random() * 0.4
        colors[i * 3]     = c.r * bright
        colors[i * 3 + 1] = c.g * bright
        colors[i * 3 + 2] = c.b * bright
      }

      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      const mat = new THREE.PointsMaterial({
        size: orb.size,
        vertexColors: true,
        transparent: true,
        opacity: 0.78,
        sizeAttenuation: true,
      })

      const points = new THREE.Points(geo, mat)
      // Tilt each orbit ring on X axis for 3D depth
      points.rotation.x = orb.tilt
      orbitGroups.push(points)
      orbitOffsets.push(Math.random() * Math.PI * 2)
      grp.add(points)
    })

    let mx = 0, my = 0, tx = 0, ty = 0
    const onMouseMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2
      my = (e.clientY / window.innerHeight - 0.5) * 2
    }
    document.addEventListener('mousemove', onMouseMove)

    let rafId: number
    let t = 0
    const animate = () => {
      rafId = requestAnimationFrame(animate)
      t += 0.012
      tx += (mx - tx) * 0.055
      ty += (my - ty) * 0.055

      grp.rotation.y += 0.0025 + tx * 0.018
      grp.rotation.x += (-ty * 0.35 - grp.rotation.x) * 0.08
      grp.rotation.z += (tx * 0.12 - grp.rotation.z) * 0.06

      const b = 1 + Math.sin(t) * 0.024
      grp.scale.setScalar(b)

      // Spin each orbit ring at its own rate
      orbitGroups.forEach((pts, i) => {
        pts.rotation.z = orbitOffsets[i] + t * ORBITS[i].speed
        // Gentle pulse opacity
        ;(pts.material as THREE.PointsMaterial).opacity =
          0.65 + Math.sin(t * 0.7 + i * 1.1) * 0.13
      })

      // Rim light slowly orbits for dynamic iridescent catchlight
      rim.position.x = Math.sin(t * 0.4) * 5
      rim.position.y = Math.cos(t * 0.3) * 4

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(rafId)
      renderer.dispose()
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas id="hero-canvas" ref={canvasRef} />
}
