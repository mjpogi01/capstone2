const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const shapefile = require('shapefile');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Optional data files - script will work without them
let barangayDataset = null;
let barangayCentroidPath = null;
try {
  barangayDataset = require('./data/barangays-calabarzon-oriental-mindoro.json');
} catch (e) {
  console.warn('⚠️  Barangay dataset not found, using fallback address generation');
}
try {
  // Try both possible file names
  barangayCentroidPath = path.join(__dirname, 'data', 'barangay-centroids-all.csv');
  if (!fs.existsSync(barangayCentroidPath)) {
    barangayCentroidPath = path.join(__dirname, 'data', 'barangay-centroids.csv');
    if (!fs.existsSync(barangayCentroidPath)) {
      barangayCentroidPath = null;
    }
  }
} catch (e) {
  barangayCentroidPath = null;
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/);
  if (lines.length === 0) {
    return [];
  }
  const headers = lines.shift().split(',').map(header => header.trim());
  const rows = [];

  for (const line of lines) {
    if (!line || !line.trim()) {
      continue;
    }

    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] !== undefined ? values[index].trim() : '';
    });
    rows.push(row);
  }

  return rows;
}

function loadBarangayCentroids(csvPath) {
  try {
    if (!csvPath || !fs.existsSync(csvPath)) {
      console.warn('⚠️ Barangay centroid file not found:', csvPath);
      return { byCode: new Map(), byName: new Map() };
    }

    const raw = fs.readFileSync(csvPath, 'utf8').trim();
    if (!raw) {
      return { byCode: new Map(), byName: new Map() };
    }

    const records = parseCsv(raw);
    const mapByCode = new Map();
    const mapByName = new Map(); // Key: "city|barangay_name" -> {latitude, longitude, ...}

    records.forEach((row) => {
      const code = (row.barangay_psgc || '').trim();
      const barangayName = (row.barangay_name || '').trim();
      const cityCode = (row.city_muni_psgc || '').trim();
      const provinceCode = (row.province_psgc || '').trim();
      
      if (!code && !barangayName) {
        return;
      }
      
      const latitude = Number(row.latitude);
      const longitude = Number(row.longitude);
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return;
      }
      
      const centroidData = {
        latitude,
        longitude,
        regionCode: (row.region_psgc || '').trim() || null,
        provinceCode: provinceCode || null,
        cityCode: cityCode || null,
        barangayName: barangayName || null
      };
      
      // Store by code if available
      if (code) {
        mapByCode.set(code, centroidData);
      }
      
      // Store by name for lookup (normalized key: "cityCode|barangayName")
      if (barangayName && cityCode) {
        const nameKey = `${cityCode}|${normaliseKey(barangayName)}`;
        // Store multiple entries if same name exists (use first one found)
        if (!mapByName.has(nameKey)) {
          mapByName.set(nameKey, centroidData);
        }
      }
      
      // Also store by just barangay name (normalized) for fallback matching
      if (barangayName) {
        const normalizedName = normaliseKey(barangayName);
        if (!mapByName.has(normalizedName)) {
          mapByName.set(normalizedName, centroidData);
        }
      }
    });

    console.log(`✅ Loaded ${mapByCode.size} barangay centroids by code, ${mapByName.size} by name`);
    return { byCode: mapByCode, byName: mapByName };
  } catch (error) {
    console.warn('⚠️ Unable to load barangay centroid data:', error.message);
    return { byCode: new Map(), byName: new Map() };
  }
}

const BARANGAY_COORDINATES = loadBarangayCentroids(barangayCentroidPath);
const BARANGAY_COORDINATES_BY_CODE = BARANGAY_COORDINATES.byCode || new Map();
const BARANGAY_COORDINATES_BY_NAME = BARANGAY_COORDINATES.byName || new Map();

// Load barangay names from CSV as fallback when JSON is missing
function loadBarangaysFromCSV(csvPath) {
  const barangayMap = new Map(); // city -> Set of barangay names
  
  try {
    if (!csvPath || !fs.existsSync(csvPath)) {
      return barangayMap;
    }

    const raw = fs.readFileSync(csvPath, 'utf8').trim();
    if (!raw) {
      return barangayMap;
    }

    const records = parseCsv(raw);
    
    records.forEach((row) => {
      const cityName = (row.city_muni_psgc || '').trim();
      const barangayName = (row.barangay_name || '').trim();
      
      if (!cityName || !barangayName) {
        return;
      }
      
      // We need to map city codes to city names - for now, we'll use a different approach
      // Store by province + city code pattern
      const provinceCode = (row.province_psgc || '').trim();
      const key = `${provinceCode}|${cityName}`;
      
      if (!barangayMap.has(key)) {
        barangayMap.set(key, new Set());
      }
      barangayMap.get(key).add(barangayName);
    });

    return barangayMap;
  } catch (error) {
    console.warn('⚠️ Unable to load barangays from CSV:', error.message);
    return barangayMap;
  }
}

// Alternative: Load barangays by city name pattern from CSV
function loadBarangaysByCityName(csvPath, targetCityName, targetProvince) {
  const barangays = new Set();
  
  try {
    if (!csvPath || !fs.existsSync(csvPath)) {
      return Array.from(barangays);
    }

    const raw = fs.readFileSync(csvPath, 'utf8').trim();
    if (!raw) {
      return Array.from(barangays);
    }

    const records = parseCsv(raw);
    const normalizedTargetCity = normaliseKey(targetCityName);
    const normalizedTargetProvince = normaliseKey(targetProvince);
    
    // Try to find city code for target city
    let targetCityCode = null;
    let targetProvinceCode = null;
    
    // First pass: find city and province codes
    for (const row of records) {
      const provinceCode = (row.province_psgc || '').trim();
      const cityCode = (row.city_muni_psgc || '').trim();
      const barangayName = (row.barangay_name || '').trim();
      
      // We'll use a heuristic: if we find many barangays with same city code in same province,
      // that's likely our city
      if (barangayName && provinceCode) {
        if (!targetCityCode) {
          // Check if this province matches
          // Since we don't have province names in CSV, we'll collect all unique city codes
          // and use the one with most barangays as our target
        }
      }
    }
    
    // For now, return empty - we'll use a simpler approach
    return Array.from(barangays);
  } catch (error) {
    return Array.from(barangays);
  }
}

// Since CSV doesn't have city names, we'll expand the hardcoded list significantly
const EXPANDED_BATANGAS_CITY_BARANGAYS = [
  'Alangilan', 'Balagtas', 'Barangay 1 (Poblacion)', 'Barangay 2 (Poblacion)', 
  'Barangay 3 (Poblacion)', 'Barangay 4 (Poblacion)', 'Barangay 5 (Poblacion)',
  'Barangay 6 (Poblacion)', 'Barangay 7 (Poblacion)', 'Barangay 8 (Poblacion)',
  'Barangay 9 (Poblacion)', 'Barangay 10 (Poblacion)', 'Barangay 11 (Poblacion)',
  'Barangay 12 (Poblacion)', 'Bolbok', 'Concepcion', 'Concepcion Ibaba',
  'Concepcion Ilaya', 'Cuta', 'Gulod Labac', 'Kumintang Ibaba', 'Kumintang Ilaya',
  'Malitam', 'Pallocan West', 'Pallocan East', 'San Agapito', 'San Isidro',
  'San Jose Sico', 'San Pedro', 'Santa Clara', 'Santa Rita Aplaya',
  'Santo Domingo', 'Sinala', 'Tabangao', 'Tabangao Aplaya', 'Tabangao Ambulong',
  'Talahib Pandayan', 'Talahib Payapa', 'Talahib Payapa Ibaba', 'Talahib Payapa Ilaya',
  'Talahib Payapa Proper', 'Talahib Payapa West', 'Talahib Payapa East',
  'Talahib Payapa North', 'Talahib Payapa South', 'Talahib Payapa Central',
  'Wawa', 'Wawa Ibaba', 'Wawa Ilaya', 'Wawa Proper', 'Wawa East', 'Wawa West'
];

// Philippine names
const firstNames = [
  'Maria', 'Juan', 'Jose', 'Rosa', 'Ramon', 'Ana', 'Carlos', 'Isabel',
  'Miguel', 'Mercedes', 'Luis', 'Patricia', 'Roberto', 'Victoria',
  'Alfonso', 'Stephanie', 'Gabriel', 'Angela', 'Rafael', 'Monica',
  'Fernando', 'Carmen', 'Ricardo', 'Dolores', 'Manuel', 'Teresa',
  'Antonio', 'Gloria', 'Francisco', 'Rita', 'Pedro', 'Concepcion',
  'Enrique', 'Rosario', 'Jorge', 'Esperanza', 'Alberto', 'Amparo'
];

const lastNames = [
  'Santos', 'Cruz', 'dela Cruz', 'Reyes', 'Garcia', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Fernandez', 'Ramirez', 'Torres',
  'Rivera', 'Gomez', 'Diaz', 'Navarro', 'Morales', 'Ruiz', 'Ortiz',
  'Villanueva', 'Castillo', 'Ramos', 'Mendoza', 'Flores', 'Bautista',
  'Aquino', 'Castro', 'Dela Rosa', 'Villanueva', 'Perez', 'Ramos'
];

const teamNames = [
  'Manila Dragons', 'Cavite Warriors', 'Batangas Bulls', 'Lemery Phoenix',
  'Calapan Knights', 'Muzon Tigers', 'Rosario Raptors', 'Pinamalayan Panthers',
  'Bauan Badgers', 'Calaca Crushers', 'Metro Hawks', 'Provincial Pride',
  'Thunder Strikers', 'Phoenix Rising', 'Golden Giants', 'Silver Stallions',
  'Emerald Eagles', 'Diamond Dragons', 'Ruby Rebels', 'Sapphire Stars',
  'Batangas City Titans', 'San Pascual Sharks', 'Calaca Cobras', 'Lemery Lions',
  'Rosario Rhinos', 'Muzon Mustangs', 'Calapan Cougars', 'Bauan Bears'
];

const DEFAULT_BARANGAYS = [
  'Poblacion', 'Barangay 1', 'San Roque', 'San Jose', 'San Antonio',
  'San Miguel', 'San Isidro', 'Dalig', 'Balagtas', 'Santa Cruz',
  'Santa Maria', 'Sampaguita', 'Maligaya', 'Centro'
];

