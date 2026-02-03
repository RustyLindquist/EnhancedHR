/**
 * Production Sync Mapping Script
 *
 * Maps local courses to production courses by title and identifies sync actions.
 * Outputs recommendations for keeping, archiving, or pushing courses.
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/production-sync-mapping.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ===== Type Definitions =====

interface LocalCourse {
  id: number;
  title: string;
  videoCount: number;
}

interface ProdCourse {
  id: number;
  title: string;
  videoCount: number;
}

type SyncAction = 'MATCH' | 'DUPLICATE_PROD' | 'ORPHAN_PROD' | 'MISSING_PROD';

interface CourseMapping {
  localId: number | null;
  localTitle: string | null;
  prodId: number | null;
  prodTitle: string | null;
  normalizedTitle: string;
  action: SyncAction;
  reason: string;
  localVideoCount: number;
  prodVideoCount: number;
}

interface KeepAction {
  prodId: number;
  title: string;
  localId: number;
  videoCount: number;
}

interface ArchiveAction {
  prodId: number;
  title: string;
  reason: string;
}

interface PushAction {
  localId: number;
  title: string;
  reason: string;
  videoCount: number;
}

interface SyncRecommendations {
  timestamp: string;
  summary: {
    totalLocal: number;
    totalProd: number;
    matched: number;
    duplicatesInProd: number;
    orphansInProd: number;
    missingInProd: number;
  };
  keep: KeepAction[];
  archive: ArchiveAction[];
  push: PushAction[];
  mappings: CourseMapping[];
}

// ===== Local Courses (44 courses, ID >= 616) =====

const localCourses: LocalCourse[] = [
  { id: 616, title: 'The Control Spectrum', videoCount: 15 },
  { id: 637, title: 'The Orbits Model', videoCount: 10 },
  { id: 639, title: 'Alignment', videoCount: 14 },
  { id: 640, title: 'Environment', videoCount: 12 },
  { id: 641, title: 'Growth', videoCount: 10 },
  { id: 642, title: 'Impact', videoCount: 13 },
  { id: 643, title: 'Leaving Your Comfort Zone', videoCount: 1 },
  { id: 644, title: 'Mentor', videoCount: 11 },
  { id: 645, title: 'Momentum', videoCount: 10 },
  { id: 646, title: 'New Boots', videoCount: 2 },
  { id: 647, title: 'Relationship', videoCount: 9 },
  { id: 648, title: 'Renewal', videoCount: 15 },
  { id: 649, title: 'Space', videoCount: 8 },
  { id: 650, title: 'The 16 Elements \u2013 An Overview', videoCount: 1 },
  { id: 651, title: 'The Energy Iceberg Part 1', videoCount: 11 },
  { id: 652, title: 'The Energy Iceberg Part 2', videoCount: 19 },
  { id: 653, title: 'Value', videoCount: 13 },
  { id: 654, title: 'Why Energy Matters Most', videoCount: 6 },
  { id: 655, title: 'Choose to Thrive', videoCount: 10 },
  { id: 656, title: 'Identity', videoCount: 14 },
  { id: 657, title: 'Investment', videoCount: 11 },
  { id: 658, title: 'Objective', videoCount: 8 },
  { id: 659, title: 'Perspective', videoCount: 18 },
  { id: 660, title: 'Plan', videoCount: 9 },
  { id: 661, title: 'Score', videoCount: 13 },
  { id: 663, title: 'The Performance Iceberg', videoCount: 1 },
  { id: 664, title: 'Extraordinary vs Extravagant', videoCount: 24 },
  { id: 665, title: 'Leadership & Community - Orient (1 of 4)', videoCount: 11 },
  { id: 666, title: 'Leadership & Community - Assemble (2 of 4)', videoCount: 9 },
  { id: 667, title: 'Leadership & Community - Act (3 of 4)', videoCount: 9 },
  { id: 668, title: 'Leadership & Community - Achieve (4 of 4)', videoCount: 10 },
  { id: 669, title: 'Leadership and Resilience', videoCount: 12 },
  { id: 670, title: 'The Five Voices', videoCount: 15 },
  { id: 671, title: 'Leadership and Trust - Orient (1 of 4)', videoCount: 11 },
  { id: 672, title: 'Leadership and Trust - Assemble (2 of 4)', videoCount: 10 },
  { id: 673, title: 'Leadership and Trust - Act (3 of 4)', videoCount: 10 },
  { id: 674, title: 'Leadership and Trust - Achieve (4 of 4)', videoCount: 11 },
  { id: 675, title: 'Engagement During Leadership Transition', videoCount: 3 },
  { id: 676, title: 'Perspective and Identity', videoCount: 20 },
  { id: 677, title: 'Objective and Plan', videoCount: 13 },
  { id: 678, title: 'Relationship and Mentor', videoCount: 13 },
  { id: 679, title: 'Momentum and Alignment', videoCount: 10 },
  { id: 680, title: 'Environment and Space', videoCount: 14 },
  { id: 681, title: 'Investment and Score', videoCount: 15 },
];

// ===== Production Courses (from course_import_status API) =====

const prodCourses: ProdCourse[] = [
  { id: 670, title: 'Investment and Score', videoCount: 15 },
  { id: 669, title: 'Environment and Space', videoCount: 14 },
  { id: 668, title: 'Momentum and Alignment', videoCount: 10 },
  { id: 667, title: 'Relationship and Mentor', videoCount: 13 },
  { id: 666, title: 'Objective and Plan', videoCount: 13 },
  { id: 665, title: 'Perspective and Identity', videoCount: 20 },
  { id: 664, title: 'Engagement During Leadership Transition', videoCount: 3 },
  { id: 663, title: 'Leadership and Trust - Achieve (4 of 4)', videoCount: 11 },
  { id: 662, title: 'Leadership and Trust - Act (3 of 4)', videoCount: 10 },
  { id: 661, title: 'Leadership and Trust - Assemble (2 of 4)', videoCount: 10 },
  { id: 660, title: 'Leadership and Trust - Orient (1 of 4)', videoCount: 11 },
  { id: 659, title: 'The Five Voices', videoCount: 15 },
  { id: 658, title: 'Leadership and Resilience', videoCount: 12 },
  { id: 657, title: 'Leadership & Community - Achieve (4 of 4)', videoCount: 10 },
  { id: 656, title: 'Leadership & Community - Act (3 of 4)', videoCount: 9 },
  { id: 655, title: 'Leadership & Community - Assemble (2 of 4)', videoCount: 9 },
  { id: 654, title: 'Leadership & Community - Orient (1 of 4)', videoCount: 11 },
  { id: 653, title: 'Extraordinary vs Extravagant', videoCount: 24 },
  { id: 652, title: 'The Performance Iceberg', videoCount: 1 },
  { id: 651, title: 'The Control Spectrum', videoCount: 8 },
  { id: 650, title: 'Score', videoCount: 13 },
  { id: 649, title: 'Plan', videoCount: 9 },
  { id: 648, title: 'Perspective', videoCount: 18 },
  { id: 647, title: 'Objective', videoCount: 8 },
  { id: 646, title: 'Investment', videoCount: 11 },
  { id: 645, title: 'Identity', videoCount: 14 },
  { id: 644, title: 'Choose to Thrive', videoCount: 10 },
  { id: 643, title: 'Why Energy Matters Most', videoCount: 6 },
  { id: 642, title: 'Value', videoCount: 13 },
  { id: 641, title: 'The Energy Iceberg Part 2', videoCount: 19 },
  { id: 640, title: 'The Energy Iceberg Part 1', videoCount: 11 },
  { id: 639, title: 'The 16 Elements \u2013 An Overview', videoCount: 1 },
  { id: 638, title: 'Space', videoCount: 8 },
  { id: 637, title: 'Renewal', videoCount: 15 },
  { id: 636, title: 'Relationship', videoCount: 9 },
  { id: 635, title: 'New Boots', videoCount: 2 },
  { id: 634, title: 'Momentum', videoCount: 10 },
  { id: 633, title: 'Mentor', videoCount: 11 },
  { id: 632, title: 'Leaving Your Comfort Zone', videoCount: 1 },
  { id: 631, title: 'Impact', videoCount: 13 },
  { id: 630, title: 'Growth', videoCount: 10 },
  { id: 629, title: 'Environment', videoCount: 12 },
  { id: 628, title: 'Alignment', videoCount: 14 },
  { id: 627, title: 'The Orbits Model', videoCount: 10 },
  // Duplicates and orphans from production
  { id: 624, title: 'Perspective and Identity', videoCount: 20 }, // DUPLICATE
  { id: 623, title: 'People Create Value', videoCount: 1 },       // ORPHAN (deleted locally)
  { id: 621, title: 'Investment and Score', videoCount: 15 },     // DUPLICATE
  { id: 620, title: 'Objective and Plan', videoCount: 13 },       // DUPLICATE
  { id: 615, title: 'Extraordinary vs Extravagant', videoCount: 18 }, // DUPLICATE (fewer videos)
  { id: 614, title: 'Choose To Thrive', videoCount: 10 },         // DUPLICATE (different casing)
  { id: 613, title: 'The Control Spectrum', videoCount: 15 },     // Better version than 651
  { id: 612, title: 'The Control Spectrum', videoCount: 0 },      // EMPTY
];

// ===== Utility Functions =====

/**
 * Normalize a title for comparison
 * - Convert to lowercase
 * - Trim whitespace
 * - Normalize special characters (dashes, ampersands, quotes)
 * - Normalize spacing
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Normalize dashes
    .replace(/[\u2013\u2014\u2212]/g, '-')
    // Normalize ampersands
    .replace(/&amp;/g, '&')
    // Normalize quotes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
    // Remove leading/trailing spaces around dashes
    .replace(/\s*-\s*/g, ' - ')
    .trim();
}

