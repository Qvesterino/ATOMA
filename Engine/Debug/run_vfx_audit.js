#!/usr/bin/env node
/**
 * VFX SYSTEM AUDIT - AUTOMATED RUNTIME TEST
 *
 * Spustí VFX health check a performance audit cez Playwright
 * Výsledky uloží do: vfx_audit_results.json
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runVFXAudit() {
    console.log('🚀 Starting VFX System Audit...\n');

    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    try {
        // 1. Načítaj ATOMA
        console.log('📄 Loading ATOMA...');
        await page.goto('http://127.0.0.1:5500/index.html', {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        console.log('✅ ATOMA loaded\n');

        // Počkaj na inicializáciu (5 sekúnd)
        console.log('⏳ Waiting for systems to initialize...');
        await page.waitForTimeout(5000);
        console.log('✅ Systems initialized\n');

        // 2. Načítaj Health Check script
        console.log('🔍 Loading Health Check script...');
        const healthCheckScript = fs.readFileSync(
            path.join(__dirname, '../../ai tools (powershell)/vfx_health_check.js'),
            'utf-8'
        );
        await page.evaluate(healthCheckScript);
        console.log('✅ Health Check script loaded\n');

        // 3. Spusti Health Check
        console.log('🔍 Running Health Check...');
        const healthResults = await page.evaluate(async () => {
            const results = await window.runVFXHealthCheck();
            return results;
        });

        console.log('✅ Health Check complete\n');

        // 4. Načítaj Performance Snapshot script
        console.log('📊 Loading Performance Snapshot script...');
        try {
            const perfScript = fs.readFileSync(
                path.join(__dirname, 'performance_snapshot.js'),
                'utf-8'
            );
            await page.evaluate(perfScript);
            console.log('✅ Performance Snapshot script loaded\n');

            // 5. Spusti Performance Monitoring
            console.log('📊 Starting Performance Monitoring...');
            await page.evaluate(() => {
                window.startMonitoring(2000); // 2 sekundy
            });

            // Počkaj na zber dát (5 sekúnd)
            await page.waitForTimeout(5000);

            // Získaj výsledky
            const perfResults = await page.evaluate(() => {
                return window.__PERFORMANCE_SNAPSHOT__?.getSummary() || null;
            });

            if (perfResults) {
                console.log('✅ Performance Monitoring complete\n');
                healthResults.performance = perfResults;
            } else {
                console.log('⚠️ Performance Monitoring returned no data\n');
            }
        } catch (err) {
            console.log('⚠️ Performance Snapshot script not found or failed to load\n');
            console.log('Error:', err.message);
        }

        // 6. Získaj dodatočné info o systémoch
        console.log('🔍 Gathering system info...');
        const systemInfo = await page.evaluate(() => {
            const world = window.world;
            if (!world) {
                return { error: 'window.world not found' };
            }

            return {
                worldExists: true,
                worldProps: Object.keys(world),
                resonanceRupture: {
                    exists: !!world.resonanceRupture,
                    scars: world.resonanceRupture?.resonanceScars?.length || 0
                },
                harmonicHealing: {
                    exists: !!world.harmonicHealing,
                    activeWaves: world.harmonicHealing?.activeWaves?.length || 0
                },
                healingParticles: {
                    exists: !!world.healingParticles,
                    enabled: world.healingParticles?.enabled || false,
                    stats: world.healingParticles?.getStats?.() || null
                },
                linkingSystem: {
                    links: world.linkingSystem?.links?.length || 0
                }
            };
        });

        healthResults.systemInfo = systemInfo;
        console.log('✅ System info gathered\n');

        // 7. Ulož výsledky
        const outputPath = path.join(__dirname, 'vfx_audit_results.json');
        fs.writeFileSync(
            outputPath,
            JSON.stringify(healthResults, null, 2),
            'utf-8'
        );

        console.log('💾 Results saved to:', outputPath);
        console.log('\n' + '='.repeat(60));
        console.log('📊 AUDIT SUMMARY');
        console.log('='.repeat(60));

        // Vypis zhrnutie
        if (healthResults.summary) {
            console.log(`\nTotal Checks: ${healthResults.summary.total}`);
            console.log(`✅ OK: ${healthResults.summary.ok}`);
            console.log(`⚠️ Warnings: ${healthResults.summary.warnings}`);
            console.log(`❌ Errors: ${healthResults.summary.errors}`);
        }

        if (systemInfo.healingParticles.exists === false) {
            console.log('\n❌ CRITICAL: HealingParticleSystem does not exist!');
            console.log('   This explains why particles are not showing up.');
        }

        if (systemInfo.resonanceRupture.exists === false) {
            console.log('\n⚠️ WARNING: ResonanceRuptureSystem does not exist!');
            console.log('   This may affect healing particle emission.');
        }

        if (systemInfo.harmonicHealing.exists === false) {
            console.log('\n⚠️ WARNING: HarmonicHealingVisualSystem does not exist!');
            console.log('   Healing waves may not be generating.');
        }

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('❌ Audit failed:', error.message);
        console.error(error.stack);

        // Skúsi zachrániť aspoň čiastočné výsledky
        if (page) {
            try {
                const errorInfo = await page.evaluate(() => {
                    return {
                        worldExists: !!window.world,
                        worldProps: window.world ? Object.keys(window.world) : []
                    };
                });

                fs.writeFileSync(
                    path.join(__dirname, 'vfx_audit_error.json'),
                    JSON.stringify({
                        error: error.message,
                        info: errorInfo
                    }, null, 2),
                    'utf-8'
                );
                console.log('💾 Partial info saved to: vfx_audit_error.json');
            } catch (e) {
                console.log('Could not save partial info');
            }
        }

        throw error;
    } finally {
        await browser.close();
        console.log('\n✅ Audit complete! Browser closed.');
    }
}

// Spusti audit
runVFXAudit().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