function normaliseKey(value) {
  if (!value) {
    return '';
  }
  return value.toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function buildBarangayLookups(dataset) {
  const cityLookup = new Map();
  const provinceLookup = new Map();
  const cityProvinceLookup = new Map();

  if (!dataset || !Array.isArray(dataset.provinces)) {
    return { cityLookup, provinceLookup, cityProvinceLookup };
  }

  dataset.provinces.forEach((province) => {
    const provinceKey = normaliseKey(province.name);
    if (!provinceLookup.has(provinceKey)) {
      provinceLookup.set(provinceKey, new Map());
    }
    const provinceBucket = provinceLookup.get(provinceKey);

    province.citiesAndMunicipalities
      .filter(Boolean)
      .forEach((localGovernment) => {
        const barangayEntries = (localGovernment.barangays || [])
          .filter(Boolean)
          .map((barangay) => {
            const code = barangay.code || null;
            const centroid = code ? BARANGAY_COORDINATES_BY_CODE.get(barangay.code) : null;
            return {
              code,
              name: barangay.name,
              cityCode: localGovernment.code || null,
              provinceCode: province.code || null,
              regionCode: province.regionCode || null,
              latitude: centroid?.latitude ?? null,
              longitude: centroid?.longitude ?? null
            };
          })
          .filter((entry) => entry.name);

        barangayEntries.forEach((entry) => {
          const key = entry.code || `${entry.name}:${localGovernment.code}`;
          provinceBucket.set(key, entry);
        });

        const namesToIndex = new Set([
          localGovernment.name,
          localGovernment.name.replace(/^City of\s+/i, ''),
          localGovernment.name.replace(/\s+City$/i, ''),
          localGovernment.name.replace(/^Municipality of\s+/i, '')
        ]);

        namesToIndex.forEach((nameVariant) => {
          const key = normaliseKey(nameVariant);
          if (!key) {
            return;
          }

          const combinedKey = `${provinceKey}|${key}`;
          if (!cityProvinceLookup.has(combinedKey)) {
            cityProvinceLookup.set(combinedKey, new Map());
          }
          const combinedBucket = cityProvinceLookup.get(combinedKey);
          const entryPairs = barangayEntries.map((entry) => {
            const entryKey = entry.code || `${entry.name}:${localGovernment.code}`;
            combinedBucket.set(entryKey, entry);
            return [entryKey, entry];
          });

          const existing = cityLookup.get(key);
          if (!existing) {
            cityLookup.set(key, {
              province: province.name,
              region: province.regionName,
              barangays: new Map(entryPairs)
            });
          } else {
            entryPairs.forEach(([entryKey, entry]) => {
              existing.barangays.set(entryKey, entry);
            });
          }
        });
      });
  });

  return {
    cityLookup,
    provinceLookup,
    cityProvinceLookup
  };
}

const {
  cityLookup: BARANGAY_CITY_LOOKUP,
  provinceLookup: BARANGAY_PROVINCE_LOOKUP,
  cityProvinceLookup: BARANGAY_CITY_PROVINCE_LOOKUP
} =
  buildBarangayLookups(barangayDataset);

const CITY_DATA = [
  {
    city: 'Batangas City',
    province: 'Batangas',
    region: 'CALABARZON',
    postalCode: 4200,
    lat: 13.7565,
    lng: 121.0583,
    barangays: [
      'Alangilan',
      'Balagtas',
      'Barangay 1 (Poblacion)',
      'Barangay 2 (Poblacion)',
      'Barangay 3 (Poblacion)',
      'Barangay 4 (Poblacion)',
      'Bolbok',
      'Concepcion',
      'Gulod Labac',
      'Kumintang Ibaba',
      'Kumintang Ilaya',
      'Malitam',
      'Pallocan West',
      'San Agapito',
      'San Isidro'
    ]
  },
  {
    city: 'San Pascual',
    province: 'Batangas',
    region: 'CALABARZON',
    postalCode: 4204,
    lat: 13.8011,
    lng: 121.016,
    barangays: [
      'Antipolo',
      'Banaba',
      'Ilat North',
      'Ilat South',
      'Mabini',
      'Mataas na Lupa',
      'Natunuan North',
      'Natunuan South',
      'Payapa',
      'Poblacion',
      'San Antonio',
      'San Mateo',
      'Santa Cruz',
      'Santo Niño',
      'Tilos'
    ]
  },
  {
    city: 'San Luis',
    province: 'Batangas',
    region: 'CALABARZON',
    postalCode: 4210,
    lat: 13.822,
    lng: 120.918,
    barangays: [
      'Abelo',
      'Aplaya',
      'Bagong Tubig',
      'Balite',
      'Banoyo',
      'Boboy',
      'Bolbok',
      'Calumpang',
      'Calumpit',
      'Cumba',
      'Durungao',
      'Hugom',
      'Mahabang Parang',
      'Muzon',
      'Nagsaulay',
      'San Antonio',
      'San Isidro',
      'San Jose',
      'San Martin',
      'San Miguel',
      'San Nicolas',
      'San Pedro',
      'San Roque',
      'San Vicente',
      'Talaga',
      'Ticalan'
    ]
  },
  {
    city: 'Lemery',
    province: 'Batangas',
    region: 'CALABARZON',
    postalCode: 4209,
    lat: 13.9445,
    lng: 120.9139,
    barangays: [
      'Bagong Sikat',
      'Barangay 1 (Poblacion)',
      'Barangay 2 (Poblacion)',
      'Barangay 3 (Poblacion)',
      'Barangay 4 (Poblacion)',
      'Bucal',
      'Cahilan 1',
      'Cahilan 2',
      'District I (Poblacion)',
      'Maguihan',
      'Mataas na Bayan',
      'Morong',
      'Palanas',
      'Sangalang',
      'Wawa'
    ]
  },
  {
    city: 'Bauan',
    province: 'Batangas',
    region: 'CALABARZON',
    postalCode: 4201,
    lat: 13.7894,
    lng: 121.0084,
    barangays: [
      'Aplaya',
      'Apacay',
      'Bolo',
      'Cupang',
      'Gulibay',
      'Ilihan',
      'Locloc',
      'Manghinao Proper',
      'Manghinao Uno',
      'Poblacion 1',
      'Poblacion 2',
      'Poblacion 3',
      'Poblacion 4',
      'Sampaguita',
      'San Andres Proper'
    ]
  },
  {
    city: 'Calaca',
    province: 'Batangas',
    region: 'CALABARZON',
    postalCode: 4212,
    lat: 13.9324,
    lng: 120.8134,
    barangays: [
      'Baclas',
      'Bagong Pook',
      'Balimbing',
      'Barangay 1 (Poblacion)',
      'Barangay 2 (Poblacion)',
      'Barangay 3 (Poblacion)',
      'Calantas',
      'Camastilisan',
      'Dacanlao',
      'Lumbang Calzada',
      'Lumbang Nazaret',
      'Madalunot',
      'Munting Coral',
      'Pantay',
      'Talisay'
    ]
  },
  {
    city: 'Rosario',
    province: 'Batangas',
    region: 'CALABARZON',
    postalCode: 4225,
    lat: 13.846,
    lng: 121.2058,
    barangays: [
      'Antipolo',
      'Bagong Pook',
      'Balibago',
      'Bayawang',
      'Calantas',
      'Itlugan',
      'Lumbangan',
      'Maalas-as',
      'Malaya',
      'Masaya',
      'Namuco',
      'Poblacion A',
      'Poblacion B',
      'San Carlos',
      'Tiquiwan'
    ]
  },
  {
    city: 'Lipa',
    province: 'Batangas',
    region: 'CALABARZON',
    postalCode: 4217,
    lat: 13.9411,
    lng: 121.1631,
    barangays: [
      'Adya',
      'Anilao Proper',
      'Balintawak',
      'Banaybanay',
      'Bo. Obrero (Poblacion)',
      'Dagatan',
      'Latag',
      'Mataas na Lupa',
      'Sabang',
      'San Carlos',
      'San Celestino',
      'San Jose',
      'San Salvador',
      'Santo Toribio',
      'Barangay 7 (Poblacion)'
    ]
  },
  {
    city: 'Tanauan',
    province: 'Batangas',
    region: 'CALABARZON',
    postalCode: 4232,
    lat: 14.0866,
    lng: 121.1495,
    barangays: [
      'Bagumbayan',
      'Balele',
      'Bilogo',
      'Darasa',
      'Gonzales',
      'Laurel',
      'Poblacion 1',
      'Poblacion 3',
      'Sala',
      'Sampalukan',
      'Sulpoc',
      'Talaga',
      'Tinurik',
      'Ulango',
      'Wawa'
    ]
  },
  {
    city: 'Calapan',
    province: 'Oriental Mindoro',
    region: 'MIMAROPA',
    postalCode: 5200,
    lat: 13.41,
    lng: 121.18,
    barangays: [
      'Bayanan I',
      'Bayanan II',
      'Balite',
      'Balingayan',
      'Baruyan',
      'Calero',
      'Camansihan',
      'Guinobatan',
      'Ibaba East',
      'Ibaba West',
      'Lalud',
      'Lumangbayan',
      'Navotas',
      'Pachoca',
      'San Vicente'
    ]
  },
  {
    city: 'Pinamalayan',
    province: 'Oriental Mindoro',
    region: 'MIMAROPA',
    postalCode: 5208,
    lat: 13.0007,
    lng: 121.4166,
    barangays: [
      'Buli',
      'Cacawan',
      'Guinhawa',
      'Malaya',
      'Maligaya',
      'Maningcol',
      'Marfrancisco',
      'Pacheco',
      'Panggulayan',
      'Poblacion I',
      'Poblacion II',
      'Ranzo',
      'Rosario',
      'Santa Maria',
      'Sto. Niño'
    ]
  },
  {
    city: 'San Jose del Monte City',
    province: 'Bulacan',
    region: 'Central Luzon',
    postalCode: 3023,
    lat: 14.8133,
    lng: 121.0459,
    barangays: [
      'Bagong Buhay I',
      'Bagong Buhay II',
      'Bagong Buhay III',
      'Citrus',
      'Graceville',
      'Minuyan Proper',
      'Muzon',
      'San Manuel',
      'San Martin I',
      'San Martin II',
      'San Martin III',
      'San Martin IV',
      'San Pedro',
      'Santo Cristo',
      'Sapang Palay Proper'
    ]
  },
  {
    city: 'Santa Rosa',
    province: 'Laguna',
    region: 'CALABARZON',
    postalCode: 4026,
    lat: 14.3122,
    lng: 121.1119,
    barangays: ['Balibago', 'Tagapo', 'Malusak', 'Dila', 'Santo Domingo']
  },
  {
    city: 'Calamba',
    province: 'Laguna',
    region: 'CALABARZON',
    postalCode: 4027,
    lat: 14.2117,
    lng: 121.1652,
    barangays: ['Poblacion 1', 'Pansol', 'Looc', 'Canlubang', 'Makiling']
  },
  {
    city: 'Nasugbu',
    province: 'Batangas',
    region: 'CALABARZON',
    postalCode: 4231,
    lat: 14.0676,
    lng: 120.6307,
    barangays: ['Poblacion 2', 'Wawa', 'Looc', 'Biliran', 'Calayaan']
  },
  {
    city: 'Balayan',
    province: 'Batangas',
    region: 'CALABARZON',
    postalCode: 4213,
    lat: 13.9377,
    lng: 120.7321,
    barangays: ['Barangay 1', 'Dacanlao', 'Calzada', 'Magabe', 'Palikpikan']
  },
  {
    city: 'Sto. Tomas',
    province: 'Batangas',
    region: 'CALABARZON',
    postalCode: 4234,
    lat: 14.1086,
    lng: 121.1419,
    barangays: ['Poblacion Barangay 1', 'San Roque', 'Santa Teresita', 'San Pedro', 'San Miguel']
  }
];

const FAR_CITY_DATA = [
  {
    city: 'Quezon City',
    province: 'Metro Manila',
    region: 'NCR',
    postalCode: 1100,
    lat: 14.676,
    lng: 121.0437,
    barangays: ['Project 4', 'Batasan Hills', 'Cubao', 'Talipapa', 'Matandang Balara']
  },
  {
    city: 'Cebu City',
    province: 'Cebu',
    region: 'Central Visayas',
    postalCode: 6000,
    lat: 10.3157,
    lng: 123.8854,
    barangays: ['Lahug', 'Guadalupe', 'Banilad', 'Mabolo', 'Apas']
  },
  {
    city: 'Davao City',
    province: 'Davao del Sur',
    region: 'Davao Region',
    postalCode: 8000,
    lat: 7.1907,
    lng: 125.4553,
    barangays: ['Buhangin', 'Talomo', 'Toril', 'Agdao', 'Baguio']
  },
  {
    city: 'Iloilo City',
    province: 'Iloilo',
    region: 'Western Visayas',
    postalCode: 5000,
    lat: 10.7202,
    lng: 122.5621,
    barangays: ['Jaro', 'La Paz', 'Mandurriao', 'Molo', 'City Proper']
  },
  {
    city: 'Baguio City',
    province: 'Benguet',
    region: 'CAR',
    postalCode: 2600,
    lat: 16.4023,
    lng: 120.596,
    barangays: ['Irisan', 'Loakan', 'Aurora Hill', 'Camp 7', 'Legarda']
  }
];

const CITY_LOOKUP = new Map(CITY_DATA.map(city => [city.city.toUpperCase(), city]));
const FAR_CITY_LOOKUP = new Map(FAR_CITY_DATA.map(city => [city.city.toUpperCase(), city]));

function generateYearlyCustomerTargets() {
  return [
    getRandomInt(703, 840),  // 2022 foundation year
    getRandomInt(1005, 1260), // 2023 growth
    getRandomInt(1408, 1760), // 2024 expansion
    getRandomInt(680, 960)    // 2025 partial year through October
  ];
}

const YEARLY_CUSTOMER_TARGETS = generateYearlyCustomerTargets();
const YEARS_TO_GENERATE = YEARLY_CUSTOMER_TARGETS.length;
const TOTAL_CUSTOMER_TARGET = YEARLY_CUSTOMER_TARGETS.reduce((sum, value) => sum + value, 0);
const CUSTOMER_CREATION_DELAY_MS = 50;
const LOYAL_SHARE = 0.12;
const ENGAGED_SHARE = 0.38;
const BRANCH_PRIORITY_WEIGHTS = {
  'BATANGAS CITY BRANCH': 1.8,
  'SAN PASCUAL (MAIN BRANCH)': 1.6,
  'CALAPAN BRANCH': 1.35,
  'LEMERY BRANCH': 1.3,
  'BAUAN BRANCH': 1.28,
  'CALACA BRANCH': 1.28,
  'PINAMALAYAN BRANCH': 1.25,
  'ROSARIO BRANCH': 1.25,
  'MUZON BRANCH': 1.55,
  'SAN LUIS BRANCH': 1.55
};

const BRANCH_TO_CITY = new Map(
  [
    ['BATANGAS CITY BRANCH', 'BATANGAS CITY'],
    ['BATANGAS CITY', 'BATANGAS CITY'],
    ['SAN PASCUAL (MAIN BRANCH)', 'SAN PASCUAL'],
    ['SAN PASCUAL BRANCH', 'SAN PASCUAL'],
    ['CALAPAN BRANCH', 'CALAPAN'],
    ['LEMERY BRANCH', 'LEMERY'],
    ['BAUAN BRANCH', 'BAUAN'],
    ['CALACA BRANCH', 'CALACA'],
    ['PINAMALAYAN BRANCH', 'PINAMALAYAN'],
    ['ROSARIO BRANCH', 'ROSARIO'],
    ['MUZON BRANCH', 'SAN LUIS'],
    ['SAN LUIS BRANCH', 'SAN LUIS']
  ].map(([branch, city]) => [branch.toUpperCase(), city.toUpperCase()])
);

const BRANCH_FOCUS_BARANGAYS = new Map(
  [
    ['MUZON BRANCH', ['Muzon', 'San Antonio', 'San Jose', 'San Nicolas', 'Calumpit']],
    ['SAN LUIS BRANCH', ['Muzon', 'San Antonio', 'San Martin', 'San Roque']]
  ].map(([branch, barangays]) => [normaliseKey(branch), barangays])
);

// Nearby cities for each branch (within Calabarzon and Mindoro)
const BRANCH_NEARBY_CITIES = new Map(
  [
    ['BATANGAS CITY BRANCH', ['Lipa', 'Tanauan', 'Sto. Tomas', 'Bauan', 'San Pascual', 'Nasugbu', 'Balayan']],
    ['SAN PASCUAL (MAIN BRANCH)', ['Batangas City', 'Bauan', 'Lipa', 'Tanauan', 'Sto. Tomas', 'Calaca']],
    ['CALAPAN BRANCH', ['Pinamalayan', 'Naujan', 'Victoria', 'Baco', 'Socorro']],
    ['LEMERY BRANCH', ['Calaca', 'Bauan', 'Taal', 'Agoncillo', 'San Nicolas']],
    ['BAUAN BRANCH', ['Batangas City', 'San Pascual', 'Lemery', 'Calaca', 'Lipa']],
    ['CALACA BRANCH', ['Lemery', 'Bauan', 'Balayan', 'Nasugbu', 'Calatagan']],
    ['PINAMALAYAN BRANCH', ['Calapan', 'Naujan', 'Victoria', 'Bansud', 'Gloria']],
    ['ROSARIO BRANCH', ['Lipa', 'Tanauan', 'Sto. Tomas', 'Alaminos', 'Tiaong']],
    ['MUZON BRANCH', ['San Luis', 'Bauan', 'Batangas City', 'San Pascual']],
    ['SAN LUIS BRANCH', ['Muzon', 'Bauan', 'Batangas City', 'San Pascual', 'Calaca']]
  ].map(([branch, cities]) => [normaliseKey(branch), cities])
);

// Track customer distribution for better scattering
const CUSTOMER_LOCATION_TRACKER = {
  branchCityCounts: new Map(), // branch -> count
  barangayCounts: new Map(), // "city|barangay" -> count
  cityCounts: new Map(), // city -> count
  usedBarangays: new Set(), // "city|barangay" for tracking
  provinceBarangayCounts: new Map(), // "province|barangay" -> count (for province-wide distribution)
  allBatangasBarangays: [], // All barangays in Batangas Province loaded from CSV
  batangasCityCodeToName: new Map(), // Map city code to city name for Batangas Province
  allOrientalMindoroBarangays: [], // All barangays in Oriental Mindoro Province loaded from CSV
  orientalMindoroCityCodeToName: new Map() // Map city code to city name for Oriental Mindoro Province
};

// Load city data from shapefile
async function loadCityShapefile(shpPath) {
  const cityMap = new Map(); // cityCode -> { name, geometry, ... }
  
  try {
    if (!shpPath || !fs.existsSync(shpPath)) {
      console.warn('⚠️ Shapefile not found:', shpPath);
      return cityMap;
    }

    const source = await shapefile.open(shpPath);
    let count = 0;
    
    while (true) {
      const result = await source.read();
      if (result.done) break;
      
      const feature = result.value;
      if (feature && feature.properties) {
        const props = feature.properties;
        
        // Debug: log first feature's properties to see what attributes are available
        if (count === 0) {
          console.log('🔍 Sample shapefile properties:', Object.keys(props));
          console.log('🔍 Sample property values:', Object.entries(props).slice(0, 10).map(([k, v]) => `${k}: ${v}`).join(', '));
        }
        
        // Shapefile uses: adm3_psgc (city code), adm3_en (city name), adm2_psgc (province code)
        const cityCode = (props.adm3_psgc || props.ADM3_PCODE || props.PSGC || '').toString().trim();
        const cityName = (props.adm3_en || props.NAME || props.NAME_2 || '').toString().trim();
        const provinceCode = (props.adm2_psgc || props.ADM2_PCODE || '').toString().trim();
        
        if (cityCode && cityName && feature.geometry) {
          cityMap.set(cityCode, {
            name: cityName,
            provinceCode: provinceCode,
            geometry: feature.geometry,
            properties: props
          });
          count++;
        } else if (count === 0) {
          // Debug first failure
          console.log('⚠️ First feature skipped - cityCode:', cityCode, 'cityName:', cityName, 'hasGeometry:', !!feature.geometry);
        }
      }
    }

    console.log(`✅ Loaded ${count} cities from shapefile`);
    return cityMap;
  } catch (error) {
    console.warn('⚠️ Unable to load shapefile:', error.message);
    return cityMap;
  }
}

// Point-in-polygon test for GeoJSON geometry
function pointInPolygon(point, geometry) {
  const [lng, lat] = point;
  
  if (geometry.type === 'Polygon') {
    return pointInPolygonCoordinates([lng, lat], geometry.coordinates);
  } else if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some(polygon => 
      pointInPolygonCoordinates([lng, lat], polygon)
    );
  }
  return false;
}

function pointInPolygonCoordinates(point, coordinates) {
  const [lng, lat] = point;
  let inside = false;
  
  for (const ring of coordinates) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      
      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
  }
  
  return inside;
}