/**
 * Check if two normalized titles match
 */
function titlesMatch(title1: string, title2: string): boolean {
  return normalizeTitle(title1) === normalizeTitle(title2);
}

// ===== Main Mapping Logic =====

function buildSyncRecommendations(): SyncRecommendations {
  const mappings: CourseMapping[] = [];
  const keep: KeepAction[] = [];
  const archive: ArchiveAction[] = [];
  const push: PushAction[] = [];

  // Track which prod courses have been matched
  const matchedProdIds = new Set<number>();
  const matchedLocalIds = new Set<number>();

  // Group prod courses by normalized title
  const prodByNormalizedTitle = new Map<string, ProdCourse[]>();
  for (const prod of prodCourses) {
    const normalized = normalizeTitle(prod.title);
    if (!prodByNormalizedTitle.has(normalized)) {
      prodByNormalizedTitle.set(normalized, []);
    }
    prodByNormalizedTitle.get(normalized)!.push(prod);
  }

  // Step 1: Match local courses to prod courses by title
  for (const local of localCourses) {
    const normalizedLocal = normalizeTitle(local.title);
    const matchingProdCourses = prodByNormalizedTitle.get(normalizedLocal) || [];

    if (matchingProdCourses.length === 0) {
      // MISSING_PROD: No prod course for this local course
      mappings.push({
        localId: local.id,
        localTitle: local.title,
        prodId: null,
        prodTitle: null,
        normalizedTitle: normalizedLocal,
        action: 'MISSING_PROD',
        reason: 'Local course not found in production',
        localVideoCount: local.videoCount,
        prodVideoCount: 0,
      });

      push.push({
        localId: local.id,
        title: local.title,
        reason: 'Local course not found in production',
        videoCount: local.videoCount,
      });

      matchedLocalIds.add(local.id);

    } else if (matchingProdCourses.length === 1) {
      // MATCH: Exactly one prod course matches
      const prod = matchingProdCourses[0];
      mappings.push({
        localId: local.id,
        localTitle: local.title,
        prodId: prod.id,
        prodTitle: prod.title,
        normalizedTitle: normalizedLocal,
        action: 'MATCH',
        reason: 'Title match',
        localVideoCount: local.videoCount,
        prodVideoCount: prod.videoCount,
      });

      keep.push({
        prodId: prod.id,
        title: prod.title,
        localId: local.id,
        videoCount: prod.videoCount,
      });

      matchedProdIds.add(prod.id);
      matchedLocalIds.add(local.id);

    } else {
      // DUPLICATE_PROD: Multiple prod courses for same title
      // Keep the one with the most videos (or highest ID if tied)
      const sorted = [...matchingProdCourses].sort((a, b) => {
        if (b.videoCount !== a.videoCount) {
          return b.videoCount - a.videoCount; // Most videos first
        }
        return b.id - a.id; // Higher ID first (usually newer)
      });

      const best = sorted[0];
      const duplicates = sorted.slice(1);

      // Add mapping for the best match
      mappings.push({
        localId: local.id,
        localTitle: local.title,
        prodId: best.id,
        prodTitle: best.title,
        normalizedTitle: normalizedLocal,
        action: 'MATCH',
        reason: `Best of ${matchingProdCourses.length} duplicates (most videos)`,
        localVideoCount: local.videoCount,
        prodVideoCount: best.videoCount,
      });

      keep.push({
        prodId: best.id,
        title: best.title,
        localId: local.id,
        videoCount: best.videoCount,
      });

      matchedProdIds.add(best.id);
      matchedLocalIds.add(local.id);

      // Add archive actions for duplicates
      for (const dup of duplicates) {
        mappings.push({
          localId: null,
          localTitle: null,
          prodId: dup.id,
          prodTitle: dup.title,
          normalizedTitle: normalizedLocal,
          action: 'DUPLICATE_PROD',
          reason: dup.videoCount === 0
            ? 'Empty duplicate'
            : `Duplicate of ${best.id} (${dup.videoCount} vs ${best.videoCount} videos)`,
          localVideoCount: 0,
          prodVideoCount: dup.videoCount,
        });

        archive.push({
          prodId: dup.id,
          title: dup.title,
          reason: dup.videoCount === 0
            ? 'Empty duplicate'
            : `Duplicate of ${best.id} with fewer/equal videos (${dup.videoCount} vs ${best.videoCount})`,
        });

        matchedProdIds.add(dup.id);
      }
    }
  }

  // Step 2: Identify orphan prod courses (no local match)
  for (const prod of prodCourses) {
    if (!matchedProdIds.has(prod.id)) {
      const normalizedProd = normalizeTitle(prod.title);
      mappings.push({
        localId: null,
        localTitle: null,
        prodId: prod.id,
        prodTitle: prod.title,
        normalizedTitle: normalizedProd,
        action: 'ORPHAN_PROD',
        reason: prod.videoCount === 0
          ? 'Empty course with no local match'
          : 'Production course has no matching local course',
        localVideoCount: 0,
        prodVideoCount: prod.videoCount,
      });

      archive.push({
        prodId: prod.id,
        title: prod.title,
        reason: prod.videoCount === 0
          ? 'Empty course with no local match'
          : 'Production course has no matching local course (possibly deleted locally)',
      });
    }
  }

  // Calculate summary
  const summary = {
    totalLocal: localCourses.length,
    totalProd: prodCourses.length,
    matched: keep.length,
    duplicatesInProd: mappings.filter(m => m.action === 'DUPLICATE_PROD').length,
    orphansInProd: mappings.filter(m => m.action === 'ORPHAN_PROD').length,
    missingInProd: mappings.filter(m => m.action === 'MISSING_PROD').length,
  };

  return {
    timestamp: new Date().toISOString(),
    summary,
    keep,
    archive,
    push,
    mappings,
  };
}

