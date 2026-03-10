AUDIT REPORT: LinkRingArcDischarges System
Summary
CRITICAL FINDING: The LinkRingArcDischarges system is NON-FUNCTIONAL because the implementation file is missing.

Call Chain Analysis
1. Import Statement (LinkRendererConduit.js, line 11)

import { LinkRingArcDischarges } from './LinkRingArcDischarges.js';
Status: ✅ Present
2. Instantiation (LinkRendererConduit.js, line 932)

let arcDischarges = null;
try {
    if (LinkRingArcDischarges) {
        arcDischarges = new LinkRingArcDischarges(this.scene);
        group.add(arcDischarges.getGroup());
    }
} catch (e) { throw e; }
Status: ⚠️ WILL FAIL - The class does not exist
3. Update Call (LinkRendererConduit.js, line 1777)

if (state.arcDischarges && state.pulseRing && this.modules.flow) {
    const ringColor = new THREE.Color(state.baseColor).lerp(targetColor, state.pulseRing.progress);
    const ringScale = state.pulseRing.mesh.scale.x;

    state.arcDischarges.update(
        mainCurve,
        state.pulseRing.progress,  // ← ringProgress parameter (0-1)
        synergy,
        trafficLoad,
        visualDelta,
        ringColor,
        ringScale,
        frameState
    );
}
Status: ⚠️ NEVER EXECUTES - state.arcDischarges is always null
ringProgress Parameter Status
Source: state.pulseRing.progress
The ringProgress parameter DOES exist and is properly sourced from the segmented pulse ring system:

LinkPulseRing.js:


// Initialization (constructor)
this.progress = Math.random(); // 0-1 random start

// Update loop
const speed = (0.3 + (traffic * 0.4) + (synergy * 0.2)) * 0.5;
this.progress += speed * dt;

if (this.progress >= 1.0) {
    this.progress = 0.0; // Loop
}
Current Value: ✅ 0-1 (dynamic, loops continuously)

Root Cause Analysis
Why Arc Discharges Stopped Working
Factor	Status	Impact
LinkRingArcDischarges.js file exists?	❌ MISSING	CRITICAL - Class cannot be imported
Import statement	✅ Present	References non-existent file
ringProgress source	✅ Active	PulseRing supplies valid 0-1 values
spawnArcBurst() method	❌ NOT CALLED	Commented out in LinkPulseRing.js (line 494)
arc triggering	❌ DISABLED	_arcTriggeredThisPulse never set true
Evidence from Code
LinkPulseRing.js (line 494-502) - Arc burst intentionally disabled:


// DEBUG ISOLATION: arc burst disabled while validating mechanical split readability.
// if (pulseState.atPeak && !this._arcTriggeredThisPulse && this.arcSystem) {
//     this.mesh.getWorldDirection(this._worldDirection);
//     this.arcSystem.spawnArcBurst(
//         this.mesh.position,
//         this._worldDirection,
//         synergy,
//         traffic
//     );
//     this._arcTriggeredThisPulse = true;
// }
Also confirmed: The setArcSystem() method (line 152) exists but arcSystem reference is never actually set because the arc system class is missing.

Conclusion
The Arc Discharge system is completely non-functional because:

Primary Cause: LinkRingArcDischarges.js file does not exist in the codebase
Secondary Cause: Even if the file existed, the arc burst triggering code is commented out in LinkPulseRing.js for "debug isolation"
The ringProgress parameter is NOT the problem - it is correctly supplied by the segmented pulse ring system and contains valid 0-1 values that loop continuously.

Recommendations
To restore arc discharges:

Locate or recreate the LinkRingArcDischarges.js file
Uncomment the arc burst triggering logic in LinkPulseRing.js (lines 494-502)
Ensure pulseRing.setArcSystem(arcDischarges) is called during initialization
Verify the arc system's update() method signature matches the call at line 1777