// utils.js - Shared utility functions for Car Research Assistant
// Used by both popup.js and background.js


// ─────────────────────────────────────────────
// CARCOMPLAINTS MAKE REGISTRY
// ─────────────────────────────────────────────
// Each entry: [urlPath, displayName, [...aliases to match in listing titles]]
//
// urlPath    → exact path segment used on carcomplaints.com
// displayName → how we display the make in the UI
// aliases    → lowercase strings to detect this make in a scraped car title
//
// ORDERING RULES:
//   1. Multi-word makes must come before any single word that is a subset
//      (e.g. "Land Rover" before "Rover", "Alfa Romeo" before any single word)
//   2. More specific aliases before generic ones
//      (e.g. "mercedes-benz" before "mercedes")
//   3. VW and Volkswagen are SEPARATE entries on CarComplaints — both kept.

const MAKE_REGISTRY = [
    // urlPath            displayName        aliases (lowercase)
    ['Mercedes-Benz',   'Mercedes-Benz',   ['mercedes-benz', 'mercedes benz', 'mercedes']],
    ['Land_Rover',      'Land Rover',      ['land rover']],
    ['Alfa_Romeo',      'Alfa Romeo',      ['alfa romeo']],
    ['Aston_Martin',    'Aston Martin',    ['aston martin']],  // not on CarComplaints but display-safe
    ['Acura',           'Acura',           ['acura']],
    ['AMC',             'AMC',             ['amc']],
    ['Audi',            'Audi',            ['audi']],
    ['Bentley',         'Bentley',         ['bentley']],
    ['BMW',             'BMW',             ['bmw']],
    ['Buick',           'Buick',           ['buick']],
    ['Cadillac',        'Cadillac',        ['cadillac']],
    ['Chery',           'Chery',           ['chery']],
    ['Chevrolet',       'Chevrolet',       ['chevrolet', 'chevy']],
    ['Chrysler',        'Chrysler',        ['chrysler']],
    ['Daewoo',          'Daewoo',          ['daewoo']],
    ['Daihatsu',        'Daihatsu',        ['daihatsu']],
    ['Datsun',          'Datsun',          ['datsun']],
    ['Dodge',           'Dodge',           ['dodge']],
    ['Eagle',           'Eagle',           ['eagle']],
    ['Ferrari',         'Ferrari',         ['ferrari']],
    ['Fiat',            'Fiat',            ['fiat']],
    ['Ford',            'Ford',            ['ford']],
    ['Genesis',         'Genesis',         ['genesis']],
    ['Geo',             'Geo',             ['geo']],
    ['GMC',             'GMC',             ['gmc']],
    ['Holden',          'Holden',          ['holden']],
    ['Honda',           'Honda',           ['honda']],
    ['HSV',             'HSV',             ['hsv']],
    ['Hummer',          'Hummer',          ['hummer']],
    ['Hyundai',         'Hyundai',         ['hyundai']],
    ['Infiniti',        'Infiniti',        ['infiniti']],
    ['Isuzu',           'Isuzu',           ['isuzu']],
    ['Jaguar',          'Jaguar',          ['jaguar']],
    ['Jeep',            'Jeep',            ['jeep']],
    ['Kenworth',        'Kenworth',        ['kenworth']],
    ['Kia',             'Kia',             ['kia']],
    ['Lamborghini',     'Lamborghini',     ['lamborghini']],
    ['Lexus',           'Lexus',           ['lexus']],
    ['Lincoln',         'Lincoln',         ['lincoln']],
    ['Lotus',           'Lotus',           ['lotus']],
    ['Mahindra',        'Mahindra',        ['mahindra']],
    ['Maruti',          'Maruti',          ['maruti']],
    ['Maserati',        'Maserati',        ['maserati']],
    ['Mazda',           'Mazda',           ['mazda']],
    ['Mercury',         'Mercury',         ['mercury']],
    ['Mini',            'Mini',            ['mini']],
    ['Mitsubishi',      'Mitsubishi',      ['mitsubishi']],
    ['Nissan',          'Nissan',          ['nissan']],
    ['Oldsmobile',      'Oldsmobile',      ['oldsmobile']],
    ['Opel',            'Opel',            ['opel']],
    ['Peugeot',         'Peugeot',         ['peugeot']],
    ['Plymouth',        'Plymouth',        ['plymouth']],
    ['Pontiac',         'Pontiac',         ['pontiac']],
    ['Porsche',         'Porsche',         ['porsche']],
    ['Ram',             'Ram',             ['ram']],
    ['Renault',         'Renault',         ['renault']],
    ['Rivian',          'Rivian',          ['rivian']],
    ['Rover',           'Rover',           ['rover']],        // must come AFTER Land_Rover
    ['Saab',            'Saab',            ['saab']],
    ['Saturn',          'Saturn',          ['saturn']],
    ['Scion',           'Scion',           ['scion']],
    ['Seat',            'Seat',            ['seat']],
    ['Skoda',           'Skoda',           ['skoda']],
    ['Smart',           'Smart',           ['smart']],
    ['Ssangyong',       'Ssangyong',       ['ssangyong']],
    ['Subaru',          'Subaru',          ['subaru']],
    ['Suzuki',          'Suzuki',          ['suzuki']],
    ['Tata',            'Tata',            ['tata']],
    ['Tesla',           'Tesla',           ['tesla']],
    ['Toyota',          'Toyota',          ['toyota']],
    ['Vauxhall',        'Vauxhall',        ['vauxhall']],
    ['Volvo',           'Volvo',           ['volvo']],
    ['Volkswagen',      'Volkswagen',      ['volkswagen', 'vw']],
    ['Yugo',            'Yugo',            ['yugo']],
    ['Zimmer',          'Zimmer',          ['zimmer']],
];