// Load all province barangays from CSV for wide distribution
// Also create a mapping from city code to city name using shapefile
async function loadProvinceBarangays(csvPath, provinceCode, provinceName, cityShapefileMap, shapefileProvinceCode) {
  const barangays = [];
  const cityCodeToName = new Map(); // Map city code to city name
  
  try {
    if (!csvPath || !fs.existsSync(csvPath)) {
      return { barangays, cityCodeToName };
    }

    const raw = fs.readFileSync(csvPath, 'utf8').trim();
    if (!raw) {
      return { barangays, cityCodeToName };
    }

    const records = parseCsv(raw);
    
    // Pre-filter cities from shapefile by province for faster lookup
    // Use the shapefile province code format (e.g., 401000000 for Batangas, 1705200000 for Oriental Mindoro)
    const provinceCities = new Map();
    let sampleProvinceCode = null;
    
    for (const [code, cityData] of cityShapefileMap.entries()) {
      if (cityData.provinceCode) {
        if (!sampleProvinceCode) {
          sampleProvinceCode = cityData.provinceCode;
        }
        // Match by exact province code or normalized codes
        const normalizedShpProvinceCode = cityData.provinceCode.replace(/^0+/, '') || cityData.provinceCode;
        const normalizedTargetCode = shapefileProvinceCode.replace(/^0+/, '') || shapefileProvinceCode;
        
        if (cityData.provinceCode === shapefileProvinceCode || normalizedShpProvinceCode === normalizedTargetCode) {
          provinceCities.set(code, cityData);
        }
      }
    }
    
    if (sampleProvinceCode && provinceCities.size === 0) {
      console.log(`   ⚠️ No cities found for province code ${shapefileProvinceCode}, sample shapefile province code: ${sampleProvinceCode}`);
      console.log(`   🔍 Trying to match by province name: ${provinceName}`);
      // Try matching by province name instead (fallback)
      for (const [code, cityData] of cityShapefileMap.entries()) {
        // Check if any property contains the province name
        const props = cityData.properties || {};
        const allProps = Object.values(props).map(v => (v || '').toString().toLowerCase());
        if (allProps.some(v => v.includes(provinceName.toLowerCase()))) {
          provinceCities.set(code, cityData);
        }
      }
    }
    
    console.log(`   🔍 Filtered ${provinceCities.size} cities from shapefile for ${provinceName}`);
    
    let directMatches = 0;
    let polygonMatches = 0;
    
    records.forEach((row) => {
      const rowProvinceCode = (row.province_psgc || '').trim();
      const barangayName = (row.barangay_name || '').trim();
      const cityCode = (row.city_muni_psgc || '').trim();
      const latitude = Number(row.latitude);
      const longitude = Number(row.longitude);
      
      // Only include barangays from the specified province
      if (rowProvinceCode === provinceCode && barangayName && 
          !Number.isNaN(latitude) && !Number.isNaN(longitude)) {
        barangays.push({
          name: barangayName,
          cityCode: cityCode,
          latitude: latitude,
          longitude: longitude,
          provinceCode: rowProvinceCode
        });
        
        // Try to find city name from shapefile using point-in-polygon
        if (provinceCities.size > 0 && !cityCodeToName.has(cityCode)) {
          const point = [longitude, latitude]; // GeoJSON format: [lng, lat]
          
          // First try direct city code match (normalize codes by removing leading zeros for comparison)
          const normalizedCityCode = cityCode.replace(/^0+/, '') || cityCode;
          let foundMatch = false;
          
          // Debug first few attempts
          if (directMatches + polygonMatches < 3) {
            console.log(`   🔍 Sample: CSV cityCode=${cityCode}, normalized=${normalizedCityCode}`);
            const sampleShpCodes = Array.from(provinceCities.keys()).slice(0, 3);
            console.log(`   🔍 Sample shapefile codes: ${sampleShpCodes.join(', ')}`);
          }
          
          for (const [shpCode, cityData] of provinceCities.entries()) {
            const normalizedShpCode = shpCode.replace(/^0+/, '') || shpCode;
            
            // Try direct code match (with normalization)
            // CSV format: 000401005, shapefile format: 401005000 (last 3 digits might be different)
            // Try matching first 6 digits or full normalized match
            const csvPrefix = normalizedCityCode.substring(0, 6);
            const shpPrefix = normalizedShpCode.substring(0, 6);
            
            if (normalizedCityCode === normalizedShpCode || cityCode === shpCode || csvPrefix === shpPrefix) {
              cityCodeToName.set(cityCode, cityData.name);
              foundMatch = true;
              directMatches++;
              if (directMatches <= 3) {
                console.log(`   ✅ Direct match: ${cityCode} -> ${cityData.name} (shapefile code: ${shpCode})`);
              }
              break;
            }
          }
          
          // If no direct match, try point-in-polygon (only check province cities)
          if (!foundMatch) {
            for (const [shpCode, cityData] of provinceCities.entries()) {
              if (pointInPolygon(point, cityData.geometry)) {
                cityCodeToName.set(cityCode, cityData.name);
                foundMatch = true;
                polygonMatches++;
                if (polygonMatches <= 3) {
                  console.log(`   ✅ Polygon match: ${cityCode} -> ${cityData.name} (shapefile code: ${shpCode})`);
                }
                break; // Found the city, no need to check others
              }
            }
          }
        }
      }
    });

    // Build city code to name mapping by matching with CITY_DATA
    // Group barangays by city code and try to match with known cities
    const cityCodeGroups = new Map();
    barangays.forEach(b => {
      if (!cityCodeGroups.has(b.cityCode)) {
        cityCodeGroups.set(b.cityCode, []);
      }
      cityCodeGroups.get(b.cityCode).push(b);
    });
    
    // Try to match city codes with CITY_DATA cities
    // Use a more comprehensive matching strategy
    CITY_DATA.forEach(city => {
      if (city.province === provinceName) {
        let bestMatch = null;
        let bestMatchScore = 0;
        
        // Find city code by matching barangay names
        for (const [code, cityBarangays] of cityCodeGroups.entries()) {
          const matchingBarangays = cityBarangays.filter(b => 
            city.barangays.some(cb => normaliseKey(cb) === normaliseKey(b.name))
          );
          // Calculate match score: higher if more matches or higher percentage
          const matchScore = matchingBarangays.length * 2 + (matchingBarangays.length / cityBarangays.length) * 100;
          if (matchScore > bestMatchScore && (matchingBarangays.length >= 2 || matchingBarangays.length >= cityBarangays.length * 0.2)) {
            bestMatch = code;
            bestMatchScore = matchScore;
          }
        }
        
        if (bestMatch) {
          cityCodeToName.set(bestMatch, city.city);
        }
      }
    });
    
    // Also try to match by checking if any barangay name contains the city name
    // This helps catch cities that might not be in CITY_DATA but have recognizable names
    CITY_DATA.forEach(city => {
      if (city.province === provinceName && !Array.from(cityCodeToName.values()).includes(city.city)) {
        const normalizedCityName = normaliseKey(city.city);
        for (const [code, cityBarangays] of cityCodeGroups.entries()) {
          if (cityCodeToName.has(code)) continue; // Already mapped
          
          // Check if any barangay name contains the city name
          const hasCityNameInBarangay = cityBarangays.some(b => 
            normaliseKey(b.name).includes(normalizedCityName) || 
            normalizedCityName.includes(normaliseKey(b.name))
          );
          
          if (hasCityNameInBarangay && cityBarangays.length >= 5) {
            cityCodeToName.set(code, city.city);
            break;
          }
        }
      }
    });

    console.log(`✅ Loaded ${barangays.length} barangays from ${provinceName} for wide distribution`);
    console.log(`✅ Mapped ${cityCodeToName.size} city codes to city names (${directMatches} direct matches, ${polygonMatches} polygon matches)`);
    return { barangays, cityCodeToName };
  } catch (error) {
    console.warn(`⚠️ Unable to load ${provinceName} barangays:`, error.message);
    return { barangays: [], cityCodeToName: new Map() };
  }
}

// Load province CSV to build province code mapping
function loadProvinceMapping(csvPath) {
  const provinceMap = new Map(); // province name -> { csvCode, shapefileCode, name }
  
  try {
    if (!csvPath || !fs.existsSync(csvPath)) {
      console.warn('⚠️ Province CSV not found:', csvPath);
      return provinceMap;
    }

    const raw = fs.readFileSync(csvPath, 'utf8').trim();
    if (!raw) {
      return provinceMap;
    }

    const records = parseCsv(raw);
    
    records.forEach((row) => {
      const shapefileCode = (row.adm2_psgc || '').trim();
      const provinceName = (row.adm2_en || '').trim();
      
      if (shapefileCode && provinceName) {
        // Normalize the code (remove leading zeros) for matching
        const normalizedCode = shapefileCode.replace(/^0+/, '') || shapefileCode;
        provinceMap.set(provinceName.toLowerCase(), {
          name: provinceName,
          shapefileCode: shapefileCode,
          normalizedCode: normalizedCode
        });
      }
    });

    console.log(`✅ Loaded ${provinceMap.size} provinces from CSV`);
    return provinceMap;
  } catch (error) {
    console.warn('⚠️ Unable to load province CSV:', error.message);
    return provinceMap;
  }
}

// Load city shapefile
const shapefilePath = path.join(__dirname, 'data', 'PH_Adm3_MuniCities.shp.shp');
const provinceCsvPath = path.join(__dirname, 'data', 'PH_Adm2_ProvDists.csv');
let cityShapefileMap = new Map();
let provinceMapping = new Map();

// Initialize province barangays (will be loaded asynchronously in generateAndInsertData)
let batangasDataPromise = null;
let mindoroDataPromise = null;

const CUSTOMER_JERSEY_DESIGNS = new Map();
const GLOBAL_JERSEY_DESIGNS = new Set();
let syntheticProductCounter = 0;
const COVID_RECOVERY_END = new Date(2022, 6, 1);

// Product categories and prices
const productCategories = {
  sublimation: {
    basketball: { kids: 850, adult: 1050, upper_kids: 450, upper_adult: 650 },
    volleyball: { kids: 850, adult: 1050, upper_kids: 450, upper_adult: 650 }
  },
  hoodie: { kids: 700, adult: 900 },
  sports_materials: {
    ball: { basketball: 450, volleyball: 380, football: 420 },
    medal: { gold: 150, silver: 120, bronze: 100 },
    trophy: { small: 800, medium: 1200, large: 1800 }
  }
};

const sizes = {
  kids: ['S6', 'S8', 'S10', 'S12', 'S14'],
  adult: ['S', 'M', 'L', 'XL', 'XXL']
};

const CATEGORY_MAP = {
  'jerseys': 'jerseys',
  'hoodies': 'hoodies',
  'uniforms': 'uniforms',
  't-shirts': 'tshirts',
  'tshirts': 'tshirts',
  'long sleeves': 'longsleeves',
  'long sleeve': 'longsleeves',
  'balls': 'balls',
  'trophies': 'trophies'
};

const APPAREL_CATEGORY_KEYS = ['jerseys', 'hoodies', 'uniforms', 'tshirts', 'longsleeves'];

const BALL_BRANDS = ['Molten', 'Spalding', 'Wilson', "Yohann's", 'Mikasa', 'Meteor'];
const BALL_MATERIALS = ['Composite Leather', 'Synthetic Leather', 'Rubber', 'Microfiber', 'PU Leather'];
const BALL_SIZES = ['4', '5', '6', '7'];

const TROPHY_TYPES = ['Championship', 'MVP', 'Best Setter', 'Best Spiker', 'Champion', 'Runner-Up', 'Top Scorer'];
const TROPHY_SIZES = ['Small', 'Medium', 'Large'];
const TROPHY_MATERIALS = ['Acrylic', 'Wood', 'Metal', 'Crystal'];
const TROPHY_OCCASIONS = ['Intramurals', 'Regional Cup', 'Corporate League', 'Friendly Match', 'All-Star Tournament'];

let PRODUCT_CATALOG = null;

function createEmptyCatalog() {
  return {
    jerseys: [],
    hoodies: [],
    uniforms: [],
    tshirts: [],
    longsleeves: [],
    balls: [],
    trophies: [],
    others: [],
    apparel: [],
    all: []
  };
}

async function loadProductCatalog() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id,name,category,price,main_image,jersey_prices');

    if (error) {
      console.warn('⚠️ Unable to load products from Supabase:', error.message);
      return createEmptyCatalog();
    }

    const catalog = createEmptyCatalog();
    (data || []).forEach((product) => {
      if (!product) {
        return;
      }

      const categoryKey = CATEGORY_MAP[(product.category || '').trim().toLowerCase()] || 'others';
      if (!catalog[categoryKey]) {
        catalog[categoryKey] = [];
      }

      catalog[categoryKey].push(product);
      catalog.all.push(product);
    });

    catalog.apparel = APPAREL_CATEGORY_KEYS
      .flatMap((key) => catalog[key] || [])
      .filter(Boolean);

    return catalog;
  } catch (error) {
    console.warn('⚠️ Failed to load product catalog:', error.message);
    return createEmptyCatalog();
  }
}

function ensureProductCatalog() {
  if (!PRODUCT_CATALOG) {
    throw new Error('Product catalog not loaded');
  }
}

function pickProductFromCatalog(primaryKeys, fallbackKeys = []) {
  ensureProductCatalog();

  const keys = Array.isArray(primaryKeys) ? primaryKeys : [primaryKeys];
  for (const key of keys) {
    const list = PRODUCT_CATALOG[key];
    if (list && list.length > 0) {
      return getRandomElement(list);
    }
  }

  const fallbackList = Array.isArray(fallbackKeys) ? fallbackKeys : [fallbackKeys];
  for (const key of fallbackList) {
    const list = PRODUCT_CATALOG[key];
    if (list && list.length > 0) {
      return getRandomElement(list);
    }
  }

  if (keys.some((key) => APPAREL_CATEGORY_KEYS.includes(key)) && PRODUCT_CATALOG.apparel.length > 0) {
    return getRandomElement(PRODUCT_CATALOG.apparel);
  }

  if (PRODUCT_CATALOG.all.length > 0) {
    return getRandomElement(PRODUCT_CATALOG.all);
  }

  return null;
}

function parsePrice(value, fallback = 0) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric;
  }
  return fallback;
}

