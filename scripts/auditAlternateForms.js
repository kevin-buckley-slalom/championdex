#!/usr/bin/env node

/**
 * Audit Alternate Forms Script
 *
 * Verifies that all alternate forms in @pkmn/dex can be properly resolved to PokeAPI IDs.
 * Checks:
 * 1. Slug generation correctness
 * 2. Exclusion list coverage
 * 3. PokeAPI endpoint availability (HEAD request)
 * 4. Artwork URL validity
 *
 * Usage: node scripts/auditAlternateForms.js
 */

const https = require('https');
const { URL } = require('url');
const { Dex } = require('@pkmn/dex');

// ============================================================================
// EXCLUSION SET AND SLUG GENERATION (copied from seedDatabase.ts)
// ============================================================================

const POKEAPI_EXCLUSION_SET = new Set([
  'pikachu-alola', // Not a separate PokeAPI entry
  'marowak-alola-totem', // Totem forms not in PokeAPI
  'marowak-totem-alola', // Totem forms not in PokeAPI
]);

function generatePokeApiSlug(speciesName, forme = '') {
  let slug = speciesName.toLowerCase();
  slug = slug.replace(/ /g, '-');

  // Strip special characters (apostrophes — both straight ' U+0027 and curly ' U+2019, and periods)
  slug = slug.replace(/['’.]/g, '');

  // Handle female/male form suffix conversion ONLY for gender formes.
  // PokeAPI uses -female/-male for gender-specific formes (like Meowstic-F → meowstic-female),
  // but some species like Nidoran-F are standalone with -f/-m in their actual slug.
  // Only replace if forme explicitly indicates it's a gender forme.
  if (forme === 'F') {
    slug = slug.replace(/-f$/, '-female');
  } else if (forme === 'M') {
    slug = slug.replace(/-m$/, '-male');
  }

  const totemMatch = slug.match(/^(.+?)-(alola|galar|hisui|paldea)-totem$/);
  if (totemMatch) {
    const [, baseName, region] = totemMatch;
    slug = `${baseName}-totem-${region}`;
  }

  // Special case: Tauros Paldean forms need "-breed" suffix
  // e.g., tauros-paldea-combat → tauros-paldea-combat-breed
  if (slug.match(/^tauros-paldea-(combat|blaze|aqua)$/)) {
    slug = `${slug}-breed`;
  }

  // Special case: Darmanitan-Galar needs "-standard" suffix
  // e.g., darmanitan-galar → darmanitan-galar-standard
  if (slug === 'darmanitan-galar') {
    slug = 'darmanitan-galar-standard';
  }

  // Special case: Toxtricity-Gmax is the Gmax of the amped form (base Toxtricity)
  // e.g., toxtricity-gmax → toxtricity-amped-gmax (ID 10219)
  if (slug === 'toxtricity-gmax') {
    slug = 'toxtricity-amped-gmax';
  }

  // Special case: Urshifu-Gmax is the Gmax of the single-strike form (base Urshifu)
  // e.g., urshifu-gmax → urshifu-single-strike-gmax (ID 10226)
  if (slug === 'urshifu-gmax') {
    slug = 'urshifu-single-strike-gmax';
  }

  return slug;
}

function determineFormType(species) {
  const name = species.name.toLowerCase();

  if (name.includes('-alola') || name.includes('-galar') || name.includes('-hisui') || name.includes('-paldea')) {
    return 'regional';
  }
  if (name.includes('-mega')) {
    return 'mega';
  }
  if (name.includes('-gmax')) {
    return 'gigantamax';
  }
  if (name.endsWith('-f') || name.endsWith('-m')) {
    return 'cosmetic';
  }

  return 'default';
}

// ============================================================================
// HTTP HELPERS
// ============================================================================

function httpsHead(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'HEAD',
      timeout: 5000,
    };

    https
      .request(options, (res) => {
        resolve(res.statusCode);
      })
      .on('error', (err) => {
        reject(err);
      })
      .end();
  });
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// MAIN AUDIT LOGIC
// ============================================================================