// ===== Output Functions =====

function printSummaryTable(recommendations: SyncRecommendations): void {
  const { summary, keep, archive, push, mappings } = recommendations;

  console.log('='.repeat(80));
  console.log('             PRODUCTION SYNC MAPPING ANALYSIS');
  console.log('='.repeat(80));
  console.log();

  // Summary stats
  console.log('SUMMARY');
  console.log('-'.repeat(80));
  console.log(`  Local courses:      ${summary.totalLocal}`);
  console.log(`  Production courses: ${summary.totalProd}`);
  console.log();
  console.log(`  Matched:            ${summary.matched}`);
  console.log(`  Duplicates in Prod: ${summary.duplicatesInProd}`);
  console.log(`  Orphans in Prod:    ${summary.orphansInProd}`);
  console.log(`  Missing in Prod:    ${summary.missingInProd}`);
  console.log();

  // Keep table
  if (keep.length > 0) {
    console.log('KEEP (Production courses to retain)');
    console.log('-'.repeat(80));
    console.log('  Prod ID | Local ID | Videos | Title');
    console.log('  --------|----------|--------|' + '-'.repeat(45));
    for (const k of keep.sort((a, b) => a.prodId - b.prodId)) {
      const title = k.title.length > 42 ? k.title.substring(0, 39) + '...' : k.title;
      console.log(`  ${String(k.prodId).padStart(7)} | ${String(k.localId).padStart(8)} | ${String(k.videoCount).padStart(6)} | ${title}`);
    }
    console.log();
  }

  // Archive table
  if (archive.length > 0) {
    console.log('ARCHIVE (Production courses to remove)');
    console.log('-'.repeat(80));
    console.log('  Prod ID | Title                                     | Reason');
    console.log('  --------|-------------------------------------------|' + '-'.repeat(30));
    for (const a of archive.sort((a, b) => a.prodId - b.prodId)) {
      const title = a.title.length > 40 ? a.title.substring(0, 37) + '...' : a.title.padEnd(40);
      const reason = a.reason.length > 28 ? a.reason.substring(0, 25) + '...' : a.reason;
      console.log(`  ${String(a.prodId).padStart(7)} | ${title} | ${reason}`);
    }
    console.log();
  }

  // Push table
  if (push.length > 0) {
    console.log('PUSH (Local courses to sync to production)');
    console.log('-'.repeat(80));
    console.log('  Local ID | Videos | Title');
    console.log('  ---------|--------|' + '-'.repeat(55));
    for (const p of push.sort((a, b) => a.localId - b.localId)) {
      const title = p.title.length > 52 ? p.title.substring(0, 49) + '...' : p.title;
      console.log(`  ${String(p.localId).padStart(8)} | ${String(p.videoCount).padStart(6)} | ${title}`);
    }
    console.log();
  }

  // Detailed mappings
  console.log('DETAILED MAPPINGS');
  console.log('-'.repeat(80));
  console.log('  Action         | Local | Prod  | Title');
  console.log('  ---------------|-------|-------|' + '-'.repeat(46));

  // Group by action for better readability
  const actionOrder: SyncAction[] = ['MATCH', 'DUPLICATE_PROD', 'ORPHAN_PROD', 'MISSING_PROD'];

  for (const action of actionOrder) {
    const actionMappings = mappings.filter(m => m.action === action);
    if (actionMappings.length > 0) {
      for (const m of actionMappings.sort((a, b) => {
        const idA = a.localId || a.prodId || 0;
        const idB = b.localId || b.prodId || 0;
        return idA - idB;
      })) {
        const actionStr = m.action.padEnd(14);
        const localStr = m.localId ? String(m.localId).padStart(5) : '  -  ';
        const prodStr = m.prodId ? String(m.prodId).padStart(5) : '  -  ';
        const title = (m.localTitle || m.prodTitle || '').substring(0, 43);
        console.log(`  ${actionStr} | ${localStr} | ${prodStr} | ${title}`);
      }
    }
  }
  console.log();

  console.log('='.repeat(80));
  console.log('Analysis complete. See JSON output for full details.');
  console.log('='.repeat(80));
}

// ===== Main =====

function main(): void {
  console.log('Building production sync mapping...\n');

  const recommendations = buildSyncRecommendations();

  // Print summary table to console
  printSummaryTable(recommendations);

  // Write JSON output
  const outputPath = path.resolve(__dirname, '../.context/production-sync-recommendations.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(recommendations, null, 2));

  console.log(`\nJSON output written to: ${outputPath}`);

  // Also output a simplified JSON for quick reference
  const simplifiedOutput = {
    keep: recommendations.keep.map(k => ({ prodId: k.prodId, title: k.title, localId: k.localId })),
    archive: recommendations.archive.map(a => ({ prodId: a.prodId, title: a.title, reason: a.reason })),
    push: recommendations.push.map(p => ({ localId: p.localId, title: p.title, reason: p.reason })),
  };

  const simplifiedPath = path.resolve(__dirname, '../.context/sync-actions.json');
  fs.writeFileSync(simplifiedPath, JSON.stringify(simplifiedOutput, null, 2));

  console.log(`Simplified actions written to: ${simplifiedPath}`);
}

main();