function generateAlphaNumericToken(length = 5) {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function createSyntheticProduct(category, options = {}) {
  syntheticProductCounter += 1;
  const token = generateAlphaNumericToken(4);
  const baseId = `SYN-${category.toUpperCase()}-${syntheticProductCounter}-${token}`;
  const teamLabel = (options.teamName || 'Elite Squad').toString().trim();

  switch (category) {
    case 'jersey': {
      const sport = options.sportType || 'Sports';
      const fullSetPrice = options.fullSetPrice || getRandomInt(1180, 1420);
      const shirtOnlyPrice = options.shirtOnlyPrice || Math.max(680, Math.round(fullSetPrice * 0.68));
      const shortsOnlyPrice = options.shortsOnlyPrice || Math.max(520, Math.round(fullSetPrice * 0.48));
      return {
        id: baseId,
        name: `Custom ${sport} Jersey - ${teamLabel} ${token}`,
        category: 'jerseys',
        price: fullSetPrice,
        jersey_prices: {
          fullSet: fullSetPrice,
          shirtOnly: shirtOnlyPrice,
          shortsOnly: shortsOnlyPrice
        },
        main_image: null
      };
    }
    case 'hoodies':
    case 'uniforms':
    case 'tshirts':
    case 'longsleeves': {
      const price = options.basePrice || getRandomInt(780, 1220);
      const label = category.replace(/s$/, '');
      return {
        id: baseId,
        name: `${teamLabel} ${label.charAt(0).toUpperCase()}${label.slice(1)} Set ${token}`,
        category,
        price,
        main_image: null
      };
    }
    case 'ball': {
      const ballType = options.ballType || 'basketball';
      const price = options.basePrice || getRandomInt(1650, 2250);
      return {
        id: baseId,
        name: `${ballType.charAt(0).toUpperCase()}${ballType.slice(1)} Velocity Ball ${token}`,
        category: 'Balls',
        price,
        main_image: null
      };
    }
    case 'trophy': {
      const size = options.size || getRandomElement(['Small', 'Medium', 'Large']);
      const price = options.basePrice || getRandomInt(820, 1450);
      return {
        id: baseId,
        name: `${size} Victory Trophy ${token}`,
        category: 'Trophies',
        price,
        main_image: null
      };
    }
    case 'medal': {
      const medalType = options.medalType || getRandomElement(['Gold', 'Silver', 'Bronze']);
      const price = options.basePrice || getRandomInt(95, 190);
      return {
        id: baseId,
        name: `${medalType} Achievement Medal ${token}`,
        category: 'Medals',
        price,
        main_image: null
      };
    }
    default: {
      const price = options.basePrice || getRandomInt(650, 1100);
      return {
        id: baseId,
        name: `${teamLabel} Custom Gear ${token}`,
        category: category || 'apparel',
        price,
        main_image: null
      };
    }
  }
}

function buildTeamMembers(teamName, teamSize, sizeType, variantKey = 'fullSet') {
  const normalisedSizeType = sizeType === 'kids' ? 'kids' : 'adult';
  const sizePool = normalisedSizeType === 'kids' ? sizes.kids : sizes.adult;
  const normalisedVariant = typeof variantKey === 'string' && variantKey.length > 0
    ? variantKey
    : 'fullSet';
  const members = [];

  for (let i = 0; i < teamSize; i += 1) {
    const firstName = getRandomElement(firstNames);
    const surname = getRandomElement(lastNames);
    const jerseySize = normalisedVariant === 'shortsOnly' ? null : getRandomElement(sizePool);
    let shortsSize = null;

    if (normalisedVariant === 'shirtOnly') {
      shortsSize = null;
    } else if (normalisedVariant === 'fullSet') {
      shortsSize = jerseySize;
    } else {
      shortsSize = getRandomElement(sizePool);
    }
    const jerseyNumber = getRandomInt(1, 99);
    let baseSize = null;

    if (normalisedVariant === 'fullSet') {
      baseSize = jerseySize || getRandomElement(sizePool);
    } else if (normalisedVariant === 'shirtOnly') {
      baseSize = jerseySize;
    } else if (normalisedVariant === 'shortsOnly') {
      baseSize = null;
    }

    const member = {
      teamName,
      team_name: teamName,
      firstName,
      surname,
      number: jerseyNumber,
      jerseyNo: jerseyNumber,
      jerseyNumber,
      sizingType: normalisedSizeType,
      size: baseSize
    };

    if (jerseySize !== null) {
      member.jerseySize = jerseySize;
    } else {
      member.jerseySize = null;
    }

    if (shortsSize !== null) {
      member.shortsSize = shortsSize;
    } else {
      member.shortsSize = null;
    }

    members.push(member);
  }

  return members;
}

function buildSingleOrderDetails(teamName, sizeType, variantKey = 'fullSet') {
  const normalisedSizeType = sizeType === 'kids' ? 'kids' : 'adult';
  const sizePool = normalisedSizeType === 'kids' ? sizes.kids : sizes.adult;
  const normalisedVariant = typeof variantKey === 'string' && variantKey.length > 0
    ? variantKey
    : 'fullSet';
  const surname = getRandomElement(lastNames);
  const jerseySize = normalisedVariant === 'shortsOnly' ? null : getRandomElement(sizePool);
  let shortsSize = null;

  if (normalisedVariant === 'shirtOnly') {
    shortsSize = null;
  } else if (normalisedVariant === 'shortsOnly') {
    shortsSize = getRandomElement(sizePool);
  } else {
    shortsSize = jerseySize;
  }
  const jerseyNumber = getRandomInt(1, 99);
  let baseSize = null;

  if (normalisedVariant === 'shirtOnly') {
    baseSize = jerseySize;
  } else if (normalisedVariant === 'shortsOnly') {
    baseSize = null;
  } else {
    baseSize = jerseySize || getRandomElement(sizePool);
  }

  const details = {
    teamName,
    surname,
    number: jerseyNumber,
    jerseyNo: jerseyNumber,
    jerseyNumber,
    sizingType: normalisedSizeType,
    size: baseSize
  };

  if (jerseySize !== null) {
    details.jerseySize = jerseySize;
  } else {
    details.jerseySize = null;
  }

  if (shortsSize !== null) {
    details.shortsSize = shortsSize;
  } else {
    details.shortsSize = null;
  }

  return details;
}

function buildBallDetails(productName = '') {
  const lowerName = productName.toLowerCase();
  let sportType = 'Basketball';
  if (lowerName.includes('volley')) {
    sportType = 'Volleyball';
  } else if (lowerName.includes('foot')) {
    sportType = 'Football';
  }

  const brandCandidate = productName.split(' ').find((part) => /^[a-z0-9]/i.test(part));
  const brand = brandCandidate ? brandCandidate.replace(/[^a-z0-9]/gi, '') : getRandomElement(BALL_BRANDS);

  return {
    sportType,
    brand,
    ballSize: getRandomElement(BALL_SIZES),
    material: getRandomElement(BALL_MATERIALS)
  };
}

function buildTrophyDetails(productName = '', teamName = '') {
  const trophyType = TROPHY_TYPES.find((type) => productName.toLowerCase().includes(type.toLowerCase())) || getRandomElement(TROPHY_TYPES);
  const engravingName = teamName || productName.split(' ')[0] || 'Champion';
  return {
    trophyType,
    size: getRandomElement(TROPHY_SIZES),
    material: getRandomElement(TROPHY_MATERIALS),
    engravingText: `Congratulations ${engravingName}!`,
    occasion: getRandomElement(TROPHY_OCCASIONS)
  };
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePlayerName() {
  return `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;
}

function generatePhoneNumber() {
  const prefixes = ['0917', '0927', '0937', '0947', '0957', '0967', '0977', '0987', '0997'];
  return `${getRandomElement(prefixes)}${getRandomInt(1000000, 9999999)}`;
}

function assignUniqueJerseyDesigns(orderItems, userId, orderDate) {
  if (!Array.isArray(orderItems) || !userId) {
    return orderItems;
  }

  const existingDesigns = CUSTOMER_JERSEY_DESIGNS.get(userId) || new Set();
  const yearSegment = orderDate instanceof Date ? orderDate.getFullYear() : null;

  const updatedItems = orderItems.map((item) => {
    if (!item) {
      return item;
    }

    const productType = (item.product_type || '').toString().toLowerCase();
    const categoryType = (item.category || '').toString().toLowerCase();
    const isJerseyProduct = productType.includes('jersey')
      || productType.includes('sublimation')
      || categoryType.includes('jersey')
      || categoryType.includes('sublimation');

    if (!isJerseyProduct) {
      return item;
    }

    const baseTeamName =
      item.teamName
      || item.team_name
      || item.singleOrderDetails?.teamName
      || item.single_order_details?.teamName
      || 'Custom';

    let designName;
    let attempts = 0;

    do {
      const token = generateAlphaNumericToken(4 + (attempts % 2));
      const yearPart = yearSegment ? `${yearSegment}` : '';
      const baseLabel = `${baseTeamName} ${yearPart}`.trim();
      designName = baseLabel ? `${baseLabel} ${token}` : `Custom Design ${token}`;
      attempts += 1;
    } while ((existingDesigns.has(designName) || GLOBAL_JERSEY_DESIGNS.has(designName)) && attempts < 6);

    while (existingDesigns.has(designName) || GLOBAL_JERSEY_DESIGNS.has(designName)) {
      designName = `${designName}-${generateAlphaNumericToken(2)}`;
    }

    existingDesigns.add(designName);
    GLOBAL_JERSEY_DESIGNS.add(designName);

    const updated = { ...item };
    updated.jerseyDesignName = designName;
    updated.design_name = designName;
    updated.name = `Custom ${(updated.sport || 'Team')} Jersey - ${designName}`;
    return updated;
  });

  CUSTOMER_JERSEY_DESIGNS.set(userId, existingDesigns);
  return updatedItems;
}

function getBarangaysForLocation(cityName, provinceName) {
  const cityKey = normaliseKey(cityName);
  const provinceKey = normaliseKey(provinceName);

  if (cityKey && provinceKey) {
    const combinedKey = `${provinceKey}|${cityKey}`;
    if (BARANGAY_CITY_PROVINCE_LOOKUP.has(combinedKey)) {
      const entries = Array.from(BARANGAY_CITY_PROVINCE_LOOKUP.get(combinedKey).values());
      if (entries.length > 0) {
        return entries;
      }
    }
  }

  if (cityKey && BARANGAY_CITY_LOOKUP.has(cityKey)) {
    const entries = Array.from(BARANGAY_CITY_LOOKUP.get(cityKey).barangays.values());
    if (provinceKey) {
      const filtered = entries.filter((entry) => {
        if (!entry?.provinceCode) {
          return true;
        }
        const provinceBucket = BARANGAY_PROVINCE_LOOKUP.get(provinceKey);
        if (!provinceBucket) {
          return true;
        }
        const entryKey = entry.code || `${entry.name}:${entry.cityCode || ''}`;
        return provinceBucket.has(entryKey);
      });
      if (filtered.length > 0) {
        return filtered;
      }
    }
    return entries;
  }

  if (provinceKey && BARANGAY_PROVINCE_LOOKUP.has(provinceKey)) {
    return Array.from(BARANGAY_PROVINCE_LOOKUP.get(provinceKey).values());
  }

  return null;
}

function toBarangayObject(entry, fallback = {}) {
  if (!entry) {
    return {
      code: null,
      name: 'Poblacion',
      cityCode: fallback.cityCode || null,
      provinceCode: fallback.provinceCode || null,
      regionCode: fallback.regionCode || null,
      latitude: null,
      longitude: null
    };
  }

  if (typeof entry === 'string') {
    return {
      code: null,
      name: entry,
      cityCode: fallback.cityCode || null,
      provinceCode: fallback.provinceCode || null,
      regionCode: fallback.regionCode || null,
      latitude: null,
      longitude: null
    };
  }

  return {
    code: entry.code || null,
    name: entry.name || entry.barangay_name || 'Poblacion',
    cityCode: entry.cityCode || entry.city_muni_psgc || fallback.cityCode || null,
    provinceCode: entry.provinceCode || fallback.provinceCode || null,
    regionCode: entry.regionCode || fallback.regionCode || null,
    latitude: entry.latitude ?? null,
    longitude: entry.longitude ?? null
  };
}

function generateAddress(branchName) {
  const cityData = selectCityForBranch(branchName);
  const enrichedBarangays = getBarangaysForLocation(cityData.city, cityData.province);
  
  // Use expanded list for Batangas City if dataset is missing
  let fallbackBarangays = cityData.barangays && cityData.barangays.length
    ? cityData.barangays
    : DEFAULT_BARANGAYS;
  
  // Expand Batangas City barangays significantly if dataset is missing
  if (cityData.city.toUpperCase() === 'BATANGAS CITY' && (!enrichedBarangays || enrichedBarangays.length === 0)) {
    fallbackBarangays = EXPANDED_BATANGAS_CITY_BARANGAYS;
  }
  
  const fallbackBarangaysObjects = fallbackBarangays.map((entry) => toBarangayObject(entry, {
    provinceCode: null,
    cityCode: null,
    regionCode: null
  }));

  const resolvedBarangays = Array.isArray(enrichedBarangays) && enrichedBarangays.length
    ? enrichedBarangays.map((entry) => toBarangayObject(entry, {
      provinceCode: entry?.provinceCode || null,
      cityCode: entry?.cityCode || null,
      regionCode: entry?.regionCode || null
    }))
    : fallbackBarangaysObjects;

  // Check if this is a branch city
  const upperBranch = (branchName || '').toUpperCase();
  const branchCityName = BRANCH_TO_CITY.get(upperBranch);
  const isBranchCity = branchCityName && branchCityName.toUpperCase() === cityData.city.toUpperCase();
  const isBatangasCity = cityData.city.toUpperCase() === 'BATANGAS CITY';

  const focusBarangays = BRANCH_FOCUS_BARANGAYS.get(normaliseKey(branchName)) || null;
  let selectionPool = resolvedBarangays;
  let selectedBarangay = null;

  // Strategy for better distribution
  // Special handling for Batangas and Oriental Mindoro Provinces: spread across ALL barangays in the province
  if (cityData.province === 'Batangas' || cityData.province === 'Oriental Mindoro') {
    // For Batangas/Oriental Mindoro Province: prioritize unused barangays across the ENTIRE province
    const provinceBarangayKey = (barangayName) => `${cityData.province}|${barangayName}`;
    const cityBarangayKey = (barangay) => `${cityData.city}|${barangay.name}`;
    
    // Get all province barangays from CSV if available
    const allProvinceBarangaysList = cityData.province === 'Batangas' 
      ? CUSTOMER_LOCATION_TRACKER.allBatangasBarangays || []
      : CUSTOMER_LOCATION_TRACKER.allOrientalMindoroBarangays || [];
    
    // Convert CSV barangays to barangay objects for selection
    // IMPORTANT: Preserve the cityCode from CSV so we can map it correctly
    const allProvinceBarangays = allProvinceBarangaysList.map(b => {
      const barangayObj = toBarangayObject({
        name: b.name,
        cityCode: b.cityCode,
        latitude: b.latitude,
        longitude: b.longitude
      }, {
        provinceCode: cityData.province === 'Batangas' ? '041000000' : '175200000',
        cityCode: b.cityCode
      });
      // Ensure cityCode is preserved
      if (b.cityCode && !barangayObj.cityCode) {
        barangayObj.cityCode = b.cityCode;
      }
      return barangayObj;
    });
    
    // Combine resolved barangays (from current city) with all province barangays
    // Use a Set to avoid duplicates based on normalized name
    const allBarangaysMap = new Map();
    resolvedBarangays.forEach(b => {
      const key = normaliseKey(b.name);
      if (!allBarangaysMap.has(key)) {
        allBarangaysMap.set(key, b);
      }
    });
    allProvinceBarangays.forEach(b => {
      const key = normaliseKey(b.name);
      if (!allBarangaysMap.has(key)) {
        allBarangaysMap.set(key, b);
      }
    });
    const combinedBarangays = Array.from(allBarangaysMap.values());
    
    // Get all barangays with their usage counts (province-wide)
    const barangaysWithCounts = combinedBarangays.map(b => ({
      barangay: b,
      cityKey: cityBarangayKey(b),
      provinceKey: provinceBarangayKey(b.name),
      cityCount: CUSTOMER_LOCATION_TRACKER.barangayCounts.get(cityBarangayKey(b)) || 0,
      provinceCount: CUSTOMER_LOCATION_TRACKER.provinceBarangayCounts.get(provinceBarangayKey(b.name)) || 0,
      isFocus: focusBarangays && focusBarangays.some(fb => normaliseKey(fb) === normaliseKey(b.name)),
      isFromCurrentCity: resolvedBarangays.some(rb => normaliseKey(rb.name) === normaliseKey(b.name))
    }));

    // Separate into categories
    const unusedProvinceBarangays = barangaysWithCounts.filter(b => b.provinceCount === 0);
    const unusedCityBarangays = barangaysWithCounts.filter(b => b.cityCount === 0 && b.isFromCurrentCity);
    const lowCountBarangays = barangaysWithCounts.filter(b => b.provinceCount > 0 && b.provinceCount <= 1);
    const mediumCountBarangays = barangaysWithCounts.filter(b => b.provinceCount > 1 && b.provinceCount <= 2);
    const focusBarangaysList = barangaysWithCounts.filter(b => b.isFocus);

    const roll = Math.random();
    
    // HEAVILY prioritize unused barangays across the entire province
    if (roll < 0.60 && unusedProvinceBarangays.length > 0) {
      // 60% chance: unused barangays across entire province (HIGHEST PRIORITY for wide distribution)
      selectionPool = unusedProvinceBarangays.map(b => b.barangay);
    } else if (roll < 0.70 && unusedCityBarangays.length > 0) {
      // 10% chance: unused barangays in this city
      selectionPool = unusedCityBarangays.map(b => b.barangay);
    } else if (roll < 0.80 && focusBarangaysList.length > 0) {
      // 10% chance: focus barangays (concentration around branch)
      selectionPool = focusBarangaysList.map(b => b.barangay);
    } else if (roll < 0.90 && lowCountBarangays.length > 0) {
      // 10% chance: low count barangays (1 customer in province)
      selectionPool = lowCountBarangays.map(b => b.barangay);
    } else if (roll < 0.95 && mediumCountBarangays.length > 0) {
      // 5% chance: medium count barangays (2 customers in province)
      selectionPool = mediumCountBarangays.map(b => b.barangay);
    } else {
      // 5% chance: all barangays (ensure coverage)
      selectionPool = combinedBarangays;
    }

    selectedBarangay = selectionPool.length > 0
      ? getRandomElement(selectionPool)
      : getRandomElement(combinedBarangays);
    
    // Update city data if we selected a barangay from a different city
    // Find the city for this barangay from CSV
    const selectedBarangayFromCSV = allProvinceBarangaysList.find(b => 
      normaliseKey(b.name) === normaliseKey(selectedBarangay.name)
    );
    
    // Get the city code - prefer from CSV, then from selectedBarangay
    const barangayCityCode = selectedBarangayFromCSV?.cityCode || selectedBarangay.cityCode;
    
    if (barangayCityCode) {
      // Try to find the city name from the city code mapping
      const cityCodeMap = cityData.province === 'Batangas'
        ? CUSTOMER_LOCATION_TRACKER.batangasCityCodeToName
        : CUSTOMER_LOCATION_TRACKER.orientalMindoroCityCodeToName;
      const mappedCityName = cityCodeMap.get(barangayCityCode);
      if (mappedCityName) {
        const newCityData = findCityData(mappedCityName);
        if (newCityData) {
          // Always update city data when we have a match
          const oldCity = cityData.city;
          cityData.city = newCityData.city;
          cityData.lat = newCityData.lat;
          cityData.lng = newCityData.lng;
          cityData.postalCode = newCityData.postalCode;
          // Debug: log city updates (first few only)
          if (Math.random() < 0.001) { // Log ~0.1% of updates to avoid spam
            console.log(`   🔄 City updated: ${oldCity} -> ${newCityData.city} (barangay: ${selectedBarangay.name}, code: ${barangayCityCode})`);
          }
        }
      } else {
        // If mapping fails, try to find city by checking all CITY_DATA cities in the province
        // and see if any of their barangays match this barangay name
        const provinceCities = CITY_DATA.filter(c => c.province === cityData.province);
        let foundMatch = false;
        for (const city of provinceCities) {
          const matchingBarangay = city.barangays.find(cb => 
            normaliseKey(cb) === normaliseKey(selectedBarangay.name)
          );
          if (matchingBarangay) {
            // Found a match! Update city data
            cityData.city = city.city;
            cityData.lat = city.lat;
            cityData.lng = city.lng;
            cityData.postalCode = city.postalCode;
            // Also update the mapping for future use
            if (barangayCityCode) {
              cityCodeMap.set(barangayCityCode, city.city);
            }
            foundMatch = true;
            break;
          }
        }
        
        // If still no match, try to find the closest city by coordinates
        if (!foundMatch && selectedBarangay.latitude && selectedBarangay.longitude) {
          let closestCity = null;
          let closestDistance = Infinity;
          
          for (const city of provinceCities) {
            const distance = Math.sqrt(
              Math.pow(city.lat - selectedBarangay.latitude, 2) +
              Math.pow(city.lng - selectedBarangay.longitude, 2)
            );
            if (distance < closestDistance) {
              closestDistance = distance;
              closestCity = city;
            }
          }
          
          if (closestCity && closestDistance < 0.5) { // Within ~50km
            cityData.city = closestCity.city;
            cityData.lat = closestCity.lat;
            cityData.lng = closestCity.lng;
            cityData.postalCode = closestCity.postalCode;
            // Update the mapping for future use
            if (barangayCityCode) {
              cityCodeMap.set(barangayCityCode, closestCity.city);
            }
          }
        }
      }
    }
    
    // Track usage at both city and province levels
    const cityKey = cityBarangayKey(selectedBarangay);
    const provinceKey = provinceBarangayKey(selectedBarangay.name);
    const cityCount = CUSTOMER_LOCATION_TRACKER.barangayCounts.get(cityKey) || 0;
    const provinceCount = CUSTOMER_LOCATION_TRACKER.provinceBarangayCounts.get(provinceKey) || 0;
    CUSTOMER_LOCATION_TRACKER.barangayCounts.set(cityKey, cityCount + 1);
    CUSTOMER_LOCATION_TRACKER.provinceBarangayCounts.set(provinceKey, provinceCount + 1);
    CUSTOMER_LOCATION_TRACKER.usedBarangays.add(cityKey);
  } else if (isBranchCity || isBatangasCity) {
    // For branch cities: scatter across almost all barangays with concentration near branch
    const barangayKey = (barangay) => `${cityData.city}|${barangay.name}`;
    
    // Get all barangays with their usage counts
    const barangaysWithCounts = resolvedBarangays.map(b => ({
      barangay: b,
      key: barangayKey(b),
      count: CUSTOMER_LOCATION_TRACKER.barangayCounts.get(barangayKey(b)) || 0,
      isFocus: focusBarangays && focusBarangays.some(fb => normaliseKey(fb) === normaliseKey(b.name))
    }));

    // Separate into categories
    const unusedBarangays = barangaysWithCounts.filter(b => b.count === 0);
    const lowCountBarangays = barangaysWithCounts.filter(b => b.count > 0 && b.count <= 1);
    const mediumCountBarangays = barangaysWithCounts.filter(b => b.count > 1 && b.count <= 3);
    const focusBarangaysList = barangaysWithCounts.filter(b => b.isFocus);
    const otherBarangays = barangaysWithCounts.filter(b => !b.isFocus && b.count > 3);

    const roll = Math.random();
    
    // Prioritize unused barangays more heavily to ensure wide distribution
    if (roll < 0.30 && unusedBarangays.length > 0) {
      // 30% chance: unused barangays (wide distribution - HIGHEST PRIORITY)
      selectionPool = unusedBarangays.map(b => b.barangay);
    } else if (roll < 0.50 && focusBarangaysList.length > 0) {
      // 20% chance: focus barangays (concentration around branch)
      selectionPool = focusBarangaysList.map(b => b.barangay);
    } else if (roll < 0.70 && lowCountBarangays.length > 0) {
      // 20% chance: low count barangays (fill gaps - 1 customer)
      selectionPool = lowCountBarangays.map(b => b.barangay);
    } else if (roll < 0.85 && mediumCountBarangays.length > 0) {
      // 15% chance: medium count barangays (2-3 customers)
      selectionPool = mediumCountBarangays.map(b => b.barangay);
    } else {
      // 15% chance: all barangays (ensure coverage)
      selectionPool = resolvedBarangays;
    }

    selectedBarangay = selectionPool.length > 0
      ? getRandomElement(selectionPool)
      : getRandomElement(resolvedBarangays);
    
    // Track usage
    const key = barangayKey(selectedBarangay);
    const currentCount = CUSTOMER_LOCATION_TRACKER.barangayCounts.get(key) || 0;
    CUSTOMER_LOCATION_TRACKER.barangayCounts.set(key, currentCount + 1);
    CUSTOMER_LOCATION_TRACKER.usedBarangays.add(key);
  } else {
    // For non-branch cities: use focus barangays if available, otherwise random
    if (focusBarangays && focusBarangays.length) {
      const focusSet = new Set(focusBarangays.map(normaliseKey));
      const prioritized = resolvedBarangays.filter(entry =>
        entry && entry.name && focusSet.has(normaliseKey(entry.name))
      );
      if (prioritized.length > 0) {
        if (Math.random() < 0.60) {
          selectionPool = prioritized;
        } else {
          selectionPool = prioritized.concat(resolvedBarangays);
        }
      }
    }

    selectedBarangay = selectionPool.length > 0
      ? getRandomElement(selectionPool)
      : getRandomElement(resolvedBarangays);
    
    // Track usage for non-branch cities too
    const key = `${cityData.city}|${selectedBarangay.name}`;
    const currentCount = CUSTOMER_LOCATION_TRACKER.barangayCounts.get(key) || 0;
    CUSTOMER_LOCATION_TRACKER.barangayCounts.set(key, currentCount + 1);
  }

  const barangayEntry = toBarangayObject(selectedBarangay, {
    provinceCode: null,
    cityCode: null,
    regionCode: null
  });
  const streetNumber = getRandomInt(1, 999);
  const streetName = getRandomElement(['Rizal', 'Bonifacio', 'Aguinaldo', 'Luna', 'Mabini', 'Del Pilar', 'Burgos', 'Gomez']);
  const postalCode = cityData.postalCode ? cityData.postalCode + getRandomInt(0, 12) : getRandomInt(4000, 4500);
  const fullAddress = `${streetNumber} ${streetName} STREET, ${barangayEntry.name}, ${cityData.city}, ${cityData.province} ${postalCode}`;
  
  // Try to find centroid by code first, then by name
  let centroidFromLookup = null;
  if (barangayEntry.code) {
    centroidFromLookup = BARANGAY_COORDINATES_BY_CODE.get(barangayEntry.code);
  }
  
  // If not found by code, try to find by normalized barangay name
  if (!centroidFromLookup && barangayEntry.name) {
    const normalizedName = normaliseKey(barangayEntry.name);
    
    // Try with city code first (most specific)
    if (barangayEntry.cityCode) {
      const nameKey = `${barangayEntry.cityCode}|${normalizedName}`;
      centroidFromLookup = BARANGAY_COORDINATES_BY_NAME.get(nameKey);
    }
    
    // Fallback to just normalized name
    if (!centroidFromLookup) {
      centroidFromLookup = BARANGAY_COORDINATES_BY_NAME.get(normalizedName);
    }
    
    // Try partial matches (remove common suffixes like "(Poblacion)", "Barangay", etc.)
    if (!centroidFromLookup) {
      const cleanedName = normalizedName
        .replace(/BARANGAY\d+/g, '')
        .replace(/POBLACION/g, '')
        .replace(/\(.*?\)/g, '')
        .trim();
      if (cleanedName && cleanedName !== normalizedName) {
        if (barangayEntry.cityCode) {
          const nameKey = `${barangayEntry.cityCode}|${cleanedName}`;
          centroidFromLookup = BARANGAY_COORDINATES_BY_NAME.get(nameKey);
        }
        if (!centroidFromLookup) {
          centroidFromLookup = BARANGAY_COORDINATES_BY_NAME.get(cleanedName);
        }
      }
    }
  }
  
  // Use centroid if found, otherwise use barangay entry coordinates, otherwise city coordinates with small jitter
  const latitudeBase = centroidFromLookup?.latitude ?? barangayEntry.latitude;
  const longitudeBase = centroidFromLookup?.longitude ?? barangayEntry.longitude;
  
  // Small jitter to scatter addresses within barangay (about 200-400 meters)
  // If we have a centroid, use smaller jitter. If using city coordinates, use larger jitter.
  const hasCentroid = !!centroidFromLookup;
  const jitter = hasCentroid ? 0.003 : 0.01; // ~300m with centroid, ~1km without
  const latitude = (
    latitudeBase ?? (cityData.lat + (Math.random() - 0.5) * jitter)
  ).toFixed(6);
  const longitude = (
    longitudeBase ?? (cityData.lng + (Math.random() - 0.5) * jitter)
  ).toFixed(6);

  return {
    address: fullAddress,
    street: `${streetNumber} ${streetName} STREET`,
    barangay: barangayEntry.name,
    barangay_code: barangayEntry.code,
    city: cityData.city,
    province: cityData.province,
    postal_code: postalCode.toString(),
    phone: generatePhoneNumber(),
    receiver: generatePlayerName(),
    latitude: Number(latitude),
    longitude: Number(longitude),
    coordinates: null,
    region: cityData.region
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Add business days to a date (excluding weekends)
function addBusinessDays(date, days) {
  const result = new Date(date);
  let daysAdded = 0;
  
  while (daysAdded < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }
  
  return result;
}

// Check if order contains apparel products
function hasApparelProducts(orderItems) {
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return false;
  }
  
  const apparelTypes = ['jersey', 'jerseys', 'uniform', 'uniforms', 'hoodie', 'hoodies', 'tshirt', 'tshirts', 'longsleeve', 'longsleeves'];
  const apparelCategories = ['jerseys', 'uniforms', 'hoodies', 'tshirts', 'longsleeves', 'apparel'];
  
  return orderItems.some(item => {
    const productType = (item.product_type || '').toLowerCase();
    const category = (item.category || '').toLowerCase();
    
    return apparelTypes.some(type => productType.includes(type)) ||
           apparelCategories.some(cat => category.includes(cat));
  });
}

function generatePersonIdentity() {
  return {
    first: getRandomElement(firstNames),
    last: getRandomElement(lastNames)
  };
}

function buildCustomerEmail(first, last) {
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const base = `${first}.${last}.${timestamp}${randomSuffix}`.toLowerCase();
  const sanitized = base.replace(/[^a-z0-9.]/g, '');
  return `${sanitized}@mail.yohanns.com`;
}

async function createCustomerAccount() {
  const { first, last } = generatePersonIdentity();
  const email = buildCustomerEmail(first, last);
  const password = `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  const fullName = `${first} ${last}`;
  const phone = generatePhoneNumber();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: {
      role: 'customer',
      full_name: fullName,
      first_name: first,
      last_name: last,
      phone: phone,
      contact_number: phone
    }
  });

  if (error) {
    throw error;
  }

  // Also create/update user_profiles entry with phone number
  try {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: data.user.id,
        full_name: fullName,
        phone: phone
      }, {
        onConflict: 'user_id'
      });

    if (profileError) {
      console.warn(`⚠️ Failed to create user_profile for ${email}:`, profileError.message);
    }
  } catch (profileErr) {
    console.warn(`⚠️ Error creating user_profile for ${email}:`, profileErr.message);
  }

  return { id: data.user.id, fullName, phone };
}