async function auditAlternateForms() {
  console.log('🔍 Auditing alternate forms from @pkmn/dex...\n');

  const speciesData = Dex.species.all();
  const results = [];
  let requestCount = 0;

  const startTime = Date.now();

  for (const species of speciesData) {
    // Skip non-existent or excluded species types
    if (!species.exists || species.isNonstandard === 'CAP' || species.isNonstandard === 'Future' || species.isNonstandard === 'Custom') {
      continue;
    }

    const formType = determineFormType(species);

    // Only audit alternate forms
    if (formType === 'default') {
      continue;
    }

    const pokeApiSlug = generatePokeApiSlug(species.name, species.forme);
    const isExcluded = POKEAPI_EXCLUSION_SET.has(pokeApiSlug);

    let status = 'UNKNOWN';
    let pokeApiId = null;
    let artworkUrl = null;
    let reason = '';

    if (isExcluded) {
      status = 'EXCLUDED';
      reason = 'In exclusion list (form does not exist or is ambiguous)';
    } else {
      // Make HEAD request to PokeAPI to check if the endpoint exists
      const pokeApiUrl = `https://pokeapi.co/api/v2/pokemon/${pokeApiSlug}`;

      try {
        requestCount++;

        // Rate limiting: 200ms between requests
        if (requestCount > 1) {
          await sleep(200);
        }

        const statusCode = await httpsHead(pokeApiUrl);

        if (statusCode === 200) {
          // Now fetch the full response to get the ID for artwork verification
          status = 'OK';
          reason = 'Slug resolves to PokeAPI form';

          // Fetch the JSON to get the ID
          try {
            const json = await httpsGet(pokeApiUrl);
            pokeApiId = json.id;

            // Check artwork URL only if we got an ID
            if (pokeApiId) {
              artworkUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokeApiId}.png`;

              requestCount++;
              await sleep(200);

              try {
                const artworkStatus = await httpsHead(artworkUrl);
                if (artworkStatus !== 200) {
                  status = 'ARTWORK_MISSING';
                  reason = `Artwork not found (HTTP ${artworkStatus})`;
                }
              } catch (e) {
                status = 'ARTWORK_MISSING';
                reason = `Artwork check failed: ${e.message}`;
              }
            }
          } catch (error) {
            status = 'ERROR';
            reason = `Failed to fetch PokeAPI data: ${error.message}`;
          }
        } else if (statusCode === 404) {
          status = 'SLUG_404';
          reason = `Slug not found in PokeAPI (HTTP 404) — may need exclusion list addition`;
        } else {
          status = 'UNKNOWN_HTTP';
          reason = `Unexpected HTTP ${statusCode}`;
        }
      } catch (error) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          status = 'NETWORK_ERROR';
          reason = `Network error: ${error.code}`;
        } else {
          status = 'ERROR';
          reason = `Error: ${error.message}`;
        }
      }
    }

    results.push({
      displayName: species.name,
      speciesId: species.id,
      formType,
      pokeApiSlug,
      status,
      pokeApiId,
      artworkUrl,
      reason,
      nationalDex: species.num,
    });
  }

  // =========================================================================
  // OUTPUT RESULTS
  // =========================================================================

  console.log('📊 ALTERNATE FORMS AUDIT RESULTS\n');
  console.log('='.repeat(130));

  // Print table header
  console.log(
    'Display Name'.padEnd(30) +
    'Slug'.padEnd(35) +
    'Status'.padEnd(18) +
    'ID'.padEnd(6) +
    'Reason'.padEnd(40)
  );
  console.log('='.repeat(130));

  // Print results
  const statusColors = {
    'OK': '✅',
    'EXCLUDED': '⏭️ ',
    'SLUG_404': '❌',
    'ARTWORK_MISSING': '🖼️ ',
    'FALLBACK_TO_BASE': '⚠️ ',
    'NETWORK_ERROR': '🌐',
    'ERROR': '❗',
    'UNKNOWN_HTTP': '❓',
  };

  for (const result of results) {
    const color = statusColors[result.status] || '?';
    const idStr = result.pokeApiId ? String(result.pokeApiId) : '—';

    console.log(
      result.displayName.padEnd(30) +
      result.pokeApiSlug.padEnd(35) +
      `${color} ${result.status}`.padEnd(18) +
      idStr.padEnd(6) +
      result.reason.substring(0, 40).padEnd(40)
    );
  }

  console.log('='.repeat(130));

  // =========================================================================
  // SUMMARY
  // =========================================================================

  const totalForms = results.length;
  const okCount = results.filter((r) => r.status === 'OK').length;
  const excludedCount = results.filter((r) => r.status === 'EXCLUDED').length;
  const failureCount = results.filter((r) => !['OK', 'EXCLUDED'].includes(r.status)).length;
  const slug404 = results.filter((r) => r.status === 'SLUG_404');
  const artworkMissing = results.filter((r) => r.status === 'ARTWORK_MISSING');
  const networkErrors = results.filter((r) => r.status === 'NETWORK_ERROR' || r.status === 'ERROR');
  const unknownHttp = results.filter((r) => r.status === 'UNKNOWN_HTTP');

  console.log('\n📈 SUMMARY\n');
  console.log(`Total alternate forms: ${totalForms}`);
  console.log(`✅ OK (resolve to PokeAPI): ${okCount}`);
  console.log(`⏭️  Excluded (intentional): ${excludedCount}`);
  console.log(`❌ Failures: ${failureCount}`);
  console.log(`   • Slug 404s: ${slug404.length}`);
  console.log(`   • HTTP errors (400, etc.): ${unknownHttp.length}`);
  console.log(`   • Artwork missing: ${artworkMissing.length}`);
  console.log(`   • Network/other errors: ${networkErrors.length}`);

  if (slug404.length > 0) {
    console.log('\n⚠️  UNKNOWN FAILURES (NOT IN EXCLUSION LIST):\n');
    slug404.forEach((r) => {
      console.log(`  • ${r.displayName} → ${r.pokeApiSlug}`);
      console.log(`    National Dex: ${r.nationalDex}, Form Type: ${r.formType}`);
      console.log(`    → Add to POKEAPI_EXCLUSION_SET if this is an invalid combined form\n`);
    });
  }

  if (artworkMissing.length > 0) {
    console.log('\n🖼️  ARTWORK URL ISSUES:\n');
    artworkMissing.forEach((r) => {
      console.log(`  • ${r.displayName} → ID ${r.pokeApiId}`);
      console.log(`    Artwork URL: ${r.artworkUrl}`);
      console.log(`    ${r.reason}\n`);
    });
  }

  const elapsed = Date.now() - startTime;
  console.log(`\n⏱️  Audit completed in ${(elapsed / 1000).toFixed(1)}s`);
  console.log(`🌐 PokeAPI requests made: ${requestCount}`);

  // Exit with success code if no critical failures
  if (failureCount === 0) {
    console.log('\n✅ All alternate forms are properly configured!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Issues detected. Review above.\n');
    process.exit(1);
  }
}

// ============================================================================
// RUN AUDIT
// ============================================================================

auditAlternateForms().catch((error) => {
  console.error('❌ Audit failed:', error);
  process.exit(1);
});