// ─────────────────────────────────────────────
// COMPLAINT KEY
// ─────────────────────────────────────────────

/**
 * Generates a consistent storage key for a car type.
 * Uses the urlPath (not displayName) so the key always matches the URL.
 * Example: ("VW", "Golf", "2018") → "vw_golf_2018"
 * Example: ("Land_Rover", "Discovery", "2019") → "land_rover_discovery_2019"
 */
function makeComplaintKey(urlPath, model, year) {
    return `${urlPath}_${model}_${year}`.toLowerCase();
}


// ─────────────────────────────────────────────
// CARCOMPLAINTS URL BUILDER
// ─────────────────────────────────────────────

/**
 * Builds the exact CarComplaints URL for a given urlPath, model, and year.
 * The model segment also has spaces replaced with underscores for safety.
 * Example: ("Land_Rover", "Discovery", "2019")
 *        → "https://www.carcomplaints.com/Land_Rover/Discovery/2019/"
 */
function getCarComplaintsUrl(urlPath, model, year) {
    const modelPath = model.replace(/\s+/g, '_');
    return `https://www.carcomplaints.com/${urlPath}/${modelPath}/${year}/`;
}


// ─────────────────────────────────────────────
// TITLE PARSER
// ─────────────────────────────────────────────

/**
 * Extracts make, model, and year from a car listing title string.
 *
 * Returns:
 * {
 *   make:        display name,  e.g. "Volkswagen"
 *   urlPath:     CC path,       e.g. "VW"
 *   model:       e.g. "Golf"
 *   year:        e.g. "2018"
 *   complaintKey e.g. "vw_golf_2018"
 * }
 * All fields are null if parsing fails.
 */
function parseCarTitle(title) {
    const empty = { make: null, urlPath: null, model: null, year: null, complaintKey: null };
    if (!title) return empty;

    console.log('[utils] Parsing title:', title);

    // ── Year ──────────────────────────────────
    const yearMatch = title.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? yearMatch[0] : null;

    // ── Make ──────────────────────────────────
    const titleLower = title.toLowerCase();
    let urlPath      = null;
    let displayName  = null;
    let matchedAlias = null;

    for (const [path, name, aliases] of MAKE_REGISTRY) {
        for (const alias of aliases) {
            if (titleLower.includes(alias)) {
                urlPath      = path;
                displayName  = name;
                matchedAlias = alias;
                break;
            }
        }
        if (urlPath) break;
    }

    // ── Model ─────────────────────────────────
    let model = null;

    if (urlPath && matchedAlias) {
        const aliasIndex = titleLower.indexOf(matchedAlias);
        const afterMake  = title.substring(aliasIndex + matchedAlias.length).trim();

        // Matches first word including hyphens: F-150, CX-5, E-Class, GLC-300
        const modelMatch = afterMake.match(/^([A-Za-z0-9][-A-Za-z0-9]*)/);
        if (modelMatch) {
            model = modelMatch[1];
        }
    }

    const complaintKey = (urlPath && model && year)
        ? makeComplaintKey(urlPath, model, year)
        : null;

    const result = { make: displayName, urlPath, model, year, complaintKey };
    console.log('[utils] Parsed result:', result);
    return result;
}


// ─────────────────────────────────────────────
// UNIQUE CAR TYPES
// ─────────────────────────────────────────────

/**
 * Derives the unique set of make/model/year combinations from a saved car list.
 * Returns an object keyed by complaintKey.
 *
 * Example:
 * {
 *   "vw_golf_2018":          { make: "Volkswagen", urlPath: "VW",        model: "Golf",      year: "2018" },
 *   "land_rover_discovery_2019": { make: "Land Rover", urlPath: "Land_Rover", model: "Discovery", year: "2019" }
 * }
 */
function getUniqueCarTypes(cars) {
    const types = {};

    cars.forEach(car => {
        if (!car.title) return;
        const { make, urlPath, model, year, complaintKey } = parseCarTitle(car.title);
        if (!complaintKey) return;

        if (!types[complaintKey]) {
            types[complaintKey] = { make, urlPath, model, year };
        }
    });

    return types;
}


// ─────────────────────────────────────────────
// MISSING COMPLAINT KEYS
// ─────────────────────────────────────────────

/**
 * Returns complaint keys present in uniqueCarTypes but absent from savedComplaints.
 *
 * @param {Object} uniqueCarTypes  - Output of getUniqueCarTypes()
 * @param {Object} savedComplaints - The savedComplaints object from chrome.storage
 * @returns {string[]} Keys that still need fetching
 */
function getMissingComplaintKeys(uniqueCarTypes, savedComplaints) {
    return Object.keys(uniqueCarTypes).filter(key => !savedComplaints[key]);
}


// ─────────────────────────────────────────────
// MODULE EXPORT (Node.js / unit testing only)
// ─────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MAKE_REGISTRY,
        makeComplaintKey,
        getCarComplaintsUrl,
        parseCarTitle,
        getUniqueCarTypes,
        getMissingComplaintKeys
    };
}