function findCityData(cityName) {
  if (!cityName) {
    return null;
  }
  const upper = cityName.toUpperCase();
  return CITY_LOOKUP.get(upper) || FAR_CITY_LOOKUP.get(upper) || null;
}

function selectCityForBranch(branchName) {
  const upperBranch = (branchName || '').toUpperCase();
  const preferredCityName = BRANCH_TO_CITY.get(upperBranch);
  const baseCity = findCityData(preferredCityName);
  const roll = Math.random();
  
  // Get nearby cities for this branch
  const nearbyCities = BRANCH_NEARBY_CITIES.get(normaliseKey(branchName)) || [];
  const nearbyCityData = nearbyCities
    .map(cityName => findCityData(cityName))
    .filter(city => city !== null);

  if (baseCity && baseCity.province === 'Batangas') {
    // For Batangas Province branches: spread more widely across the province
    // 35% chance: branch city (concentration)
    if (roll < 0.35) {
      const branchCityCount = CUSTOMER_LOCATION_TRACKER.branchCityCounts.get(upperBranch) || 0;
      CUSTOMER_LOCATION_TRACKER.branchCityCounts.set(upperBranch, branchCityCount + 1);
      return baseCity;
    }
    
    // 30% chance: nearby cities (within same province/region)
    if (roll < 0.65 && nearbyCityData.length > 0) {
      // Prefer nearby cities with fewer customers
      const nearbyWithCounts = nearbyCityData.map(city => ({
        city,
        count: CUSTOMER_LOCATION_TRACKER.cityCounts.get(city.city) || 0
      }));
      nearbyWithCounts.sort((a, b) => a.count - b.count);
      const selected = nearbyWithCounts[0].city;
      const cityCount = CUSTOMER_LOCATION_TRACKER.cityCounts.get(selected.city) || 0;
      CUSTOMER_LOCATION_TRACKER.cityCounts.set(selected.city, cityCount + 1);
      return selected;
    }
    
    // 25% chance: other cities in Batangas Province (wide distribution)
    if (roll < 0.90) {
      const sameProvince = CITY_DATA.filter(city => 
        city.city !== baseCity.city && 
        city.province === 'Batangas' &&
        !nearbyCityData.some(nc => nc.city === city.city)
      );
      if (sameProvince.length) {
        // Prefer cities with fewer customers
        const provinceWithCounts = sameProvince.map(city => ({
          city,
          count: CUSTOMER_LOCATION_TRACKER.cityCounts.get(city.city) || 0
        }));
        provinceWithCounts.sort((a, b) => a.count - b.count);
        const selected = provinceWithCounts[0].city;
        const cityCount = CUSTOMER_LOCATION_TRACKER.cityCounts.get(selected.city) || 0;
        CUSTOMER_LOCATION_TRACKER.cityCounts.set(selected.city, cityCount + 1);
        return selected;
      }
    }
    
    // 8% chance: other Calabarzon/Mindoro cities
    if (roll < 0.98) {
      const calabarzonMindoro = CITY_DATA.filter(city => 
        (city.region === 'CALABARZON' || city.region === 'MIMAROPA') &&
        city.city !== baseCity.city &&
        city.province !== 'Batangas' &&
        !nearbyCityData.some(nc => nc.city === city.city)
      );
      if (calabarzonMindoro.length) {
        const selected = getRandomElement(calabarzonMindoro);
        const cityCount = CUSTOMER_LOCATION_TRACKER.cityCounts.get(selected.city) || 0;
        CUSTOMER_LOCATION_TRACKER.cityCounts.set(selected.city, cityCount + 1);
        return selected;
      }
    }
  } else if (baseCity) {
    // For non-Batangas branches: original logic
    // 50% chance: branch city (concentration)
    if (roll < 0.50) {
      const branchCityCount = CUSTOMER_LOCATION_TRACKER.branchCityCounts.get(upperBranch) || 0;
      CUSTOMER_LOCATION_TRACKER.branchCityCounts.set(upperBranch, branchCityCount + 1);
      return baseCity;
    }
    
    // 25% chance: nearby cities (within same province/region)
    if (roll < 0.75 && nearbyCityData.length > 0) {
      const nearbyWithCounts = nearbyCityData.map(city => ({
        city,
        count: CUSTOMER_LOCATION_TRACKER.cityCounts.get(city.city) || 0
      }));
      nearbyWithCounts.sort((a, b) => a.count - b.count);
      const selected = nearbyWithCounts[0].city;
      const cityCount = CUSTOMER_LOCATION_TRACKER.cityCounts.get(selected.city) || 0;
      CUSTOMER_LOCATION_TRACKER.cityCounts.set(selected.city, cityCount + 1);
      return selected;
    }
    
    // 15% chance: other cities in same province
    if (roll < 0.90) {
      const sameProvince = CITY_DATA.filter(city => 
        city.city !== baseCity.city && 
        city.province === baseCity.province &&
        !nearbyCityData.some(nc => nc.city === city.city)
      );
      if (sameProvince.length) {
        const selected = getRandomElement(sameProvince);
        const cityCount = CUSTOMER_LOCATION_TRACKER.cityCounts.get(selected.city) || 0;
        CUSTOMER_LOCATION_TRACKER.cityCounts.set(selected.city, cityCount + 1);
        return selected;
      }
    }
    
    // 8% chance: other Calabarzon/Mindoro cities
    if (roll < 0.98) {
      const calabarzonMindoro = CITY_DATA.filter(city => 
        (city.region === 'CALABARZON' || city.region === 'MIMAROPA') &&
        city.city !== baseCity.city &&
        !nearbyCityData.some(nc => nc.city === city.city)
      );
      if (calabarzonMindoro.length) {
        const selected = getRandomElement(calabarzonMindoro);
        const cityCount = CUSTOMER_LOCATION_TRACKER.cityCounts.get(selected.city) || 0;
        CUSTOMER_LOCATION_TRACKER.cityCounts.set(selected.city, cityCount + 1);
        return selected;
      }
    }
  }

  // 2% chance: far cities (rare)
  if (roll > 0.98) {
    return getRandomElement(FAR_CITY_DATA);
  }

  // Fallback: random from CITY_DATA
  const selected = getRandomElement(CITY_DATA);
  const cityCount = CUSTOMER_LOCATION_TRACKER.cityCounts.get(selected.city) || 0;
  CUSTOMER_LOCATION_TRACKER.cityCounts.set(selected.city, cityCount + 1);
  return selected;
}

async function loadExistingCustomers() {
  const perPage = 1000;
  let page = 1;
  const customerUsers = [];

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error('   Error fetching existing customers:', error.message);
      break;
    }

    const users = data?.users || [];
    for (const user of users) {
      if ((user.user_metadata?.role || '').toLowerCase() === 'customer') {
        customerUsers.push({
          id: user.id,
          fullName: user.user_metadata?.full_name || generatePlayerName()
        });
      }
    }

    if (users.length < perPage) {
      break;
    }
    page += 1;
  }

  return customerUsers;
}

/**
 * Load existing city counts from database to initialize CUSTOMER_LOCATION_TRACKER
 * Uses the same query logic as query-customers-by-city-simple.sql
 */
async function loadExistingCityCounts() {
  console.log('📍 Loading existing city counts from database...');
  
  try {
    // Query cities from user_addresses
    const { data: addressCities, error: addressError } = await supabase
      .from('user_addresses')
      .select('user_id, city, province')
      .not('city', 'is', null)
      .neq('city', '')
      .in('province', ['Batangas', 'Oriental Mindoro']);

    if (addressError) {
      console.warn('   ⚠️  Error loading cities from user_addresses:', addressError.message);
    }

    // Query cities from orders.delivery_address
    // Note: We need to fetch all orders and filter in JavaScript since Supabase client
    // doesn't easily support JSONB field filtering for nested properties
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, delivery_address, status')
      .not('delivery_address', 'is', null);

    if (ordersError) {
      console.warn('   ⚠️  Error loading cities from orders:', ordersError.message);
    }

    // Combine and count cities
    const cityUserMap = new Map(); // "city|province" -> Set of user_ids

    // Process user_addresses
    if (addressCities) {
      for (const addr of addressCities) {
        const city = (addr.city || '').trim();
        const province = (addr.province || '').trim();
        if (city && province) {
          const key = `${city}|${province}`;
          if (!cityUserMap.has(key)) {
            cityUserMap.set(key, new Set());
          }
          cityUserMap.get(key).add(addr.user_id);
        }
      }
    }

    // Process orders.delivery_address
    if (orders) {
      for (const order of orders) {
        // Skip cancelled orders
        const status = (order.status || '').toLowerCase();
        if (status === 'cancelled' || status === 'canceled') {
          continue;
        }
        
        const deliveryAddr = order.delivery_address;
        if (deliveryAddr && typeof deliveryAddr === 'object') {
          const city = (deliveryAddr.city || '').trim();
          const province = (deliveryAddr.province || '').trim();
          if (city && province && 
              (province === 'Batangas' || province === 'Oriental Mindoro')) {
            const key = `${city}|${province}`;
            if (!cityUserMap.has(key)) {
              cityUserMap.set(key, new Set());
            }
            cityUserMap.get(key).add(order.user_id);
          }
        }
      }
    }

    // Initialize CUSTOMER_LOCATION_TRACKER.cityCounts
    let loadedCount = 0;
    for (const [key, userIds] of cityUserMap.entries()) {
      const [city, province] = key.split('|');
      const count = userIds.size;
      CUSTOMER_LOCATION_TRACKER.cityCounts.set(city, count);
      loadedCount++;
    }

    console.log(`   ✅ Loaded ${loadedCount} cities with existing customer counts`);
    return true;
  } catch (error) {
    console.error('   ❌ Error loading existing city counts:', error.message);
    return false;
  }
}

