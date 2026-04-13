⚙️ ATOMA Shader Injection Contract v1
🎯 CIEĽ

Stabilný shader systém, ktorý:

prežije Three.js upgrade
nezávisí od fragile string hackov
má deterministické správanie
1️⃣ 🔒 ZÁKLADNÉ PRAVIDLÁ (NEPORUŠITEĽNÉ)
❌ ZAKÁZANÉ
replace exact GLSL riadkov:
gl_Position = ...
gl_FragColor = ...
injection podľa “náhodného string matchu”
viacnásobné wrapovanie onBeforeCompile
✅ POVINNÉ
injection len cez:
#include <...> chunky
alebo vlastné markery
1 material = 1 compile hook
všetky patche idú cez central pipeline
2️⃣ 🧠 SINGLE ENTRY POINT (kritické)

👉 nikdy viac:

Wave pack → wrap
Personality → wrap
Synergy → wrap

👉 namiesto toho:

material.onBeforeCompile = (shader) => {
  applyAtomaShaderPipeline(material, shader);
};
3️⃣ 🧩 PIPELINE ARCHITEKTÚRA
material.userData.atomaPatches = [
  WavePatch,
  PersonalityPatch,
  SynergyPatch
];
function applyAtomaShaderPipeline(material, shader) {
  const patches = material.userData.atomaPatches || [];

  for (const patch of patches) {
    patch.apply(shader, material);
  }
}

👉 deterministic
👉 debugovateľné
👉 upgrade-safe

4️⃣ 🧱 INJECTION STRATEGY
ONLY SAFE TARGETS:
✅ povolené:
#include <common>
#include <begin_vertex>
#include <project_vertex>
#include <output_fragment>
❌ zakázané:
void main() {
gl_Position =
gl_FragColor =
PATTERN:
shader.vertexShader = shader.vertexShader.replace(
  '#include <begin_vertex>',
  `
  #include <begin_vertex>
  // ATOMA_WAVE_BEGIN
  transformed += sin(uTime) * 0.1;
  // ATOMA_WAVE_END
  `
);
5️⃣ 🛡️ GUARD SYSTEM (anti silent failure)

Každý patch MUSÍ mať:

if (!shader.vertexShader.includes('#include <begin_vertex>')) {
  console.warn('[ATOMA][WavePatch] missing begin_vertex');
  return;
}

👉 bez guardu = bug

6️⃣ 🧬 UNIFORM CONTRACT
pravidlá:
prefix: uAtoma*
nikdy:
uTime
uColor
generické názvy
príklad:
shader.uniforms.uAtomaWavePhase = { value: 0 };
merge safe:
shader.uniforms = {
  ...shader.uniforms,
  ...patch.uniforms
};
7️⃣ 🧠 PROGRAM CACHE CONTRACT
pravidlo:

cache key MUSÍ reflektovať všetko čo mení shader

material.customProgramCacheKey = () => {
  return [
    'ATOMA',
    material.type,
    material.userData.atomaPatchSignature
  ].join('|');
};
zakázané:
random values
time-dependent keys
8️⃣ 🔁 PATCH ORDER CONTRACT

👉 poradie MUSÍ byť fixné:

1. Base patches
2. Wave
3. Personality
4. Synergy
5. Final modifiers

👉 nikdy:

dynamické reorderovanie
9️⃣ 🧪 DEBUG MODE (povinné pre upgrade)
console.log('[ATOMA][ShaderPipeline]', {
  material: material.type,
  patches: patches.map(p => p.name)
});
🔟 🚨 FAIL-SAFE MODE

ak patch failne:

try {
  patch.apply(shader, material);
} catch (e) {
  console.warn('[ATOMA][Patch FAIL]', patch.name, e);
}

👉 engine nesmie crashnúť

⚡ TL;DR (hard truth)

👉 teraz:

máš chaotický injection mesh

👉 po tomto:

máš shader pipeline systém
🧭 STRATEGICKÝ IMPACT

Keď toto zavedieš:

upgrade Three.js = kontrolovaný proces
nie “modlitba + debugging 8 hodín”
nové efekty = patch
nie “ďalší hack do onBeforeCompile”
🎯 BONUS (veľmi dôležité)

Keď raz spravíš v2:

👉 môžeš:

portnúť to na WebGPU
alebo úplne mimo Three.js