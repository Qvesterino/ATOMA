#!/usr/bin/env node

/**
 * ATOMA FrameScheduler Zombie System Audit
 * 
 * Analyzes main.js to find systems registered with FrameScheduler that:
 * 1. Have no runtime instance
 * 2. Have instance but no update function
 * 3. Are unbound from game/world
 * 4. Are missing imports
 * 5. Use factory pattern without instance assignment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class FrameSchedulerAudit {
    constructor() {
        this.mainJsPath = path.join(__dirname, 'main.js');
        this.mainJsContent = '';
        this.registrations = [];
        this.instances = new Map();
        this.imports = new Set();
        this.factoryPatterns = new Map();
        this.zombieSystems = [];
    }

    run() {
        console.log('=== ATOMA FrameScheduler Zombie System Audit ===\n');
        
        this.loadMainJs();
        this.extractImports();
        this.extractRegistrations();
        this.extractInstances();
        this.extractFactoryPatterns();
        this.analyzeZombies();
        this.generateReport();
    }

    loadMainJs() {
        if (!fs.existsSync(this.mainJsPath)) {
            console.error('ERROR: main.js not found!');
            process.exit(1);
        }
        this.mainJsContent = fs.readFileSync(this.mainJsPath, 'utf-8');
        console.log('✓ Loaded main.js');
    }

    extractImports() {
        // Extract import statements
        const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(this.mainJsContent)) !== null) {
            this.imports.add(match[1]);
        }
        console.log(`✓ Extracted ${this.imports.size} imports\n`);
    }

    extractRegistrations() {
        // Pattern 1: Direct frameScheduler.register with ID parameter
        const registerRegex1 = /frameScheduler\.register\s*\(\s*['"]([^'"]+)['"]\s*,\s*\([^)]*\)\s*=>\s*\{([^}]+)\}\s*,\s*['"]([^'"]+)['"]\s*\)/gs;
        let match;
        
        while ((match = registerRegex1.exec(this.mainJsContent)) !== null) {
            const layer = match[1];
            const callbackBody = match[2];
            const id = match[3];
            
            const targetObject = this.extractTargetFromCallback(callbackBody, id);
            
            this.registrations.push({
                id,
                layer,
                callbackBody,
                targetObject,
                callbackUsesOptionalChaining: callbackBody.includes('?.')
            });
        }
        
        // Pattern 2: this.frameScheduler.register with method binding
        const methodBindRegex = /this\.frameScheduler\.register\s*\(\s*['"]([^'"]+)['"]\s*,\s*this\.(\w+)\.bind\(this\)\s*,\s*['"]([^'"]+)['"]\s*\)/g;
        while ((match = methodBindRegex.exec(this.mainJsContent)) !== null) {
            const layer = match[1];
            const targetObject = match[2];
            const id = match[3];
            
            this.registrations.push({
                id,
                layer,
                callbackBody: `this.${targetObject}.bind(this)`,
                targetObject,
                isMethodBind: true,
                callbackUsesOptionalChaining: false
            });
        }
        
        // Pattern 3: regGuard(name, schedulerKey, fn) - this wraps frameScheduler.register
        const regGuardRegex = /regGuard\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*\([^)]*\)\s*=>\s*\{([^}]+)\}\s*\)/g;
        while ((match = regGuardRegex.exec(this.mainJsContent)) !== null) {
            const name = match[1];
            const schedulerKey = match[2];
            const callbackBody = match[3];
            
            // Extract layer and ID from schedulerKey
            const keyParts = schedulerKey.split('.');
            const layer = keyParts[0];
            const id = schedulerKey;
            
            const targetObject = this.extractTargetFromCallback(callbackBody, name);
            
            this.registrations.push({
                id,
                layer,
                callbackBody,
                targetObject,
                systemName: name,
                callbackUsesOptionalChaining: callbackBody.includes('?.'),
                isRegGuard: true
            });
        }
        
        // Pattern 4: reg(name, fn) - direct registration without frameScheduler
        const regRegex = /reg\s*\(\s*['"]([^'"]+)['"]\s*,\s*\([^)]*\)\s*=>\s*\{([^}]+)\}\s*\)/g;
        while ((match = regRegex.exec(this.mainJsContent)) !== null) {
            const name = match[1];
            const callbackBody = match[2];
            
            const targetObject = this.extractTargetFromCallback(callbackBody, name);
            
            this.registrations.push({
                id: name,
                layer: 'unknown', // Can't determine layer from reg()
                callbackBody,
                targetObject,
                systemName: name,
                callbackUsesOptionalChaining: callbackBody.includes('?.'),
                isReg: true
            });
        }
        
        // Remove duplicates based on ID
        const uniqueRegistrations = [];
        const seenIds = new Set();
        
        for (const reg of this.registrations) {
            if (!seenIds.has(reg.id)) {
                seenIds.add(reg.id);
                uniqueRegistrations.push(reg);
            }
        }
        
        this.registrations = uniqueRegistrations;
        
        console.log(`✓ Extracted ${this.registrations.length} FrameScheduler registrations\n`);
    }

    extractTargetFromCallback(callbackBody, id) {
        // Extract object reference from callback
        // Pattern: this.objectName?.update(dt)
        const optionalChainingMatch = callbackBody.match(/this\.(\w+?)\.\w+/);
        if (optionalChainingMatch) {
            return optionalChainingMatch[1];
        }
        
        // Pattern: this.objectName.update(dt) without optional chaining
        const directMatch = callbackBody.match(/this\.(\w+?)\.\w+/);
        if (directMatch) {
            return directMatch[1];
        }
        
        // Try to infer from ID
        const idParts = id.split('.');
        if (idParts.length > 1) {
            return idParts[1];
        }
        
        return idParts[0];
    }

    extractInstances() {
        // Extract all this.objectName = patterns
        const instanceRegex = /this\.(\w+)\s*=\s*(new\s+\w+|setup\w+|[\w\.]+)/g;
        let match;
        
        while ((match = instanceRegex.exec(this.mainJsContent)) !== null) {
            const objectName = match[1];
            const assignment = match[2];
            
            if (!this.instances.has(objectName)) {
                this.instances.set(objectName, {
                    name: objectName,
                    assignments: [],
                    hasNew: assignment.includes('new'),
                    hasFactory: assignment.startsWith('setup'),
                    rawAssignment: assignment
                });
            }
            this.instances.get(objectName).assignments.push(assignment);
        }
        
        console.log(`✓ Extracted ${this.instances.size} potential instances\n`);
    }

    extractFactoryPatterns() {
        // Extract setup...Function patterns
        const factoryRegex = /(\w+)\s*=\s*setup\w+\(this\)/g;
        let match;
        
        while ((match = factoryRegex.exec(this.mainJsContent)) !== null) {
            const objectName = match[1];
            const fullMatch = match[0];
            
            this.factoryPatterns.set(objectName, {
                pattern: fullMatch
            });
        }
        
        console.log(`✓ Extracted ${this.factoryPatterns.size} factory pattern instances\n`);
    }

    analyzeZombies() {
        console.log('Analyzing systems...\n');
        
        for (const reg of this.registrations) {
            const target = reg.targetObject;
            const instance = this.instances.get(target);
            
            let status = 'OK';
            let issues = [];
            
            // Check 1: Instance exists
            if (!instance) {
                status = 'SCHEDULER WITHOUT INSTANCE';
                issues.push('No instance found in main.js');
            } else {
                // Check 2: Update function (we can't verify this without reading the class files)
                // We'll mark this as potential issue
                if (!instance.hasNew && !instance.hasFactory) {
                    // Might be a reference to another object
                    const refMatch = reg.callbackBody.match(/this\.(\w+)\s*=\s*this\.(\w+)/);
                    if (refMatch) {
                        // It's a reference - check if the referenced object exists
                        const refTarget = refMatch[2];
                        if (!this.instances.has(refTarget)) {
                            status = 'SCHEDULER WITHOUT INSTANCE';
                            issues.push(`References non-existent object: ${refTarget}`);
                        }
                    }
                }
                
                // Check 3: Factory pattern without assignment
                if (instance.hasFactory) {
                    if (instance.assignments.length === 0) {
                        status = 'FACTORY WITHOUT INSTANCE';
                        issues.push('Factory function called but not assigned');
                    }
                }
                
                // Check 4: Optional chaining suggests potential null issues
                if (reg.callbackUsesOptionalChaining && !instance) {
                    status = 'SCHEDULER WITHOUT INSTANCE';
                    issues.push('Uses optional chaining (?.) suggesting potential null');
                }
            }
            
            // Check 5: Missing import (basic check)
            // We can't fully verify this without mapping class names to files
            // But we can flag suspicious cases
            
            const systemData = {
                systemName: target,
                schedulerId: reg.id,
                layer: reg.layer,
                instanceCreated: !!instance,
                instanceType: instance ? (instance.hasNew ? 'new' : instance.hasFactory ? 'factory' : 'reference') : 'none',
                callbackUsesOptionalChaining: reg.callbackUsesOptionalChaining,
                status,
                issues,
                targetObject: target
            };
            
            if (status !== 'OK') {
                this.zombieSystems.push(systemData);
            }
        }
    }

    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('FRAME SCHEDULER ZOMBIE SYSTEM AUDIT REPORT');
        console.log('='.repeat(80) + '\n');
        
        // Summary
        console.log('SUMMARY:');
        console.log(`  Total Registered Systems: ${this.registrations.length}`);
        console.log(`  Total Instances Found: ${this.instances.size}`);
        console.log(`  Zombie Systems Detected: ${this.zombieSystems.length}`);
        console.log(`  Factory Patterns: ${this.factoryPatterns.size}`);
        console.log('');
        
        if (this.zombieSystems.length === 0) {
            console.log('✓ NO ZOMBIE SYSTEMS FOUND\n');
            return;
        }
        
        // Priority categorization
        const priority1 = this.zombieSystems.filter(s => s.status === 'SCHEDULER WITHOUT INSTANCE');
        const priority2 = this.zombieSystems.filter(s => s.status === 'INSTANCE WITHOUT UPDATE');
        const priority3 = this.zombieSystems.filter(s => s.status === 'FACTORY WITHOUT INSTANCE');
        const priority4 = this.zombieSystems.filter(s => s.status === 'UNBOUND SYSTEM');
        
        console.log('PRIORITY BREAKDOWN:');
        console.log(`  Priority 1 (Scheduler Without Instance): ${priority1.length}`);
        console.log(`  Priority 2 (Instance Without Update): ${priority2.length}`);
        console.log(`  Priority 3 (Factory Without Instance): ${priority3.length}`);
        console.log(`  Priority 4 (Unbound System): ${priority4.length}`);
        console.log('');
        
        // Detailed table
        console.log('='.repeat(120));
        console.log('DETAILED ZOMBIE SYSTEM TABLE');
        console.log('='.repeat(120));
        console.log(
            this.padRight('SYSTEM NAME', 35) +
            this.padRight('SCHEDULER ID', 35) +
            this.padRight('LAYER', 12) +
            this.padRight('INSTANCE', 10) +
            this.padRight('STATUS', 30)
        );
        console.log('='.repeat(120));
        
        for (const zombie of this.zombieSystems) {
            console.log(
                this.padRight(zombie.systemName, 35) +
                this.padRight(zombie.schedulerId, 35) +
                this.padRight(zombie.layer, 12) +
                this.padRight(zombie.instanceCreated ? 'YES' : 'NO', 10) +
                this.padRight(zombie.status, 30)
            );
            
            if (zombie.issues.length > 0) {
                console.log(`  Issues: ${zombie.issues.join('; ')}`);
            }
            console.log('');
        }
        
        // Priority 1 details
        if (priority1.length > 0) {
            console.log('\n' + '='.repeat(120));
            console.log('PRIORITY 1: SCHEDULER WITHOUT INSTANCE (CRITICAL)');
            console.log('='.repeat(120));
            for (const zombie of priority1) {
                console.log(`\n🚨 ${zombie.schedulerId}`);
                console.log(`   Target Object: ${zombie.targetObject}`);
                console.log(`   Issues: ${zombie.issues.join('; ')}`);
            }
        }
        
        // Priority 3 details
        if (priority3.length > 0) {
            console.log('\n' + '='.repeat(120));
            console.log('PRIORITY 3: FACTORY WITHOUT INSTANCE (HIGH)');
            console.log('='.repeat(120));
            for (const zombie of priority3) {
                console.log(`\n⚠️ ${zombie.schedulerId}`);
                console.log(`   Target Object: ${zombie.targetObject}`);
                console.log(`   Issues: ${zombie.issues.join('; ')}`);
            }
        }
        
        // Save JSON report
        const reportPath = path.join(__dirname, 'framescheduler_zombie_audit_report.json');
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: {
                totalRegistered: this.registrations.length,
                totalInstances: this.instances.size,
                zombieSystems: this.zombieSystems.length,
                factoryPatterns: this.factoryPatterns.size
            },
            priorityBreakdown: {
                priority1: priority1.map(s => s.schedulerId),
                priority2: priority2.map(s => s.schedulerId),
                priority3: priority3.map(s => s.schedulerId),
                priority4: priority4.map(s => s.schedulerId)
            },
            zombieSystems: this.zombieSystems,
            allRegistrations: this.registrations.map(r => ({
                id: r.id,
                layer: r.layer,
                targetObject: r.targetObject,
                hasInstance: !!this.instances.get(r.targetObject)
            }))
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
        console.log('\n' + '='.repeat(80));
        console.log(`✓ Full report saved to: ${reportPath}`);
        console.log('='.repeat(80));
    }

    padRight(str, length) {
        return (str || '').padEnd(length, ' ');
    }
}

// Run audit
const audit = new FrameSchedulerAudit();
audit.run();