async function prepareCustomers(targetCount) {
  const existingCustomers = await loadExistingCustomers();
  const customers = existingCustomers.map(customer => ({
    id: customer.id,
    fullName: customer.fullName,
    segment: null,
    yearBucket: null
  }));

  let createdCount = 0;
  const createdCustomerIds = [];
  while (customers.length < targetCount) {
    try {
      const newCustomer = await createCustomerAccount();
      customers.push({
        id: newCustomer.id,
        fullName: newCustomer.fullName,
        segment: null,
        yearBucket: null
      });
      createdCount += 1;
      createdCustomerIds.push(newCustomer.id);
      if (createdCount % 100 === 0) {
        console.log(`   Created ${createdCount} new customer accounts...`);
      }
    } catch (error) {
      console.error('   Customer creation error:', error.message);
    }
    await delay(CUSTOMER_CREATION_DELAY_MS);
  }

  return {
    customers,
    existingCount: existingCustomers.length,
    createdCount,
    createdCustomerIds
  };
}

async function removeCustomersWithoutOrders(customerIds = []) {
  if (!Array.isArray(customerIds) || customerIds.length === 0) {
    return { removed: 0, skipped: [], failures: [] };
  }

  let removed = 0;
  const skipped = [];
  const failures = [];

  for (const customerId of customerIds) {
    try {
      const { count, error: countError } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', customerId);

      if (countError) {
        failures.push({ customerId, reason: countError.message });
        continue;
      }

      if ((count ?? 0) > 0) {
        skipped.push(customerId);
        continue;
      }

      const { error: deleteError } = await supabase.auth.admin.deleteUser(customerId);
      if (deleteError) {
        failures.push({ customerId, reason: deleteError.message });
      } else {
        removed += 1;
      }
    } catch (error) {
      failures.push({ customerId, reason: error.message });
    }

    await delay(CUSTOMER_CREATION_DELAY_MS);
  }

  return { removed, skipped, failures };
}

function configureCustomers(customers, yearTargets) {
  const shuffled = [...customers];
  shuffled.sort(() => Math.random() - 0.5);

  const total = shuffled.length;
  const loyalCount = Math.max(1, Math.floor(total * LOYAL_SHARE));
  const engagedCount = Math.max(1, Math.floor(total * ENGAGED_SHARE));

  shuffled.forEach((customer, index) => {
    if (index < loyalCount) {
      customer.segment = 'loyal';
    } else if (index < loyalCount + engagedCount) {
      customer.segment = 'engaged';
    } else {
      customer.segment = 'casual';
    }
  });

  let pointer = 0;
  yearTargets.forEach((target, yearIndex) => {
    const allocation = yearIndex === yearTargets.length - 1
      ? total - pointer
      : Math.min(target, total - pointer);
    for (let i = 0; i < allocation && pointer < total; i += 1, pointer += 1) {
      shuffled[pointer].yearBucket = yearIndex;
    }
  });
  while (pointer < total) {
    shuffled[pointer].yearBucket = yearTargets.length - 1;
    pointer += 1;
  }
}

function buildBranchPicker(branches) {
  if (!Array.isArray(branches) || branches.length === 0) {
    return () => 'BATANGAS CITY BRANCH';
  }

  const entries = branches.map(name => {
    const weight = BRANCH_PRIORITY_WEIGHTS[name.toUpperCase()] || 1;
    return { name, weight };
  });

  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let cumulative = 0;
  const distribution = entries.map(entry => {
    cumulative += entry.weight / totalWeight;
    return { name: entry.name, threshold: cumulative };
  });

  return () => {
    const roll = Math.random();
    return distribution.find(entry => roll <= entry.threshold)?.name || distribution[distribution.length - 1].name;
  };
}

function buildCustomerSelector(customers, requiredPerYear, startYear) {
  const customerMap = new Map(customers.map(customer => [customer.id, customer]));
  const allCustomerIds = customers.map(customer => customer.id);
  const perYearRequirements = Array.isArray(requiredPerYear)
    ? requiredPerYear
    : Array.from({ length: YEARS_TO_GENERATE }, () => requiredPerYear);
  const getRequiredForYear = (index) =>
    perYearRequirements[Math.min(index, perYearRequirements.length - 1)];

  const segmentPools = {
    loyal: customers.filter(customer => customer.segment === 'loyal').map(customer => customer.id),
    engaged: customers.filter(customer => customer.segment === 'engaged').map(customer => customer.id),
    casual: customers.filter(customer => customer.segment === 'casual').map(customer => customer.id)
  };

  const yearNewQueues = Array.from({ length: YEARS_TO_GENERATE }, () => []);
  customers.forEach(customer => {
    if (typeof customer.yearBucket === 'number' && yearNewQueues[customer.yearBucket]) {
      yearNewQueues[customer.yearBucket].push(customer.id);
    } else {
      yearNewQueues[yearNewQueues.length - 1].push(customer.id);
    }
  });
  yearNewQueues.forEach(queue => queue.sort(() => Math.random() - 0.5));

  const yearCustomerSets = Array.from({ length: YEARS_TO_GENERATE }, () => new Set());
  const yearOrderCounts = Array.from({ length: YEARS_TO_GENERATE }, () => 0);
  const customerOrderCounts = new Map();

  const loyalRepeatPool = new Set();
  const engagedRepeatPool = new Set();
  const segmentOrders = { loyal: 0, engaged: 0, casual: 0 };

  function pickFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function registerSelection(customerId, yearIndex) {
    const customer = customerMap.get(customerId);
    const safeYearIndex = Math.max(0, Math.min(yearIndex, YEARS_TO_GENERATE - 1));

    yearCustomerSets[safeYearIndex].add(customerId);
    yearOrderCounts[safeYearIndex] += 1;

    const currentCount = customerOrderCounts.get(customerId) || 0;
    customerOrderCounts.set(customerId, currentCount + 1);

    segmentOrders[customer.segment] += 1;

    if (customer.segment === 'loyal') {
      loyalRepeatPool.add(customerId);
    } else if (customer.segment === 'engaged' && currentCount + 1 >= 2) {
      engagedRepeatPool.add(customerId);
    }
  }

  function selectBySegment() {
    const randomValue = Math.random();

    if (segmentPools.loyal.length && randomValue < 0.23) {
      if (loyalRepeatPool.size && Math.random() < 0.55) {
        return pickFromArray(Array.from(loyalRepeatPool));
      }
      return pickFromArray(segmentPools.loyal);
    }

    if (segmentPools.engaged.length && randomValue < 0.6) {
      if (engagedRepeatPool.size && Math.random() < 0.3) {
        return pickFromArray(Array.from(engagedRepeatPool));
      }
      return pickFromArray(segmentPools.engaged);
    }

    if (segmentPools.casual.length) {
      return pickFromArray(segmentPools.casual);
    }

    if (segmentPools.engaged.length) {
      return pickFromArray(segmentPools.engaged);
    }

    if (segmentPools.loyal.length) {
      return pickFromArray(segmentPools.loyal);
    }

    return null;
  }

  return {
    select(date) {
      const orderYear = date.getFullYear();
      let yearIndex = orderYear - startYear;
      yearIndex = Math.max(0, Math.min(yearIndex, YEARS_TO_GENERATE - 1));

      let customerId = null;

      if (yearCustomerSets[yearIndex].size < getRequiredForYear(yearIndex) && yearNewQueues[yearIndex].length) {
        customerId = yearNewQueues[yearIndex].shift();
      }

      if (!customerId) {
        customerId = selectBySegment();
      }

      if (!customerId) {
        customerId = pickFromArray(allCustomerIds);
      }

      registerSelection(customerId, yearIndex);
      return customerId;
    },
    getStats() {
      return {
        yearlyUniqueCounts: yearCustomerSets.map(set => set.size),
        yearlyOrderCounts: [...yearOrderCounts],
        segmentOrderCounts: { ...segmentOrders },
        totalCustomers: customers.length
      };
    },
    allCustomerIds
  };
}

// Calculate growth trend (business grows over 3 years)
function getGrowthMultiplier(yearIndex, monthIndex) {
  const monthsSinceStart = yearIndex * 12 + monthIndex;
  // Start at 0.6x, grow to 1.2x over 36 months
  return 0.6 + (monthsSinceStart / 36) * 0.6;
}

// Peak seasons: Summer (March-May), Intramurals (varies), Youth Week (August)
function isPeakSeason(date) {
  const month = date.getMonth() + 1; // 1-12
  // Summer: March-May, Youth Week: August
  return month >= 3 && month <= 5 || month === 8;
}

// Calculate target jerseys per day based on production capacity
function getTargetJerseysPerDay(date, growthMultiplier) {
  const month = date.getMonth() + 1;
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isPeak = isPeakSeason(date);
  
  // Base production: 1000-1200 jerseys/month = ~33-40 jerseys/day
  // Peak production: 2000+ jerseys/month = ~66+ jerseys/day
  let baseJerseys = isPeak ? 66 : 36; // Average of range
  
  // Apply growth multiplier (starts at 0.6x, grows to 1.2x)
  baseJerseys = Math.round(baseJerseys * growthMultiplier);
  
  if (date < COVID_RECOVERY_END) {
    const monthsFromStart = (date.getFullYear() - 2022) * 12 + date.getMonth();
    const recoveryProgress = Math.min(1, Math.max(0, monthsFromStart / 6));
    const covidMultiplier = 0.45 + (0.55 * recoveryProgress);
    baseJerseys = Math.max(1, Math.round(baseJerseys * covidMultiplier));
  }

  // Weekend reduction (less production on weekends)
  if (isWeekend) baseJerseys = Math.round(baseJerseys * 0.6);
  
  // Add some variance (±20%)
  const variance = baseJerseys * 0.2;
  baseJerseys = Math.round(baseJerseys + (Math.random() - 0.5) * variance * 2);
  
  return Math.max(1, baseJerseys);
}

function generateOrdersForDate(date, growthMultiplier) {
  const targetJerseys = getTargetJerseysPerDay(date, growthMultiplier);
  const orders = [];
  let totalJerseysGenerated = 0;
  const maxAttempts = 50; // Prevent infinite loops
  let attempts = 0;
  
  // Generate orders until we reach target jersey count
  // Average order: 8-15 jerseys = ~11.5 jerseys per order
  while ((totalJerseysGenerated < targetJerseys || orders.length === 0) && attempts < maxAttempts) {
    attempts++;
    const order = generateSingleOrder(date);
    const orderJerseys = order.totalItems;
    
    // Check if adding this order would exceed target significantly
    if (totalJerseysGenerated + orderJerseys > targetJerseys * 1.3) {
      // If we're close to target, stop (but ensure at least one order)
      if (totalJerseysGenerated >= targetJerseys * 0.8 && orders.length > 0) {
        break;
      }
    }
    
    orders.push(order);
    totalJerseysGenerated += orderJerseys;
    
    // Safety limit: don't generate more than 2x target
    if (totalJerseysGenerated > targetJerseys * 2) {
      break;
    }
  }
  
  return orders;
}

function generateSingleOrderLegacy(date) {
  // Most orders are team orders (8-15 jerseys per order)
  const isTeamOrder = Math.random() < 0.85; // 85% team orders
  const orderType = Math.random();
  
  // Get available branches (set in generateAndInsertData)
  const branches = global.availableBranches || [
    'SAN PASCUAL (MAIN BRANCH)', 'CALAPAN BRANCH', 'MUZON BRANCH',
    'LEMERY BRANCH', 'BATANGAS CITY BRANCH', 'BAUAN BRANCH',
    'CALACA BRANCH', 'PINAMALAYAN BRANCH', 'ROSARIO BRANCH'
  ];
  
  let orderItems = [];
  let totalAmount = 0;
  let totalItems = 0;
  
  // 80% sublimation jerseys, 10% hoodies, 10% sports materials
  if (orderType < 0.80) {
    // Sublimation jersey order - main product
    const sport = Math.random() < 0.55 ? 'basketball' : 'volleyball';
    
    // Jersey type: Full Set (60%), Shirt Only (25%), Short Only (15%)
    const jerseyTypeRoll = Math.random();
    let jerseyType, isFullSet, isShirtOnly, isShortOnly;
    
    if (jerseyTypeRoll < 0.50) {
      isFullSet = true;
      isShirtOnly = false;
      isShortOnly = false;
      jerseyType = 'Full Set';
    } else if (jerseyTypeRoll < 0.80) {
      isFullSet = false;
      isShirtOnly = true;
      isShortOnly = false;
      jerseyType = 'Shirt Only';
    } else {
      isFullSet = false;
      isShirtOnly = false;
      isShortOnly = true;
      jerseyType = 'Short Only';
    }
    
    // Team size: 8-15 jerseys per order (as specified)
    const teamSize = isTeamOrder ? getRandomInt(8, 15) : getRandomInt(1, 5);
    
    const players = [];
    for (let j = 0; j < teamSize; j++) {
      const isKids = isTeamOrder ? Math.random() < 0.7 : Math.random() < 0.6;
      const playerSizes = isKids ? sizes.kids : sizes.adult;
      const size = getRandomElement(playerSizes);
      
      players.push({
        playerName: generatePlayerName(),
        jerseyNo: j + 1,
        size: size
      });
    }
    
    const isKidsSizeFirst = sizes.kids.includes(players[0].size);
    
    // Pricing: Full set uses full price, shirt/short only uses upper price
    let pricePerUnit;
    if (isFullSet) {
      pricePerUnit = isKidsSizeFirst 
        ? productCategories.sublimation[sport].kids 
        : productCategories.sublimation[sport].adult;
    } else {
      // Shirt only or short only - use upper pricing
      pricePerUnit = isKidsSizeFirst 
        ? productCategories.sublimation[sport].upper_kids 
        : productCategories.sublimation[sport].upper_adult;
    }
    
    const itemTotal = pricePerUnit * teamSize;
    totalAmount += itemTotal;
    totalItems += teamSize;
    
    orderItems.push({
      product_type: 'sublimation',
      name: `Sublimation Jersey (${jerseyType}) - ${sport}`,
      category: 'sublimation',
      sport: sport,
      quantity: teamSize,
      pricePerUnit: pricePerUnit,
      totalPrice: itemTotal,
      team_members: players,
      jersey_type: jerseyType.toLowerCase().replace(/\s+/g, '_'),
      is_full_set: isFullSet,
      is_shirt_only: isShirtOnly,
      is_short_only: isShortOnly
    });
  } else if (orderType < 0.90) {
    // Hoodie order
    const quantity = isTeamOrder ? getRandomInt(8, 15) : getRandomInt(1, 5);
    const isKids = Math.random() < 0.3;
    const pricePerUnit = isKids ? productCategories.hoodie.kids : productCategories.hoodie.adult;
    const itemTotal = pricePerUnit * quantity;
    
    totalAmount += itemTotal;
    totalItems += quantity;
    
    orderItems.push({
      product_type: 'hoodie',
      name: 'Hoodie',
      category: 'hoodie',
      quantity: quantity,
      pricePerUnit: pricePerUnit,
      totalPrice: itemTotal
    });
  } else {
    // Sports materials order
    const materialType = Math.random();
    if (materialType < 0.4) {
      // Balls
      const ballType = getRandomElement(['basketball', 'volleyball', 'football']);
      const quantity = getRandomInt(5, 20);
      const pricePerUnit = productCategories.sports_materials.ball[ballType];
      const itemTotal = pricePerUnit * quantity;
      
      totalAmount += itemTotal;
      totalItems += quantity;
      
      orderItems.push({
        product_type: 'sports_material',
        name: `${ballType.charAt(0).toUpperCase() + ballType.slice(1)} Ball`,
        category: 'sports_materials',
        material_type: 'ball',
        ball_type: ballType,
        quantity: quantity,
        pricePerUnit: pricePerUnit,
        totalPrice: itemTotal
      });
    } else if (materialType < 0.7) {
      // Medals
      const medalType = getRandomElement(['gold', 'silver', 'bronze']);
      const quantity = getRandomInt(10, 50);
      const pricePerUnit = productCategories.sports_materials.medal[medalType];
      const itemTotal = pricePerUnit * quantity;
      
      totalAmount += itemTotal;
      totalItems += quantity;
      
      orderItems.push({
        product_type: 'sports_material',
        name: `${medalType.charAt(0).toUpperCase() + medalType.slice(1)} Medal`,
        category: 'sports_materials',
        material_type: 'medal',
        medal_type: medalType,
        quantity: quantity,
        pricePerUnit: pricePerUnit,
        totalPrice: itemTotal
      });
    } else {
      // Trophies
      const trophySize = getRandomElement(['small', 'medium', 'large']);
      const quantity = getRandomInt(1, 10);
      const pricePerUnit = productCategories.sports_materials.trophy[trophySize];
      const itemTotal = pricePerUnit * quantity;
      
      totalAmount += itemTotal;
      totalItems += quantity;
      
      orderItems.push({
        product_type: 'sports_material',
        name: `${trophySize.charAt(0).toUpperCase() + trophySize.slice(1)} Trophy`,
        category: 'sports_materials',
        material_type: 'trophy',
        trophy_size: trophySize,
        quantity: quantity,
        pricePerUnit: pricePerUnit,
        totalPrice: itemTotal
      });
    }
  }
  
  // Pickup location - distributed across all branches with weighted priority
  const pickupLocation = global.pickBranch ? global.pickBranch() : getRandomElement(branches);

  // Walk-in orders only (store pickup)
  const shippingMethod = 'pickup';

  // Generate delivery address for ALL orders (needed for heatmapping customer density)
  const deliveryAddress = generateAddress(pickupLocation);

  // Historical walk-in orders have no shipping charges
  const shippingCost = 0;

  // Determine order status and delivery date based on product type
  // Legacy function mostly generates jerseys (apparel), so apply processing time
  const orderDate = new Date(date);
  const isApparelOrder = hasApparelProducts(orderItems);
  let orderStatus;
  let deliveryDate = orderDate;
  let updatedAt = orderDate;

  if (Math.random() < 0.97) {
    // 97% of orders are fulfilled
    if (isApparelOrder) {
      // Apparel orders: 5-7 business days processing time
      const businessDays = getRandomInt(5, 8); // 5-7 business days (inclusive)
      deliveryDate = addBusinessDays(orderDate, businessDays);
      
      // For historical data, if delivery date is in the past, mark as delivered
      const now = new Date();
      if (deliveryDate <= now) {
        orderStatus = 'picked_up_delivered';
        updatedAt = deliveryDate;
      } else {
        // Future order - start as pending (though this shouldn't happen in historical data)
        orderStatus = 'pending';
        updatedAt = orderDate;
      }
    } else {
      // Non-apparel orders (balls, trophies): can be delivered same day
      orderStatus = 'picked_up_delivered';
      deliveryDate = orderDate;
      updatedAt = orderDate;
    }
  } else {
    // 3% of orders are cancelled
    orderStatus = 'cancelled';
    deliveryDate = orderDate;
    updatedAt = orderDate;
  }
  
  return {
    orderDate: orderDate,
    deliveryDate: deliveryDate, // Date when order becomes a sale (for apparel: 5-7 business days later)
    status: orderStatus,
    shippingMethod: shippingMethod,
    pickupLocation: pickupLocation,
    deliveryAddress: deliveryAddress,
    orderNotes: isTeamOrder ? `Team order for ${getRandomElement(teamNames)}` : 'Individual order',
    subtotalAmount: totalAmount,
    shippingCost: shippingCost,
    totalAmount: totalAmount + shippingCost,
    totalItems: totalItems,
    orderItems: orderItems,
    isApparelOrder: isApparelOrder
  };
}

