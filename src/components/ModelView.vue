<template>
    <div ref="container" class="model-view"></div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { pages } from '@/settings/timeline'
import { useTimingStore } from '@/stores/timing'
import { disposeObject3D } from '@/utils/disposeObject3D'

const container = ref(null)
const timing = useTimingStore()
const dragIndex = ref(null)

const modelUrl = '/salomos_temple_5.fbx'

let renderer
let controls
let rafId
let resizeObserver

onMounted(() => {
    let disposed = false
    let originalPawnMaterial
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#ffffff')

    const { clientWidth, clientHeight } = container.value
    const camera = new THREE.PerspectiveCamera(45, clientWidth / clientHeight, 0.1, 1000)

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(clientWidth, clientHeight)
    container.value.appendChild(renderer.domElement)

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    composer.addPass(
        new UnrealBloomPass(new THREE.Vector2(clientWidth, clientHeight), 0.8, 0.4, 1)
    )

    //Restricted orbit: stay on the open (cutaway) side of the temple, but allow
    //swinging far enough toward +x to glimpse the facade with the pillars.
    controls = new OrbitControls(camera, renderer.domElement)
    controls.minPolarAngle = Math.PI / 2 - 0.35
    controls.maxPolarAngle = Math.PI / 2
    controls.minAzimuthAngle = -0.6
    controls.maxAzimuthAngle = 1.25
    controls.enablePan = true

    scene.add(new THREE.HemisphereLight('#ffffff', '#444444', 1.2))

    const light = new THREE.DirectionalLight('#ffffff', 2)
    light.castShadow = true
    light.shadow.mapSize.set(2048, 2048)
    light.shadow.normalBias = 2
    scene.add(light)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    let pawn = null
    let pawnMaterial = null
    const snapWorld = [] //world position per snap index
    const snapLocal = [] //same, in the pawn's parent space
    const panLimit = new THREE.Box3()
    const previousPawnPosition = new THREE.Vector3()
    const pawnMovement = new THREE.Vector3()

    function clampTarget() {
        if (!panLimit.isEmpty()) controls.target.clamp(panLimit.min, panLimit.max)
    }

    controls.addEventListener('change', clampTarget)

    function setPointerFromEvent(event) {
        const rect = renderer.domElement.getBoundingClientRect()
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
    }

    function pawnHit(event) {
        if (!pawn) return false
        setPointerFromEvent(event)

        return raycaster.intersectObject(pawn, true).length > 0
    }

    function setPawnGlow(glowing) {
        if (pawnMaterial) pawnMaterial.emissiveIntensity = glowing ? 1.7 : 0.8
    }

    function nearestSnapToRay() {
        let best = 0
        let bestDistance = Infinity

        for (let i = 0; i < snapWorld.length; i += 1) {
            const distance = raycaster.ray.distanceSqToPoint(snapWorld[i])
            if (distance < bestDistance) {
                bestDistance = distance
                best = i
            }
        }

        return best
    }

    //Drag handling lives on the container in the capture phase so a drag on the
    //pawn never reaches OrbitControls (which listens on the canvas itself).
    function onPointerDown(event) {
        if (event.button !== 0 || !pawnHit(event)) return

        event.stopPropagation()
        dragIndex.value = timing.currentPage.snapIndex
        container.value.setPointerCapture(event.pointerId)
        setPawnGlow(true)
    }

    function onPointerMove(event) {
        if (dragIndex.value != null) {
            setPointerFromEvent(event)
            dragIndex.value = nearestSnapToRay()
        } else {
            const hovered = pawnHit(event)
            renderer.domElement.style.cursor = hovered ? 'grab' : ''
            setPawnGlow(hovered)
        }
    }

    function onPointerLeave() {
        if (dragIndex.value == null) setPawnGlow(false)
    }

    function onPointerUp(event) {
        if (dragIndex.value == null) return

        //release: synchronize everything (audio included) to the chosen snap
        timing.seekToPage(pages[dragIndex.value])
        dragIndex.value = null
        setPawnGlow(true)
        container.value?.releasePointerCapture(event.pointerId)
    }

    container.value.addEventListener('pointerdown', onPointerDown, true)
    container.value.addEventListener('pointermove', onPointerMove)
    container.value.addEventListener('pointerleave', onPointerLeave)
    container.value.addEventListener('pointerup', onPointerUp)
    container.value.addEventListener('pointercancel', onPointerUp)

    new FBXLoader().load(
        modelUrl,
        (model) => {
            if (disposed) {
                disposeObject3D(model)
                return
            }
            //the FBX embeds its own lights; keep the scene lighting instead
            const lights = []
            model.traverse((object) => object.isLight && lights.push(object))
            lights.forEach((object) => {
                object.shadow?.dispose()
                object.parent?.remove(object)
            })

            const box = new THREE.Box3().setFromObject(model)
            const sphere = box.getBoundingSphere(new THREE.Sphere())

            //fitting the model to the center of the scene
            model.position.sub(sphere.center)
            camera.position.set(sphere.radius * 0.1, sphere.radius * 0.12, sphere.radius * 1.05)
            camera.near = Math.max(sphere.radius / 100, 0.1)
            camera.far = sphere.radius * 10
            camera.updateProjectionMatrix()
            controls.target.set(sphere.radius * 0.1, 0, 0)
            controls.minDistance = sphere.radius * 0.3
            controls.maxDistance = sphere.radius * 1.4
            //pan/zoom target may roam anywhere inside the recentred model bounds
            panLimit.copy(box).translate(sphere.center.clone().negate())
            controls.update()

            light.position.set(sphere.radius * 1.5, sphere.radius * 0.65, sphere.radius * 0.5)
            light.target.position.set(-sphere.radius / 3, box.min.y + model.position.y, 0)
            scene.add(light.target)
            Object.assign(light.shadow.camera, {
                left: -sphere.radius, right: sphere.radius,
                top: sphere.radius, bottom: -sphere.radius,
                near: sphere.radius * 0.01, far: sphere.radius * 5,
            })
            light.shadow.camera.updateProjectionMatrix()

            const ground = new THREE.Mesh(
                new THREE.PlaneGeometry(sphere.radius * 6, sphere.radius * 6),
                new THREE.ShadowMaterial({ opacity: 0.25 })
            )
            ground.rotation.x = -Math.PI / 2
            ground.position.y = box.min.y + model.position.y - 1
            ground.receiveShadow = true
            scene.add(ground)

            scene.add(model)
            model.updateMatrixWorld(true)

            //collect the snap_000..snap_089 locators (one per music page)
            model.traverse((object) => {
                if (object.isMesh) {
                    object.castShadow = true
                    object.receiveShadow = true
                }
                const match = object.name.match(/^snap_(\d+)$/)
                if (match) snapWorld[Number(match[1])] = object.getWorldPosition(new THREE.Vector3())

                if (object.name === 'Pawn') pawn = object
            })

            if (pawn) {
                pawnMaterial = pawn.material?.clone?.() ?? null
                if (pawnMaterial) {
                    originalPawnMaterial = pawn.material
                    pawn.material = pawnMaterial
                    pawnMaterial.color?.set('#fc783a')
                    pawnMaterial.emissive?.set('#fc783a')
                    pawnMaterial.emissiveIntensity = 0.8
                }

                snapWorld.forEach((world, i) => {
                    snapLocal[i] = pawn.parent.worldToLocal(world.clone())
                })
                pawn.position.copy(snapLocal[timing.currentPage.snapIndex] ?? pawn.position)
                camera.position.set(1189.4983941573569, -595.4501678437462, 6233.059615806372)
                controls.target.set(3824.999806229417, -1318.8512911126936, -0.000014662861511573338)
                controls.update()
            }
        },
        undefined,
        (error) => console.error(error)
    )

    let lastFrame = performance.now()

    function animate(now) {
        const dt = Math.min((now - lastFrame) / 1000, 0.1)
        lastFrame = now

        if (pawn && snapLocal.length) {
            const index = dragIndex.value ?? timing.currentPage.snapIndex
            const target = snapLocal[index]
            if (target) {
                pawn.getWorldPosition(previousPawnPosition)
                pawn.position.lerp(target, Math.min(1, dt * 10))
                pawn.getWorldPosition(pawnMovement).sub(previousPawnPosition)
                camera.position.add(pawnMovement)
                controls.target.add(pawnMovement)
                controls.update()
            }
        }

        composer.render()
        rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)

    resizeObserver = new ResizeObserver(() => {
        const width = container.value?.clientWidth
        const height = container.value?.clientHeight
        if (!width || !height) return

        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
        composer.setSize(width, height)
    })
    resizeObserver.observe(container.value)

    onBeforeUnmount(() => {
        disposed = true
        cancelAnimationFrame(rafId)
        resizeObserver?.disconnect()
        container.value?.removeEventListener('pointerdown', onPointerDown, true)
        container.value?.removeEventListener('pointermove', onPointerMove)
        container.value?.removeEventListener('pointerleave', onPointerLeave)
        container.value?.removeEventListener('pointerup', onPointerUp)
        container.value?.removeEventListener('pointercancel', onPointerUp)
        controls?.dispose()
        composer.passes.forEach((pass) => pass.dispose())
        composer.dispose()
        disposeObject3D(scene, originalPawnMaterial ? [originalPawnMaterial] : [])
        scene.clear()
        renderer?.dispose()
        renderer?.domElement.remove()
    })
})
</script>

<style scoped>
.model-view {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 220px;
    overflow: hidden;
    background: #ffffff;
}

.model-view :deep(canvas) {
    display: block;
}
</style>
