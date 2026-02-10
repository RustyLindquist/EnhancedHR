/**
 * Seed Demo Organization — "Luminous"
 *
 * Seeds a complete demo organization on the target environment (local or production).
 * Calls the /api/admin/seed-demo-org endpoint which handles all phases:
 *   - Phase 0: Discovery (report existing state)
 *   - Phase 1: Org rename + user creation
 *   - Phase 2: Groups + assignments
 *   - Phase 3: Collections + content + embeddings
 *   - Phase 4: Analytics data (progress, logins, conversations, credits)
 *
 * Usage:
 *   npx tsx scripts/seed-demo-org.ts              # Run all phases against production
 *   npx tsx scripts/seed-demo-org.ts discover      # Discovery only (no mutations)
 *   npx tsx scripts/seed-demo-org.ts --local        # Run against local dev server
 *
 * Prerequisites:
 *   - PROD_APP_URL and COURSE_IMPORT_SECRET must be set in .env.local
 *   - The /api/admin/seed-demo-org endpoint must be deployed
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const args = process.argv.slice(2);
const useLocal = args.includes('--local');
const phase = args.find(a => !a.startsWith('--')) || 'all';

const TARGET_URL = useLocal
    ? 'http://localhost:3000'
    : process.env.PROD_APP_URL;
const SECRET_KEY = process.env.COURSE_IMPORT_SECRET;

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('              SEED DEMO ORG — LUMINOUS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!TARGET_URL) {
        console.error('❌ Missing PROD_APP_URL in .env.local (or use --local)');
        process.exit(1);
    }

    if (!SECRET_KEY) {
        console.error('❌ Missing COURSE_IMPORT_SECRET in .env.local');
        process.exit(1);
    }

    console.log(`🎯 Target: ${TARGET_URL}`);
    console.log(`📋 Phase: ${phase}`);
    console.log(`⏱️  Started: ${new Date().toISOString()}\n`);

    try {
        const response = await fetch(`${TARGET_URL}/api/admin/seed-demo-org`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secretKey: SECRET_KEY,
                phase,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ HTTP ${response.status}: ${errorText}`);
            process.exit(1);
        }

        const result = await response.json();

        if (result.error) {
            console.error(`❌ Error: ${result.error}`);
            process.exit(1);
        }

        // Display results
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('                        RESULTS');
        console.log('═══════════════════════════════════════════════════════════════\n');

        if (result.discovery) {
            console.log('📍 Discovery:');
            console.log(`   Org: ${result.discovery.org?.name || 'Not found'} (${result.discovery.org?.slug || 'n/a'})`);
            console.log(`   Users found: ${result.discovery.existingUsers?.length || 0}`);
            console.log(`   Published courses: ${result.discovery.courses?.length || 0}`);
            console.log(`   Existing groups: ${result.discovery.groups?.length || 0}`);
            if (result.discovery.courses?.length > 0) {
                console.log('   Courses:');
                result.discovery.courses.forEach((c: any) => {
                    console.log(`     - [${c.id}] ${c.title}`);
                });
            }
            console.log();
        }

        if (result.users) {
            console.log('👥 Users:');
            console.log(`   Org: ${result.users.orgName} (${result.users.orgSlug})`);
            console.log(`   Created/Updated: ${result.users.results?.length || 0}`);
            result.users.results?.forEach((u: any) => {
                const icon = u.status === 'created' ? '✅' : u.status === 'updated' ? '🔄' : u.status === 'skipped' ? '⏭️' : '❌';
                console.log(`     ${icon} ${u.email} → ${u.name || 'n/a'} (${u.status})`);
            });
            console.log();
        }

        if (result.groups) {
            console.log('📂 Groups:');
            console.log(`   Created: ${result.groups.created?.length || 0}`);
            result.groups.created?.forEach((g: any) => {
                console.log(`     ✅ ${g.name} (${g.memberCount} members)`);
            });
            console.log(`   Assignments: ${result.groups.assignments?.length || 0}`);
            result.groups.assignments?.forEach((a: any) => {
                const icon = a.status === 'created' ? '✅' : '⏭️';
                console.log(`     ${icon} ${a.assigneeType}/${a.assignmentType}: ${a.courseTitle} (${a.status})`);
            });
            console.log();
        }

        if (result.collections) {
            console.log('📚 Collections:');
            result.collections.created?.forEach((c: any) => {
                console.log(`   ✅ ${c.name} (${c.itemCount} items, ${c.embeddingsCreated} embeddings)`);
            });
            console.log();
        }

        if (result.analytics) {
            console.log('📊 Analytics:');
            console.log(`   Progress entries: ${result.analytics.progressCount || 0}`);
            console.log(`   Login events: ${result.analytics.loginCount || 0}`);
            console.log(`   Conversations: ${result.analytics.conversationCount || 0}`);
            console.log(`   Credit entries: ${result.analytics.creditCount || 0}`);
            if (result.analytics.errors?.length > 0) {
                console.log('   ❌ Errors:');
                result.analytics.errors.forEach((e: string) => console.log(`      ${e}`));
            }
            console.log();
        }

        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`✅ Completed: ${new Date().toISOString()}`);
        console.log('═══════════════════════════════════════════════════════════════');

        if (phase === 'all' || phase === 'users') {
            console.log('\n🔑 Demo Accounts:');
            console.log('   Org Admin: demo.admin@enhancedhr.ai / password123');
            console.log('   CPO:       sarah.chen@luminous.io / password123');
            console.log('   Employee:  nathan.brooks@luminous.io / password123');
        }

    } catch (error: any) {
        console.error(`\n❌ Fatal error: ${error.message}`);
        if (error.cause) {
            console.error(`   Cause: ${error.cause}`);
        }
        process.exit(1);
    }
}

main().catch(console.error);