function generateSingleOrder(date) {
  if (!PRODUCT_CATALOG) {
    return generateSingleOrderLegacy(date);
  }

  let orderItems = [];
  let totalAmount = 0;
  let totalItems = 0;
  let isTeamOrder = false;
  let orderTeamName = null;

  const teamName = getRandomElement(teamNames);
  const orderCategoryRoll = Math.random();

  // Product distribution:
  // 32% Basketball jerseys, 22% Volleyball jerseys, 13% T-shirts, 13% Hoodies, 10% Long Sleeves, 11% Uniforms
  // 3% Trophies, 6% Medals, 3% Balls
  // Total: 113%, normalized to 100%
  
  let productCategory = null;
  let sportType = null;
  
  if (orderCategoryRoll < 0.32) {
    // 32% Basketball jerseys
    productCategory = 'jersey';
    sportType = 'Basketball';
  } else if (orderCategoryRoll < 0.54) {
    // 22% Volleyball jerseys
    productCategory = 'jersey';
    sportType = 'Volleyball';
  } else if (orderCategoryRoll < 0.67) {
    // 13% T-shirts
    productCategory = 'tshirt';
  } else if (orderCategoryRoll < 0.80) {
    // 13% Hoodies
    productCategory = 'hoodie';
  } else if (orderCategoryRoll < 0.90) {
    // 10% Long Sleeves
    productCategory = 'longsleeve';
  } else if (orderCategoryRoll < 1.01) {
    // 11% Uniforms
    productCategory = 'uniform';
  } else if (orderCategoryRoll < 1.04) {
    // 3% Trophies (normalized: 2.65%)
    productCategory = 'trophy';
  } else if (orderCategoryRoll < 1.10) {
    // 6% Medals (normalized: 5.31%)
    productCategory = 'medal';
  } else {
    // 3% Balls (normalized: 2.65%)
    productCategory = 'ball';
  }

  // Handle jerseys
  if (productCategory === 'jersey') {
    let product = pickProductFromCatalog('jerseys', APPAREL_CATEGORY_KEYS);
    isTeamOrder = Math.random() < 0.85;
    // Distribute jersey variants: 50% Full Set, 30% Shirt Only, 20% Shorts Only
    const variantRoll = Math.random();
    let variantKey = 'fullSet';
    let variantLabel = 'Full Set';

    if (variantRoll >= 0.50 && variantRoll < 0.80) {
      variantKey = 'shirtOnly';
      variantLabel = 'Shirt Only';
    } else if (variantRoll >= 0.80) {
      variantKey = 'shortsOnly';
      variantLabel = 'Short Only';
    }

    if (!product) {
      product = createSyntheticProduct('jersey', {
        sportType,
        teamName,
        fullSetPrice: getRandomInt(1180, 1420),
        shirtOnlyPrice: getRandomInt(690, 890),
        shortsOnlyPrice: getRandomInt(520, 680)
      });
    }

      const jerseyPrices = product.jersey_prices || {};
      let pricePerUnit = parsePrice(jerseyPrices[variantKey], parsePrice(product.price, 1000));
      const sizeType = isTeamOrder
        ? (Math.random() < 0.7 ? 'kids' : 'adult')
        : (Math.random() < 0.6 ? 'kids' : 'adult');
      const sportKey = sportType.toLowerCase();

      if (sizeType === 'kids' && productCategories.sublimation[sportKey]) {
        const pricing = productCategories.sublimation[sportKey];
        if (variantKey === 'fullSet') {
          pricePerUnit = pricing.kids;
        } else if (variantKey === 'shirtOnly') {
          pricePerUnit = pricing.upper_kids;
        } else if (variantKey === 'shortsOnly') {
          pricePerUnit = Math.max(400, Math.round(pricing.kids * 0.45));
        }
      } else if (sizeType === 'adult' && productCategories.sublimation[sportKey]) {
        const pricing = productCategories.sublimation[sportKey];
        if (variantKey === 'fullSet') {
          pricePerUnit = pricing.adult;
        } else if (variantKey === 'shirtOnly') {
          pricePerUnit = pricing.upper_adult;
        } else if (variantKey === 'shortsOnly') {
          pricePerUnit = Math.max(520, Math.round(pricing.adult * 0.5));
        }
      }

    // Adjust quantity to meet spending target (7k-15k for apparel)
    const targetMin = 7000;
    const targetMax = 15000;
    let quantity;
    
    if (isTeamOrder) {
      // For team orders, calculate quantity to reach target range
      const targetAmount = getRandomInt(targetMin, targetMax);
      const teamSize = Math.max(8, Math.min(20, Math.round(targetAmount / pricePerUnit)));
      const teamMembers = buildTeamMembers(teamName, teamSize, sizeType, variantKey);
      quantity = teamMembers.length;
      orderTeamName = teamName;
      totalAmount += pricePerUnit * quantity;
      totalItems += quantity;
      // Generate cut type and fabric for variety
      const cutTypes = ['Normal Cut', 'NBA Cut'];
      const fabrics = ['Polyester', 'Dri-Fit', 'Mesh', 'Sublimation'];
      const cutType = getRandomElement(cutTypes);
      const fabric = getRandomElement(fabrics);
      
      orderItems.push({
        id: product.id,
        name: product.name,
        image: product.main_image,
        category: product.category,
        price: pricePerUnit,
        pricePerUnit,
        quantity,
        totalPrice: pricePerUnit * quantity,
        product_type: 'jersey',
        jerseyType: variantLabel,
        variantKey: variantKey, // fullSet, shirtOnly, shortsOnly
        sport: sportType,
        cut_type: cutType,
        cutType: cutType,
        fabric: fabric,
        fabric_option: fabric,
        fabricOption: fabric,
        isTeamOrder: true,
        teamName,
        team_name: teamName,
        teamMembers,
        team_members: teamMembers,
        sizeType
      });
    } else {
      // Single jersey orders - if price is too low, make it a small team order to meet target
      if (pricePerUnit < targetMin) {
        const targetAmount = getRandomInt(targetMin, targetMax);
        const teamSize = Math.max(2, Math.min(10, Math.round(targetAmount / pricePerUnit)));
        isTeamOrder = true;
        const teamMembers = buildTeamMembers(teamName, teamSize, sizeType, variantKey);
        quantity = teamMembers.length;
        orderTeamName = teamName;
        totalAmount += pricePerUnit * quantity;
        totalItems += quantity;
        // Generate cut type and fabric for variety
        const cutTypes = ['Normal Cut', 'NBA Cut'];
        const fabrics = ['Polyester', 'Dri-Fit', 'Mesh', 'Sublimation'];
        const cutType = getRandomElement(cutTypes);
        const fabric = getRandomElement(fabrics);
        
        orderItems.push({
          id: product.id,
          name: product.name,
          image: product.main_image,
          category: product.category,
          price: pricePerUnit,
          pricePerUnit,
          quantity,
          totalPrice: pricePerUnit * quantity,
          product_type: 'jersey',
          jerseyType: variantLabel,
          variantKey: variantKey, // fullSet, shirtOnly, shortsOnly
          sport: sportType,
          cut_type: cutType,
          cutType: cutType,
          fabric: fabric,
          fabric_option: fabric,
          fabricOption: fabric,
          isTeamOrder: true,
          teamName,
          team_name: teamName,
          teamMembers,
          team_members: teamMembers,
          sizeType
        });
      } else {
        // Single order with sufficient value
        const singleDetails = buildSingleOrderDetails(teamName, sizeType, variantKey);
        orderTeamName = singleDetails.teamName || teamName;
        totalAmount += pricePerUnit;
        totalItems += 1;
        // Generate cut type and fabric for variety
        const cutTypes = ['Normal Cut', 'NBA Cut'];
        const fabrics = ['Polyester', 'Dri-Fit', 'Mesh', 'Sublimation'];
        const cutType = getRandomElement(cutTypes);
        const fabric = getRandomElement(fabrics);
        
        orderItems.push({
          id: product.id,
          name: product.name,
          image: product.main_image,
          category: product.category,
          price: pricePerUnit,
          pricePerUnit,
          quantity: 1,
          totalPrice: pricePerUnit,
          product_type: 'jersey',
          jerseyType: variantLabel,
          variantKey: variantKey, // fullSet, shirtOnly, shortsOnly
          sport: sportType,
          cut_type: cutType,
          cutType: cutType,
          fabric: fabric,
          fabric_option: fabric,
          fabricOption: fabric,
          isTeamOrder: false,
          teamName: singleDetails.teamName,
          team_name: singleDetails.teamName,
          singleOrderDetails: singleDetails,
          single_order_details: singleDetails,
          sizeType
        });
      }
    }
  } else if (productCategory === 'tshirt' || productCategory === 'hoodie' || productCategory === 'longsleeve' || productCategory === 'uniform') {
    // Handle other apparel (T-shirts, Hoodies, Long Sleeves, Uniforms)
    const categoryMap = {
      'tshirt': 'tshirts',
      'hoodie': 'hoodies',
      'longsleeve': 'longsleeves',
      'uniform': 'uniforms'
    };
    
    const apparelCategories = categoryMap[productCategory] ? [categoryMap[productCategory]] : ['tshirts'];
    let product = pickProductFromCatalog(apparelCategories, APPAREL_CATEGORY_KEYS);

    if (!product) {
      product = createSyntheticProduct(productCategory, {
        teamName,
        basePrice: getRandomInt(720, 1080)
      });
    }

    isTeamOrder = Math.random() < 0.7;
    const sizeType = isTeamOrder
      ? (Math.random() < 0.65 ? 'kids' : 'adult')
      : (Math.random() < 0.55 ? 'kids' : 'adult');

    let pricePerUnit = parsePrice(product.price, sizeType === 'kids' ? 700 : 900);
    if (sizeType === 'kids') {
      const cap = productCategory === 'uniform' ? 780 : 640;
      pricePerUnit = Math.min(pricePerUnit, cap);
    } else if (productCategory === 'uniform') {
      pricePerUnit = Math.max(pricePerUnit, 920);
    }

    // Adjust quantity to meet spending target (7k-15k for apparel)
    const targetMin = 7000;
    const targetMax = 15000;
    let quantity;
    
    // Generate cut type and fabric for variety (applies to all apparel)
    const cutTypes = ['Normal Cut', 'NBA Cut'];
    const fabrics = ['Polyester', 'Dri-Fit', 'Mesh', 'Sublimation'];
    const cutType = getRandomElement(cutTypes);
    const fabric = getRandomElement(fabrics);
    
    if (isTeamOrder) {
      // For team orders, calculate quantity to reach target range
      const targetAmount = getRandomInt(targetMin, targetMax);
      quantity = Math.max(6, Math.min(20, Math.round(targetAmount / pricePerUnit)));
      const teamMembers = buildTeamMembers(teamName, quantity, sizeType);
      quantity = teamMembers.length;
      orderTeamName = teamName;
    } else {
      // Single orders - if price is too low, make it a small team order
      if (pricePerUnit < targetMin) {
        const targetAmount = getRandomInt(targetMin, targetMax);
        quantity = Math.max(2, Math.min(10, Math.round(targetAmount / pricePerUnit)));
        isTeamOrder = true;
        const teamMembers = buildTeamMembers(teamName, quantity, sizeType);
        quantity = teamMembers.length;
        orderTeamName = teamName;
      } else {
        quantity = 1;
        const singleDetails = buildSingleOrderDetails(teamName, sizeType);
        orderTeamName = singleDetails.teamName || teamName;
      }
    }

    totalAmount += pricePerUnit * quantity;
    totalItems += quantity;
    
    if (isTeamOrder) {
      const teamMembers = buildTeamMembers(teamName, quantity, sizeType);
      orderItems.push({
        id: product.id,
        name: product.name,
        image: product.main_image,
        category: product.category || productCategory,
        price: pricePerUnit,
        pricePerUnit,
        quantity,
        totalPrice: pricePerUnit * quantity,
        product_type: (product.category || productCategory).toLowerCase(),
        cut_type: cutType,
        cutType: cutType,
        fabric: fabric,
        fabric_option: fabric,
        fabricOption: fabric,
        isTeamOrder: true,
        teamName,
        team_name: teamName,
        teamMembers,
        team_members: teamMembers,
        sizeType
      });
    } else {
      const singleDetails = buildSingleOrderDetails(teamName, sizeType);
      orderItems.push({
        id: product.id,
        name: product.name,
        image: product.main_image,
        category: product.category || productCategory,
        price: pricePerUnit,
        pricePerUnit,
        quantity: 1,
        totalPrice: pricePerUnit,
        product_type: (product.category || productCategory).toLowerCase(),
        cut_type: cutType,
        cutType: cutType,
        fabric: fabric,
        fabric_option: fabric,
        fabricOption: fabric,
        isTeamOrder: false,
        teamName: singleDetails.teamName,
        team_name: singleDetails.teamName,
        singleOrderDetails: singleDetails,
        single_order_details: singleDetails,
        sizeType
      });
    }
  }

  // Handle non-apparel products (Trophies, Medals, Balls)
  if (productCategory === 'trophy' || productCategory === 'medal' || productCategory === 'ball') {
    // Clear any apparel items if we're generating non-apparel
    orderItems = [];
    totalAmount = 0;
    totalItems = 0;
    isTeamOrder = false;
    orderTeamName = null;

    if (productCategory === 'ball') {
      let product = pickProductFromCatalog('balls', 'others');
      if (!product) {
        const ballType = getRandomElement(['basketball', 'volleyball', 'football']);
        product = createSyntheticProduct('ball', {
          ballType,
          basePrice: getRandomInt(1650, 2250)
        });
      }
      // Target: 1k-5k for non-apparel
      const targetMin = 1000;
      const targetMax = 5000;
      const targetAmount = getRandomInt(targetMin, targetMax);
      const pricePerUnit = parsePrice(product.price, 1800);
      const quantity = Math.max(1, Math.min(15, Math.round(targetAmount / pricePerUnit)));
      const ballDetails = buildBallDetails(product.name);
      totalAmount += pricePerUnit * quantity;
      totalItems += quantity;
      orderItems.push({
        id: product.id,
        name: product.name,
        image: product.main_image,
        category: product.category || 'Balls',
        price: pricePerUnit,
        pricePerUnit,
        quantity,
        totalPrice: pricePerUnit * quantity,
        product_type: 'ball',
        ballDetails,
        ball_details: ballDetails
      });
    } else if (productCategory === 'medal') {
      // Medals
      const medalType = getRandomElement(['gold', 'silver', 'bronze']);
      const pricePerUnit = productCategories.sports_materials.medal[medalType];
      // Target: 1k-5k for non-apparel
      const targetMin = 1000;
      const targetMax = 5000;
      const targetAmount = getRandomInt(targetMin, targetMax);
      const quantity = Math.max(5, Math.min(50, Math.round(targetAmount / pricePerUnit)));
      const itemTotal = pricePerUnit * quantity;
      totalAmount += itemTotal;
      totalItems += quantity;
      orderItems.push({
        product_type: 'sports_material',
        name: `${medalType.charAt(0).toUpperCase() + medalType.slice(1)} Medal`,
        category: 'sports_materials',
        material_type: 'medal',
        medal_type: medalType,
        quantity: quantity,
        pricePerUnit: pricePerUnit,
        totalPrice: itemTotal
      });
    } else if (productCategory === 'trophy') {
      let product = pickProductFromCatalog('trophies', 'others');
      if (!product) {
        product = createSyntheticProduct('trophy', {
          teamName,
          basePrice: getRandomInt(820, 1450)
        });
      }
      // Target: 1k-5k for non-apparel
      const targetMin = 1000;
      const targetMax = 5000;
      const targetAmount = getRandomInt(targetMin, targetMax);
      const pricePerUnit = parsePrice(product.price, 900);
      const quantity = Math.max(1, Math.min(8, Math.round(targetAmount / pricePerUnit)));
      const trophyDetails = buildTrophyDetails(product.name, teamName);
      totalAmount += pricePerUnit * quantity;
      totalItems += quantity;
      orderItems.push({
        id: product.id,
        name: product.name,
        image: product.main_image,
        category: product.category || 'Trophies',
        price: pricePerUnit,
        pricePerUnit,
        quantity,
        totalPrice: pricePerUnit * quantity,
        product_type: 'trophy',
        trophyDetails,
        trophy_details: trophyDetails
      });
    }
  }

  if (orderItems.length === 0) {
    return generateSingleOrderLegacy(date);
  }

  const pickupLocation = global.pickBranch
    ? global.pickBranch()
    : getRandomElement(global.availableBranches || [
      'SAN PASCUAL (MAIN BRANCH)', 'CALAPAN BRANCH', 'MUZON BRANCH',
      'LEMERY BRANCH', 'BATANGAS CITY BRANCH', 'BAUAN BRANCH',
      'CALACA BRANCH', 'PINAMALAYAN BRANCH', 'ROSARIO BRANCH'
    ]);

  const shippingMethod = 'pickup';
  const deliveryAddress = generateAddress(pickupLocation);
  const shippingCost = 0;

  let orderNotes = 'Individual order';
  if (isTeamOrder && orderTeamName) {
    orderNotes = `Team order for ${orderTeamName}`;
  } else if (isTeamOrder) {
    orderNotes = 'Team order';
  } else if (orderItems.some(item => (item.category || '').toLowerCase() === 'trophies')) {
    orderNotes = 'Trophy order';
  } else if (orderItems.some(item => (item.category || '').toLowerCase() === 'balls')) {
    orderNotes = 'Sports equipment order';
  }

  // Determine order status and delivery date based on product type
  const orderDate = new Date(date);
  const isApparelOrder = hasApparelProducts(orderItems);
  let orderStatus;
  let deliveryDate = orderDate;
  let updatedAt = orderDate;

  if (Math.random() < 0.97) {
    // 97% of orders are fulfilled
    if (isApparelOrder) {
      // Apparel orders: 5-7 business days processing time
      const businessDays = getRandomInt(5, 8); // 5-7 business days (inclusive)
      deliveryDate = addBusinessDays(orderDate, businessDays);
      
      // For historical data, if delivery date is in the past, mark as delivered
      // Otherwise, start with pending status
      const now = new Date();
      if (deliveryDate <= now) {
        orderStatus = 'picked_up_delivered';
        updatedAt = deliveryDate;
      } else {
        // Future order - start as pending (though this shouldn't happen in historical data)
        orderStatus = 'pending';
        updatedAt = orderDate;
      }
    } else {
      // Non-apparel orders (balls, trophies): can be delivered same day
      orderStatus = 'picked_up_delivered';
      deliveryDate = orderDate;
      updatedAt = orderDate;
    }
  } else {
    // 3% of orders are cancelled
    orderStatus = 'cancelled';
    deliveryDate = orderDate;
    updatedAt = orderDate;
  }

  return {
    orderDate: orderDate,
    deliveryDate: deliveryDate, // Date when order becomes a sale (for apparel: 5-7 business days later)
    status: orderStatus,
    shippingMethod,
    pickupLocation,
    deliveryAddress,
    orderNotes,
    subtotalAmount: totalAmount,
    shippingCost,
    totalAmount: totalAmount + shippingCost,
    totalItems,
    orderItems,
    isApparelOrder: isApparelOrder
  };
}

