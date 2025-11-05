export const createScene = function (engine) {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);  // Make background transparent

    const modelUrl = "https://raw.githubusercontent.com/HenryWuJiaL/AR-HW5/main/";
    const modelFileName = "walking1.glb";

    BABYLON.SceneLoader.ImportMesh(
        "", 
        modelUrl, 
        modelFileName, 
        scene, 
        (meshes, particleSystems, skeletons, animationGroups) => {
            const root = meshes[0];
            root.scaling.scaleInPlace(0.2);  // Scale model size
            root.position = new BABYLON.Vector3(0, 0, 0);  // Set initial position

            scene.createDefaultXRExperienceAsync({
                uiOptions: { sessionMode: "immersive-ar" }
            }).then((xr) => {
                console.log("WebXR AR Experience initialized.");
                setupActions(root, animationGroups);
            }).catch((error) => {
                console.error("WebXR initialization failed, running in 3D fallback:", error);
                BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
                setupActions(root, animationGroups); 
            });
        },
        null,
        (scene, message) => { 
            console.error("Model import failed:", message);
        }
    );

    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(engine.getRenderingCanvas(), true);  // Attach camera control
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    return scene;
};

function setupActions(modelRoot, animationGroups) {
    // Index animation groups
    const animIndex = {};
    animationGroups.forEach(grp => animIndex[grp.name] = grp);
    
    const walkAnimGroup = animIndex["Armature.001Action"];

    // Get the head's Morph Targets Manager
    const headMesh = modelRoot.getChildren().find(m => m.name === "Head"); 
    if (!headMesh || !headMesh.morphTargetManager) {
        console.warn("Morph Target Manager not found. Check mesh name and Shape Keys export.");
    }

    const morphTargetManager = headMesh?.morphTargetManager || null;
    const happyTarget = morphTargetManager?.getTarget(0) || null;
    const surprisedTarget = morphTargetManager?.getTarget(1) || null;

    // Keyboard listener
    window.addEventListener('keydown', (event) => {
        animationGroups.forEach(ag => ag.stop());  // Stop all animations
        if (happyTarget) happyTarget.influence = 0;
        if (surprisedTarget) surprisedTarget.influence = 0;

        switch (event.key) {
            case '1': // Walk animation
                if (walkAnimGroup) walkAnimGroup.start(true);
                break;
            case '2': // Happy expression
                if (happyTarget) happyTarget.influence = 1;
                break;
            case '3': // Surprised expression
                if (surprisedTarget) surprisedTarget.influence = 1;
                break;
        }
    });

    console.log("Action controls initialized. Use keys 1, 2, 3.");
}