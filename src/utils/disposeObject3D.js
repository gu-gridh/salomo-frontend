export function disposeObject3D(root, extraMaterials = []) {
    const resources = new Set()
    const materials = new Set(extraMaterials)

    root.traverse((object) => {
        if (object.geometry) resources.add(object.geometry)
        if (object.skeleton) resources.add(object.skeleton)
        if (object.shadow) resources.add(object.shadow)
        const assigned = Array.isArray(object.material) ? object.material : [object.material]
        assigned.filter(Boolean).forEach((material) => materials.add(material))
    })

    for (const material of materials) {
        resources.add(material)
        for (const value of Object.values(material)) {
            if (value?.isTexture) resources.add(value)
        }
    }

    resources.forEach((resource) => resource.dispose())
}