async function generateAndInsertData() {
  console.log('🚀 Generating 3 years of order history...\n');
  
  const startDate = new Date(2022, 0, 1);
  const endDate = new Date(2025, 9, 31, 23, 59, 59, 999);
  
  console.log(`📅 Date range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}\n`);
  
  // Load province mapping CSV
  console.log('🗺️  Loading province mapping...');
  provinceMapping = loadProvinceMapping(provinceCsvPath);
  
  // Load city shapefile for accurate city mapping
  console.log('🗺️  Loading city shapefile...');
  cityShapefileMap = await loadCityShapefile(shapefilePath);
  
  // Get correct province codes from mapping
  const batangasProvince = provinceMapping.get('batangas');
  const mindoroProvince = provinceMapping.get('oriental mindoro');
  const batangasShapefileCode = batangasProvince ? batangasProvince.shapefileCode : '401000000';
  const mindoroShapefileCode = mindoroProvince ? mindoroProvince.shapefileCode : '1705200000';
  
  console.log(`   📍 Batangas province code: ${batangasShapefileCode}`);
  console.log(`   📍 Oriental Mindoro province code: ${mindoroShapefileCode}`);
  
  // Initialize Batangas Province barangays with shapefile data
  console.log('📍 Loading Batangas Province barangays...');
  const batangasData = await loadProvinceBarangays(barangayCentroidPath, '000004010', 'Batangas', cityShapefileMap, batangasShapefileCode);
  CUSTOMER_LOCATION_TRACKER.allBatangasBarangays = batangasData.barangays || [];
  CUSTOMER_LOCATION_TRACKER.batangasCityCodeToName = batangasData.cityCodeToName || new Map();
  
  // Initialize Oriental Mindoro Province barangays with shapefile data
  console.log('📍 Loading Oriental Mindoro Province barangays...');
  const mindoroData = await loadProvinceBarangays(barangayCentroidPath, '000017052', 'Oriental Mindoro', cityShapefileMap, mindoroShapefileCode);
  CUSTOMER_LOCATION_TRACKER.allOrientalMindoroBarangays = mindoroData.barangays || [];
  CUSTOMER_LOCATION_TRACKER.orientalMindoroCityCodeToName = mindoroData.cityCodeToName || new Map();
  
  // Fetch branches from database
  console.log('🏪 Fetching branches from database...');
  const { data: branchesData, error: branchesError } = await supabase
    .from('branches')
    .select('name')
    .order('name');
  
  let availableBranches = [
    'SAN PASCUAL (MAIN BRANCH)', 'CALAPAN BRANCH', 'MUZON BRANCH',
    'LEMERY BRANCH', 'BATANGAS CITY BRANCH', 'BAUAN BRANCH',
    'CALACA BRANCH', 'PINAMALAYAN BRANCH', 'ROSARIO BRANCH'
  ];
  
  if (!branchesError && branchesData && branchesData.length > 0) {
    availableBranches = branchesData.map(b => b.name);
    console.log(`   ✅ Found ${availableBranches.length} branches`);
  } else {
    console.log(`   ⚠️  Using default branches (${availableBranches.length} branches)`);
  }
  
  // Configure branch selector for weighted distribution
  global.availableBranches = availableBranches;
  global.pickBranch = buildBranchPicker(availableBranches);

  console.log('🛍️  Loading product catalog from database...');
  PRODUCT_CATALOG = await loadProductCatalog();
  console.log(`   ✅ Products loaded: ${PRODUCT_CATALOG.all.length} total (jerseys: ${PRODUCT_CATALOG.jerseys.length}, apparel: ${PRODUCT_CATALOG.apparel.length}, balls: ${PRODUCT_CATALOG.balls.length}, trophies: ${PRODUCT_CATALOG.trophies.length})`);
  
  // Load existing city counts from database to ensure accurate distribution
  await loadExistingCityCounts();
  
  // Don't use existing customers - create all customers on-demand when they place orders
  // This ensures every customer has at least one order
  console.log('👥 Customer accounts will be created on-demand when orders are placed...\n');
  
  // Track customers that will be created on-demand when they place orders
  const createdCustomersMap = new Map(); // Map of userId -> customer data
  let onDemandCreatedCount = 0;
  
  let totalOrders = 0;
  const allOrders = [];
  const branchOrderCounts = new Map();
  
  const currentDate = new Date(startDate);
  let yearIndex = 0;
  let monthIndex = startDate.getMonth(); // Initialize with start month
  let lastMonth = currentDate.getMonth();
  let orderCounter = 0; // Counter for unique order numbers
  
  console.log('📊 Generating orders...');
  
  while (currentDate <= endDate) {
    const currentMonth = currentDate.getMonth();
    if (currentMonth !== lastMonth) {
      monthIndex++;
      lastMonth = currentMonth;
      if (monthIndex >= 12) {
        yearIndex++;
        monthIndex = 0;
      }
    }
    
    const growthMultiplier = getGrowthMultiplier(yearIndex, monthIndex);
    const ordersForDate = generateOrdersForDate(new Date(currentDate), growthMultiplier);
    
    for (const order of ordersForDate) {
      // Get or create a customer for this order
      let userId;
      
      // Get all previously created customers
      const allCreatedCustomerIds = Array.from(createdCustomersMap.keys());
      
      // 70% chance to reuse an existing customer (if available), 30% chance to create new one
      if (allCreatedCustomerIds.length > 0 && Math.random() < 0.7) {
        // Reuse a previously created customer
        userId = getRandomElement(allCreatedCustomerIds);
      } else {
        // Create new customer on-demand for this order
        try {
          const newCustomer = await createCustomerAccount();
          userId = newCustomer.id;
          createdCustomersMap.set(userId, {
            id: newCustomer.id,
            fullName: newCustomer.fullName,
            phone: newCustomer.phone
          });
          onDemandCreatedCount++;
          
          if (onDemandCreatedCount % 50 === 0) {
            console.log(`   📝 Created ${onDemandCreatedCount} customer accounts on-demand...`);
          }
        } catch (error) {
          console.error(`   ⚠️ Failed to create customer account:`, error.message);
          // Fallback to existing created customer if creation fails
          if (allCreatedCustomerIds.length > 0) {
            userId = getRandomElement(allCreatedCustomerIds);
          } else {
            // If no customers exist and creation failed, skip this order
            console.warn(`   ⚠️ Skipping order - no customer available`);
            continue;
          }
        }
      }
      
      // Generate unique order number with counter and random string
      const orderNumber = `ORD-${currentDate.getTime()}-${orderCounter++}-${Math.random().toString(36).substring(7)}`;
      
      const enrichedOrderItems = assignUniqueJerseyDesigns(order.orderItems, userId, order.orderDate);

      // For apparel orders: created_at is order date, updated_at is delivery date (when it becomes a sale)
      // For non-apparel orders: both dates are the same (delivered same day)
      const createdAt = order.orderDate.toISOString();
      const updatedAt = order.deliveryDate ? order.deliveryDate.toISOString() : order.orderDate.toISOString();

      allOrders.push({
        user_id: userId,
        order_number: orderNumber,
        status: order.status,
        shipping_method: order.shippingMethod,
        pickup_location: order.pickupLocation,
        delivery_address: order.deliveryAddress,
        order_notes: order.orderNotes,
        subtotal_amount: order.subtotalAmount.toString(),
        shipping_cost: order.shippingCost.toString(),
        total_amount: order.totalAmount.toString(),
        total_items: order.totalItems,
        order_items: enrichedOrderItems,
        created_at: createdAt, // Order placed date
        updated_at: updatedAt, // Delivery/pickup date (when it becomes a sale)
        design_files: []
      });

      branchOrderCounts.set(
        order.pickupLocation,
        (branchOrderCounts.get(order.pickupLocation) || 0) + 1
      );
    }
    
    totalOrders += ordersForDate.length;
    currentDate.setDate(currentDate.getDate() + 1);
    
    // Progress update every 3 months
    if (currentDate.getDate() === 1 && currentDate.getMonth() % 3 === 0) {
      console.log(`   Generated ${totalOrders} orders up to ${currentDate.toLocaleDateString()}...`);
    }
  }
  
  // Calculate unique customers used in orders
  const uniqueCustomerIds = new Set(allOrders.map(o => o.user_id));
  const uniqueCustomerCount = uniqueCustomerIds.size;
  
  console.log(`\n👥 Customer accounts summary:`);
  console.log(`   - Customers created on-demand: ${onDemandCreatedCount}`);
  console.log(`   - Total unique customers with orders: ${uniqueCustomerCount}`);
  console.log(`   - Average orders per customer: ${(totalOrders / uniqueCustomerCount).toFixed(2)}`);
  
  // Calculate jersey production statistics
  const totalJerseys = allOrders.reduce((sum, o) => sum + o.total_items, 0);
  const totalRevenue = allOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
  const totalMonths = ((endDate.getFullYear() - startDate.getFullYear()) * 12) + (endDate.getMonth() - startDate.getMonth()) + 1;
  const avgJerseysPerMonth = Math.round(totalJerseys / totalMonths);
  const avgOrdersPerMonth = Math.round(totalOrders / totalMonths);
  const avgJerseysPerOrder = (totalJerseys / totalOrders).toFixed(1);
  
  console.log(`\n✅ Generated ${totalOrders} orders over 3 years`);
  console.log(`👕 Total jerseys produced: ${totalJerseys.toLocaleString()}`);
  console.log(`📊 Average orders per month: ${avgOrdersPerMonth}`);
  console.log(`👕 Average jerseys per month: ${avgJerseysPerMonth}`);
  console.log(`📦 Average jerseys per order: ${avgJerseysPerOrder}`);
  console.log(`📈 Total revenue: ₱${totalRevenue.toLocaleString()}\n`);
  
  // Insert orders in batches
  console.log('💾 Inserting orders into database...');
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < allOrders.length; i += batchSize) {
    const batch = allOrders.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('orders')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Error inserting batch ${Math.ceil(i / batchSize)}:`, error.message);
      // Try inserting one by one to identify problematic records
      for (const order of batch) {
        const { error: singleError } = await supabase
          .from('orders')
          .insert(order);
        if (singleError) {
          console.error(`   Failed order: ${order.order_number}`, singleError.message);
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
      if (inserted % 500 === 0 || inserted === allOrders.length) {
        console.log(`   ✅ Inserted ${inserted}/${allOrders.length} orders (${Math.round(inserted / allOrders.length * 100)}%)`);
      }
    }
  }
  
  // Calculate final statistics
  const finalTotalJerseys = allOrders.slice(0, inserted).reduce((sum, o) => sum + o.total_items, 0);
  const finalTotalRevenue = allOrders.slice(0, inserted).reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
  
  console.log(`\n🎉 Successfully inserted ${inserted} orders!`);
  console.log('📈 Order history generation complete!');
  console.log('\n📊 Summary:');
  console.log(`   - Total Orders: ${inserted}`);
  console.log(`   - Total Jerseys: ${finalTotalJerseys.toLocaleString()}`);
  console.log(`   - Average Jerseys/Month: ${Math.round(finalTotalJerseys / totalMonths)}`);
  console.log(`   - Average Orders/Month: ${Math.round(inserted / totalMonths)}`);
  console.log(`   - Average Jerseys/Order: ${(finalTotalJerseys / inserted).toFixed(1)}`);
  console.log(`   - Total Revenue: ₱${finalTotalRevenue.toLocaleString()}`);
  console.log(`   - Total Unique Customers: ${uniqueCustomerCount}`);
  console.log(`   - Average Spend per Customer: ₱${(finalTotalRevenue / uniqueCustomerCount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
  const sortedBranchCounts = Array.from(branchOrderCounts.entries()).sort((a, b) => b[1] - a[1]);
  if (sortedBranchCounts.length) {
    console.log('   - Branch Order Distribution:');
    sortedBranchCounts.forEach(([name, count]) => {
      console.log(`     • ${name}: ${count} orders`);
    });
  }
  
  console.log('\n✅ All customer accounts have at least one order (created on-demand).');

  console.log(`   - Date Range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
}

generateAndInsertData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

