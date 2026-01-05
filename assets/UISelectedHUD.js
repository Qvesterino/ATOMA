// ======================================================================
// UISelectedHUD.js — Standalone Selected HUD for ATOMA
// Works with NodeSelectionCore3_4
// ======================================================================

(function initSelectedHUD() {

    // Try to locate SelectionCore
    const core =
        window.Atoma?.core?.selectionCore ||
        window.selectionCore ||
        null;

    if (!core) {
        console.warn("[SelectedHUD] No SelectionCore detected.");
        return;
    }

    // Create HUD (if missing)
    let hud = document.getElementById("selected-node-hud");
    if (!hud) {
        hud = document.createElement("div");
        hud.id = "selected-node-hud";

        Object.assign(hud.style, {
            position: "fixed",
            top: "22px",
            right: "26px",
            padding: "8px 16px",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "14px",
            color: "#7FFFD4",
            background: "rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(6px)",
            borderRadius: "12px",
            letterSpacing: "1px",
            zIndex: "999999",
        });

        hud.innerText = "SELECTED: NONE";
        document.body.appendChild(hud);
    }

    // Function to update HUD
    function updateHUD(node) {
        if (!node) {
            hud.innerText = "SELECTED: NONE";
            return;
        }

        const name =
            node.userData?.displayName ||
            node.userData?.nodeName ||
            node.userData?.namingCode ||
            node.userData?.type ||
            "NODE";

        hud.innerText = "SELECTED: " + name.toUpperCase();
    }

    // Attach listeners
    core.onSelect(updateHUD);
    core.onDeselect(() => updateHUD(null));

    console.log("%c[SelectedHUD] Active ✓", "color:#7FFFD4;font-weight:bold;");

})();
