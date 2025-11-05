//
// Use "export" (depending on your Playground mode) and "async" (because the model needs to be loaded)
//
export const createScene = async function () {
    const scene = new BABYLON.Scene(engine);

    // --- Basic Setup ---
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 3, new BABYLON.Vector3(0, 1, 0), scene);
    camera.attachControl(canvas, true);
    camera.wheelDeltaPercentage = 0.01; // Adjust zoom speed

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    // --- State Variables (for storing references) ---
    let walkAnim = null;
    let idleAnim = null;
    let happyMorph = null;
    let surprisedMorph = null;
    let morphManager = null;

    // --- Load Model ---
    // !!! Loading your model from GitHub !!!
    try {
        const { meshes, animationGroups } = await BABYLON.SceneLoader.ImportMeshAsync(
            "",
            "https://github.com/HenryWuJiaL/AR-HW5/raw/refs/heads/main/",
            "walking1.glb",
            scene
        );
        console.log("Model 'walking1.glb' loaded successfully.");

        // --- Find Animations and Morph Targets ---
        const rootMesh = meshes[0];
        rootMesh.position.y = 0; // Ensure the model is on the ground

        // 1. Find Animation Groups
        // These names come from your C# script
        walkAnim = scene.getAnimationGroupByName("WalkAction");
        idleAnim = scene.getAnimationGroupByName("Idle"); // Based on the "Idle" state in the C# script

        if (walkAnim) console.log("Successfully found 'WalkAction' animation");
        else console.warn("'WalkAction' animation not found! Please check the NLA track name in Blender.");

        if (idleAnim) {
            console.log("Successfully found 'Idle' animation");
            idleAnim.play(true); // Play idle animation by default
        } else {
            console.warn("'Idle' animation not found! The model might not stop walking when switching expressions.");
        }

        // 2. Find Morph Targets (Blend Shapes)
        const skinnedMesh = rootMesh.getChildMeshes(false, (node) => node.morphTargetManager && node.morphTargetManager.numTargets > 0)[0];

        if (skinnedMesh && skinnedMesh.morphTargetManager) {
            morphManager = skinnedMesh.morphTargetManager;
            console.log(`Found ${morphManager.numTargets} Morph Targets in the model.`);
            
            // Find by name based on the C# script
            happyMorph = morphManager.getTargetByName("Happy_Face");
            surprisedMorph = morphManager.getTargetByName("Surprised_Face");

            if (happyMorph) console.log("Successfully found 'Happy_Face' morph target");
            else console.warn("'Happy_Face' morph target not found! Please check the Shape Key name in Blender.");

            if (surprisedMorph) console.log("Successfully found 'Surprised_Face' morph target");
            else console.warn("'Surprised_Face' morph target not found! Please check the Shape Key name in Blender.");

        } else {
            console.error("SkinnedMesh or MorphTargetManager not found in the model! Cannot control facial expressions.");
        }

    } catch (e) {
        console.error("Failed to load model 'walking1.glb'. Please check if the GitHub link is correct and the file exists.", e);
        // If the model fails to load, create a placeholder sphere
        BABYLON.MeshBuilder.CreateSphere("errorSphere", {diameter: 1}, scene).position.y = 1;
    }


    // --- Logic Functions (Translated from C#) ---

    // Reset all facial expressions
    function resetFacialExpressions() {
        if (morphManager) {
            for (let i = 0; i < morphManager.numTargets; i++) {
                // In C# it's 0-100, in Babylon.js it's 0-1
                morphManager.getTarget(i).influence = 0;
            }
        }
    }

    // Play walk animation
    function playWalkAction() {
        // Ensure all expressions are off
        resetFacialExpressions();

        // Stop Idle animation
        if (idleAnim) idleAnim.stop();

        // Play walk animation
        if (walkAnim) {
            walkAnim.play(true); // Loop playback
        } else {
            console.log("Cannot play 'WalkAction' because it was not found.");
        }
    }

    // Set facial expression
    function setFacialExpression(targetMorph, morphName) {
        // Stop all animations (walking)
        if (walkAnim) walkAnim.stop();

        // Play Idle animation
        if (idleAnim) idleAnim.play(true);

        // Ensure all expressions are off
        resetFacialExpressions();

        if (targetMorph) {
            // Set the weight of the current expression to 100%
            // In C# it's 100f, in Babylon.js it's 1.0
            targetMorph.influence = 1.0;
        } else {
            console.log(`Cannot set '${morphName}' expression because it was not found.`);
        }
    }


    // --- Q3 Requirement: Control 3 actions using controller buttons ---
    // We use keyboard keys 1, 2, 3 to simulate controller buttons
    scene.onKeyboardObservable.add((kbInfo) => {
        if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
            switch (kbInfo.event.key) {
                case '1':
                    console.log("Key '1' pressed: PlayWalkAction");
                    playWalkAction();
                    break;
                case '2':
                    console.log("Key '2' pressed: SetFacialExpression (Happy)");
                    setFacialExpression(happyMorph, "Happy_Face");
                    break;
                case '3':
                    console.log("Key '3' pressed: SetFacialExpression (Surprised)");
                    setFacialExpression(surprisedMorph, "Surprised_Face");
                    break;
            }
        }
    });

    return scene;
};