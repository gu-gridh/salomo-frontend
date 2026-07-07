<template>
    <div ref="container" class="model-view"></div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { cameraPath } from '@/settings/cameraPath'
import { useTimingStore } from '@/stores/timing'

const container = ref(null)
const timing = useTimingStore()

let controls
let renderer
let unwatchTime

const modelUrl = '/HRAMSOLOMONA.fbx'

function getCameraPoint(time) { //returns the camera position in cameraPath.js based on time
    const endIndex = cameraPath.findIndex((point) => point.time >= time)
    if (endIndex === -1) return new THREE.Vector3(...cameraPath[cameraPath.length - 1].position)

    const end = cameraPath[endIndex] ?? cameraPath[cameraPath.length - 1]
    const start = cameraPath[Math.max(endIndex - 1, 0)] ?? end
    const progress = start === end ? 0 : (time - start.time) / (end.time - start.time)

    return new THREE.Vector3(...start.position).lerp(new THREE.Vector3(...end.position), progress)
}

onMounted(() => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#ffffff')

    const { clientWidth, clientHeight } = container.value
    const camera = new THREE.PerspectiveCamera(45, clientWidth / clientHeight, 0.1, 1000)

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(clientWidth, clientHeight)
    container.value.appendChild(renderer.domElement)

    const render = () => renderer.render(scene, camera)
    controls = new OrbitControls(camera, renderer.domElement)
    controls.minPolarAngle = Math.PI / 2 //keep rotation horizontal only
    controls.maxPolarAngle = Math.PI / 2 //keep rotation horizontal only
    controls.addEventListener('change', render)

    scene.add(new THREE.HemisphereLight('#ffffff', '#444444', 2))

    const light = new THREE.DirectionalLight('#ffffff', 2)
    light.position.set(3, 5, 4)
    scene.add(light)

    new FBXLoader().load(
        modelUrl,
        (model) => {
            const sphere = new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere())

            //fitting the model to the center of the scene
            model.position.sub(sphere.center) 
            camera.position.set(0, sphere.radius * 0.1, sphere.radius * 1.1)
            camera.near = Math.max(sphere.radius / 100, 0.1)
            camera.far = sphere.radius * 10
            camera.updateProjectionMatrix()

            scene.add(model)

            unwatchTime = watch( //update camera position based on timing store
                () => timing.time,
                (time) => {
                    camera.position.copy(getCameraPoint(time).multiplyScalar(sphere.radius))
                    controls.update()
                    render()
                },
                { immediate: true }
            )
        },
        undefined,
        (error) => console.error(error)
    )

    render()
})

onBeforeUnmount(() => {
    unwatchTime?.()
    controls?.dispose()
    renderer?.dispose()
    renderer?.domElement.remove()
})
</script>

<style scoped>
.model-view {
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
