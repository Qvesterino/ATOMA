# ATOMA Boot & Test Manual

## Priorita testovania
- Preferované URL pre všetky testy: `http://127.0.0.1:5173/`
- Spúšťaj aplikáciu cez Vite (`npm run dev`) a testuj live runtime tam
- `5500` ber len ako legacy/static fallback, nie ako primárnu testovaciu pravdu

## Boot pipeline
1. Načítaj stránku a počkaj, kým sa zobrazí hlavné menu.
2. Vyber mapu cez `MAP SELECTION`.
3. Spustí sa world bootstrap, ktorý inicializuje `AINodes.js`, `EnvironmentDomainController.js` a link systémy.
4. `NodeLinkingSystem.js` spracováva click-to-link a `LinkRendererConduit.js` zobrazuje vizuály; metriky sú spracované cez `MetricsRuntime_v1.js`.

## Po načítaní aplikácie
1. Otvor stránku a počkaj, kým sa zobrazí hlavné menu.
2. V menu klikni na tlačidlo alebo sekciu označenú `MAP SELECTION`.
3. Vyber možnosť `QUANTUM ISLAND`.
4. Po výbere by sa mala hra spustiť v tomto svete.

## Ako vytvoriť link medzi nodmi
### Jednoduchý krok za krokom postup
1. Nájdeš prvý node v scéne.
2. Dvojklikni na prvý node, aby sa stal "Primary Node".
3. Klikni na druhý node.
4. Ak sú podmienky platné, systém vytvorí link medzi prvým a druhým nodom.

### Alternatíva: multi-select linkovanie
- Podrž `Ctrl` (alebo `Cmd` na Macu) a klikni na viacero nodov, aby si ich označil ako výber.
- Potom klikni na cieľový node.
- Systém vytvorí linky z každého vybraného zdroja na tento cieľ.

### Dôležité poznámky
- Jednoduchý klik na prázdne miesto vymaže aktuálny primárny node alebo multi-select výber.
- Klik na ten istý node ako primárny node nezachytí nový link.
- Link sa vytvára iba vtedy, keď existuje vybraný primárny node a klikneš na iný node.

## Kde je implementácia
- Bootovanie a menu spravuje `AtomaBoot.js`.
- Vytváranie linkov a klikacie správanie je v `NodeLinkingSystem.js`.

## Rýchly testovací tip
- Ak chceš overiť, že linkovanie funguje, vytvor jeden link medzi dvoma nodmi a sleduj vizuálnu odozvu v scéne.
- Ak je potrebné, môžeš v konzole použiť debug helpery definované v `main.js`, napríklad `window.__DEBUG.createLinkById(idA, idB)`.

## FAIL FAST (KRITICKÉ)
- ak blank page → skontroluj console (F12) a network tab
- ak build error → neopakuj test, oprav error
- ak port 5173 nefunguje → oprav alebo znovu spusti Vite; `5500` použi len ak task výslovne potrebuje legacy static boot
- ak link po create nezobrazí → skontroluj, či bol prvý node nastavený ako Primary Node

## EXPECTED RESULT
- po create link → viditeľný link medzi nodmi
- metriky sa menia, resp. reagujú na nový link
- žiadne `console` errors
- vizuálne efekty linku sa aktivujú (puls ring / spark / aura)


## DO NOT DO
- nepoužívaj Playwright automaticky
- nespúšťaj iný server ako Vite bez dôvodu
- nerob retry loop bez zmeny

## MINI SYSTEM MAP
CORE:
- logic: `NodeLinkingSystem.js`
- visuals: `LinkRendererConduit.js`
- scheduler: FrameScheduler (10Hz simulation, 30Hz visual, 60Hz runtime)

## Cieľ manuálu
Tento dokument slúži ako jednoduchý manuál pre bootovanie testovacej verzie a pre rýchle overenie link creation flow.
