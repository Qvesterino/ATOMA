# CONTROL_HEX_COLOR

## Kontext

V súbore `EnhancedNodeModels.js` je funkcia `_getControlV2Materials`, ktorá vytvára materiály pre Control V2 uzly.

Tieto materiály sa momentálne generujú na základe `colorHex` a používajú dynamické kľúče pre `MaterialCache.get(...)`.
To znamená, že pre každý odlišný uzol s inou farbou vzniká samostatná cachovaná instancia materiálov.

## Problém

- Dynamické kľúče v cache robia `control.v2` kategóriu neoptimálnou.
- Ak je farba uzla zbytočne premenná, potom sa namiesto zdieľaného materiálu vytvára veľa podobných inštancií.
- V praxi to môže viesť k vyššej pamäťovej a materiálovej réžii.

## Cieľ

- Presunúť `control.v2` materiály zo závislosti na `colorHex` na fixné, deterministické nastavenie.
- Použiť stabilné, konštantné farby pre spoločné materiály, ktoré sú nezávislé od aktuálnej farby uzla.
- Umožniť použitie pevných cache kľúčov pre všetky zdieľané materiály tejto kategórie.

## Dôležité body na zváženie

1. **Ktoré materiály sú farebne závislé**
   - `coreMat`, `edgeMat`, `spireMat`, `ringMat`, `segmentMat`, `overrideMat` v `_getControlV2Materials` používajú `colorHex`.
   - Tieto materiály majú momentálne farebnú variabilitu na úrovni jednotlivého uzla.

2. **Aké materiály môžu zostať statické**
   - Ak nechceme, aby farba uzlov bola variabilná, môžeme ich nahradiť konštantnými farbami.
   - Konštantné farby musia byť pevné a nezávislé od `colorHex`, `brightCyan`, `inputColor` alebo iných per-node derivátov.

3. **Cache kľúče**
   - Kľúče by mali byť čitateľné a stabilné: napr. `control.v2.core.meshStandard.default`.
   - Nemali by obsahovať `colorHex` ani inú dynamiku, ktorá robí cache špecifickú pre uzol.

4. **Metadata na materiáloch**
   - Zdieľané materiály musia zachovať `userData.wavePatchMode` a prípadne `ignoreWaveColor` ak to je potrebné.
   - Ak sa materiály používajú v rámci zdieľanej sady, mali by mať `userData.isShared = true` a ďalšie flags podľa existujúcich vzorov.

5. **Možné kompromisy**
   - Vizuálna jednotnosť: uzly v kategórii Control V2 prestanú reagovať na farebný argument.
   - Stabilita: získame lepšiu cache a menší počet materiálových inštancií.

## Kroky pre neskôr

1. Identifikovať všetky `MaterialCache.get(...)` volania v `_getControlV2Materials`.
2. Rozhodnúť sa, ktoré z nich môžu zostať dynamické (ak vôbec) a ktoré môžu byť zafixované.
3. Premeniť `colorKey`-založené kľúče na pevné názvy bez farebnej zložky.
4. Upravovať definície materiálov tak, aby konštantná farba bola explicitne zadaná.
5. Otestovať, či sa po zmene neobjavia vizuálne regresie v Control V2 uzloch.
6. Skontrolovať, či sú zdieľané materiály stále správne označené `userData` metadátami.

## Poznámka

Ak je farebná variabilita v tejto kategórii prijateľná stratiť, potom je toto riešenie rozumné a pomôže zjednodušiť cache.
Ak však farba uzlov musí zostať rôzna podľa `colorHex`, potom druhý fix nebude možný bez prepracovania renderovacej logiky alebo zdieľania materiálov na úrovni shaderových parametrov.
