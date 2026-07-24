<template>
    <div ref="container" class="model-view">
        <div v-if="labelPage" class="model-view__sheet-label">
            <strong>{{ labelPage.sonataTitle }}</strong>
        </div>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { pages } from '@/settings/timeline'
import { useTimingStore } from '@/stores/timing'

const container = ref(null)
const timing = useTimingStore()
const dragIndex = ref(null)

//while dragging, the label previews the page the pawn hovers over
const labelPage = computed(() => (dragIndex.value != null ? pages[dragIndex.value] : timing.currentPage))

const modelUrl = '/salomos_temple_5.fbx'

let renderer
let controls
let rafId
let resizeObserver

onMounted(() => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#ffffff')

    const { clientWidth, clientHeight } = container.value
    const camera = new THREE.PerspectiveCamera(45, clientWidth / clientHeight, 0.1, 1000)

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(clientWidth, clientHeight)
    container.value.appendChild(renderer.domElement)

    //Restricted orbit: stay on the open (cutaway) side of the temple, but allow
    //swinging far enough toward +x to glimpse the facade with the pillars.
    controls = new OrbitControls(camera, renderer.domElement)
    controls.minPolarAngle = Math.PI / 2 - 0.35
    controls.maxPolarAngle = Math.PI / 2
    controls.minAzimuthAngle = -0.6
    controls.maxAzimuthAngle = 1.25
    controls.enablePan = true

    scene.add(new THREE.HemisphereLight('#ffffff', '#444444', 2))

    const light = new THREE.DirectionalLight('#ffffff', 2)
    light.position.set(3, 5, 4)
    scene.add(light)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    let pawn = null
    let pawnMaterial = null
    const snapWorld = [] //world position per snap index
    const snapLocal = [] //same, in the pawn's parent space
    const baseTarget = new THREE.Vector3()
    const panLimit = new THREE.Box3()
    const pawnAim = new THREE.Vector3()
    let modelRadius = 0

    function clampTarget() {
        if (!panLimit.isEmpty()) controls.target.clamp(panLimit.min, panLimit.max)
    }

    //Zooming homes in on the pawn: the orbit target is a blend between the
    //overview target and the pawn, driven by how close the camera actually is
    //to the pawn — fully zoomed in, the camera looks straight at the pawn on
    //the floor; zoomed out, the framing returns to the overview.
    function onWheel() {
        if (!pawn || !modelRadius) return

        pawn.getWorldPosition(pawnAim)
        pawnAim.y += modelRadius * 0.02 //aim at the pawn's body, not its base

        const distance = camera.position.distanceTo(pawnAim)
        const focus = THREE.MathUtils.clamp(
            (modelRadius * 1.15 - distance) / (modelRadius * (1.15 - 0.5)),
            0,
            1
        )

        controls.target.lerpVectors(baseTarget, pawnAim, focus)
        clampTarget()
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
        pawnMaterial?.emissive?.set('#7a2a10')
    }

    function onPointerMove(event) {
        if (dragIndex.value != null) {
            setPointerFromEvent(event)
            dragIndex.value = nearestSnapToRay()
        } else {
            renderer.domElement.style.cursor = pawnHit(event) ? 'grab' : ''
        }
    }

    function onPointerUp(event) {
        if (dragIndex.value == null) return

        //release: synchronize everything (audio included) to the chosen snap
        timing.seekToPage(pages[dragIndex.value])
        dragIndex.value = null
        pawnMaterial?.emissive?.set('#000000')
        container.value?.releasePointerCapture(event.pointerId)
    }

    container.value.addEventListener('pointerdown', onPointerDown, true)
    container.value.addEventListener('pointermove', onPointerMove)
    container.value.addEventListener('pointerup', onPointerUp)
    container.value.addEventListener('pointercancel', onPointerUp)
    container.value.addEventListener('wheel', onWheel, { passive: false })

    new FBXLoader().load(
        modelUrl,
        (model) => {
            //the FBX embeds its own lights; keep the scene lighting instead
            const lights = []
            model.traverse((object) => object.isLight && lights.push(object))
            lights.forEach((object) => object.parent?.remove(object))

            const box = new THREE.Box3().setFromObject(model)
            const sphere = box.getBoundingSphere(new THREE.Sphere())
            modelRadius = sphere.radius

            //fitting the model to the center of the scene
            model.position.sub(sphere.center)
            camera.position.set(sphere.radius * 0.1, sphere.radius * 0.12, sphere.radius * 1.05)
            camera.near = Math.max(sphere.radius / 100, 0.1)
            camera.far = sphere.radius * 10
            camera.updateProjectionMatrix()
            baseTarget.set(sphere.radius * 0.1, 0, 0)
            controls.target.copy(baseTarget)
            controls.minDistance = sphere.radius * 0.3
            controls.maxDistance = sphere.radius * 1.4
            //pan/zoom target may roam anywhere inside the recentred model bounds
            panLimit.copy(box).translate(sphere.center.clone().negate())
            controls.update()

            scene.add(model)
            model.updateMatrixWorld(true)

            //collect the snap_000..snap_089 locators (one per music page)
            model.traverse((object) => {
                const match = object.name.match(/^snap_(\d+)$/)
                if (match) snapWorld[Number(match[1])] = object.getWorldPosition(new THREE.Vector3())

                if (object.name === 'Pawn') pawn = object
            })

            if (pawn) {
                pawnMaterial = pawn.material?.clone?.() ?? null
                if (pawnMaterial) pawn.material = pawnMaterial

                snapWorld.forEach((world, i) => {
                    snapLocal[i] = pawn.parent.worldToLocal(world.clone())
                })
                pawn.position.copy(snapLocal[timing.currentPage.snapIndex] ?? pawn.position)
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
            if (target) pawn.position.lerp(target, Math.min(1, dt * 10))
        }

        renderer.render(scene, camera)
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
    })
    resizeObserver.observe(container.value)

    onBeforeUnmount(() => {
        cancelAnimationFrame(rafId)
        resizeObserver?.disconnect()
        container.value?.removeEventListener('pointerdown', onPointerDown, true)
        container.value?.removeEventListener('pointermove', onPointerMove)
        container.value?.removeEventListener('pointerup', onPointerUp)
        container.value?.removeEventListener('pointercancel', onPointerUp)
        container.value?.removeEventListener('wheel', onWheel)
        controls?.dispose()
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

.model-view__sheet-label {
    position: absolute;
    top: 16px;
    left: 16px;
    display: flex;
    flex-direction: column;
    padding: 10px 14px;
    color: #2a2f36;
    pointer-events: none;
    z-index: 1;
}

.model-view :deep(canvas) {
    display: block;
}
</style>
