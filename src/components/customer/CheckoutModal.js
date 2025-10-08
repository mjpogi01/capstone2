import React, { useState, useEffect } from 'react';
import { FaTimes, FaTruck, FaUsers, FaChevronDown } from 'react-icons/fa';
import userService from '../../services/userService';
import './CheckoutModal.css';

const CheckoutModal = ({ isOpen, onClose, cartItems, onPlaceOrder }) => {
  const [deliveryAddress, setDeliveryAddress] = useState({
    address: 'Santa Rita Aplaya Batangas City, Batangas',
    receiver: 'Mark Daniel M. Cusi',
    phone: '+63 9123 456 789'
  });
  
  const [hasAddress, setHasAddress] = useState(false); // Check if user has address in database
  const [showAddressForm, setShowAddressForm] = useState(true);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    province: '',
    city: '',
    barangay: '',
    postalCode: '',
    streetAddress: ''
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [selectedLocationData, setSelectedLocationData] = useState({
    province: '',
    city: '',
    barangay: ''
  });
  
  const [shippingMethod, setShippingMethod] = useState('pickup');
  const [selectedLocation, setSelectedLocation] = useState('BATANGAS CITY');
  const [orderNotes, setOrderNotes] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // API-based location data
  const [locationData, setLocationData] = useState({
    regions: [],
    provinces: {},
    cities: {},
    barangays: {}
  });
  const [loading, setLoading] = useState(false);

  // Check for user address when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Checkout modal opened');
      checkUserAddress();
      fetchRegions();
    }
  }, [isOpen]);

  // Debug effect to log data changes
  useEffect(() => {
    console.log('Location data updated:', locationData);
    console.log('Regions count:', locationData.regions.length);
  }, [locationData]);

  if (!isOpen) return null;

  const locations = [
    'MAIN (SAN PASCUAL)',
    'MUZON',
    'ROSARIO',
    'BATANGAS CITY',
    'PINAMALAYAN',
    'CALACA',
    'LEMERY',
    'CALAPAN',
    'BAUAN'
  ];

  // Comprehensive fallback data functions
  const getFallbackProvinces = (regionName) => {
    const fallbackData = {
      'NCR (National Capital Region)': [
        { id: 'NCR_MANILA', name: 'Manila' },
        { id: 'NCR_QUEZON', name: 'Quezon City' },
        { id: 'NCR_CALOOCAN', name: 'Caloocan' },
        { id: 'NCR_LAS_PINAS', name: 'Las Piñas' },
        { id: 'NCR_MAKATI', name: 'Makati' },
        { id: 'NCR_MALABON', name: 'Malabon' },
        { id: 'NCR_MANDALUYONG', name: 'Mandaluyong' },
        { id: 'NCR_MARIKINA', name: 'Marikina' },
        { id: 'NCR_MUNTINLUPA', name: 'Muntinlupa' },
        { id: 'NCR_NAVOTAS', name: 'Navotas' },
        { id: 'NCR_PARANAQUE', name: 'Parañaque' },
        { id: 'NCR_PASAY', name: 'Pasay' },
        { id: 'NCR_PATEROS', name: 'Pateros' },
        { id: 'NCR_SAN_JUAN', name: 'San Juan' },
        { id: 'NCR_TAGUIG', name: 'Taguig' },
        { id: 'NCR_VALENZUELA', name: 'Valenzuela' }
      ],
      'Region I (Ilocos Region)': [
        { id: 'ILOCOS_NORTE', name: 'Ilocos Norte' },
        { id: 'ILOCOS_SUR', name: 'Ilocos Sur' },
        { id: 'LA_UNION', name: 'La Union' },
        { id: 'PANGASINAN', name: 'Pangasinan' }
      ],
      'Region II (Cagayan Valley)': [
        { id: 'BATANES', name: 'Batanes' },
        { id: 'CAGAYAN', name: 'Cagayan' },
        { id: 'ISABELA', name: 'Isabela' },
        { id: 'NUEVA_VIZCAYA', name: 'Nueva Vizcaya' },
        { id: 'QUIRINO', name: 'Quirino' }
      ],
      'Region III (Central Luzon)': [
        { id: 'AURORA', name: 'Aurora' },
        { id: 'BATAAN', name: 'Bataan' },
        { id: 'BULACAN', name: 'Bulacan' },
        { id: 'NUEVA_ECIJA', name: 'Nueva Ecija' },
        { id: 'PAMPANGA', name: 'Pampanga' },
        { id: 'TARLAC', name: 'Tarlac' },
        { id: 'ZAMBALES', name: 'Zambales' }
      ],
      'Region IV-A (CALABARZON)': [
        { id: 'BATANGAS', name: 'Batangas' },
        { id: 'CAVITE', name: 'Cavite' },
        { id: 'LAGUNA', name: 'Laguna' },
        { id: 'QUEZON', name: 'Quezon' },
        { id: 'RIZAL', name: 'Rizal' }
      ],
      'Region IV-B (MIMAROPA)': [
        { id: 'MARINDUQUE', name: 'Marinduque' },
        { id: 'OCCIDENTAL_MINDORO', name: 'Occidental Mindoro' },
        { id: 'ORIENTAL_MINDORO', name: 'Oriental Mindoro' },
        { id: 'PALAWAN', name: 'Palawan' },
        { id: 'ROMBLON', name: 'Romblon' }
      ],
      'Region V (Bicol Region)': [
        { id: 'ALBAY', name: 'Albay' },
        { id: 'CAMARINES_NORTE', name: 'Camarines Norte' },
        { id: 'CAMARINES_SUR', name: 'Camarines Sur' },
        { id: 'CATANDUANES', name: 'Catanduanes' },
        { id: 'MASBATE', name: 'Masbate' },
        { id: 'SORSOGON', name: 'Sorsogon' }
      ],
      'Region VI (Western Visayas)': [
        { id: 'AKLAN', name: 'Aklan' },
        { id: 'ANTIQUE', name: 'Antique' },
        { id: 'CAPIZ', name: 'Capiz' },
        { id: 'GUIMARAS', name: 'Guimaras' },
        { id: 'ILOILO', name: 'Iloilo' },
        { id: 'NEGROS_OCCIDENTAL', name: 'Negros Occidental' }
      ],
      'Region VII (Central Visayas)': [
        { id: 'BOHOL', name: 'Bohol' },
        { id: 'CEBU', name: 'Cebu' },
        { id: 'NEGROS_ORIENTAL', name: 'Negros Oriental' },
        { id: 'SIQUIJOR', name: 'Siquijor' }
      ],
      'Region VIII (Eastern Visayas)': [
        { id: 'BILIRAN', name: 'Biliran' },
        { id: 'EASTERN_SAMAR', name: 'Eastern Samar' },
        { id: 'LEYTE', name: 'Leyte' },
        { id: 'NORTHERN_SAMAR', name: 'Northern Samar' },
        { id: 'SAMAR', name: 'Samar' },
        { id: 'SOUTHERN_LEYTE', name: 'Southern Leyte' }
      ],
      'Region IX (Zamboanga Peninsula)': [
        { id: 'ZAMBOANGA_DEL_NORTE', name: 'Zamboanga del Norte' },
        { id: 'ZAMBOANGA_DEL_SUR', name: 'Zamboanga del Sur' },
        { id: 'ZAMBOANGA_SIBUGAY', name: 'Zamboanga Sibugay' }
      ],
      'Region X (Northern Mindanao)': [
        { id: 'BUKIDNON', name: 'Bukidnon' },
        { id: 'CAMIGUIN', name: 'Camiguin' },
        { id: 'LANAO_DEL_NORTE', name: 'Lanao del Norte' },
        { id: 'MISAMIS_OCCIDENTAL', name: 'Misamis Occidental' },
        { id: 'MISAMIS_ORIENTAL', name: 'Misamis Oriental' }
      ],
      'Region XI (Davao Region)': [
        { id: 'DAVAO_DEL_NORTE', name: 'Davao del Norte' },
        { id: 'DAVAO_DEL_SUR', name: 'Davao del Sur' },
        { id: 'DAVAO_OCCIDENTAL', name: 'Davao Occidental' },
        { id: 'DAVAO_ORIENTAL', name: 'Davao Oriental' },
        { id: 'DAVAO_DE_ORO', name: 'Davao de Oro' }
      ],
      'Region XII (SOCCSKSARGEN)': [
        { id: 'COTABATO', name: 'Cotabato' },
        { id: 'SARANGANI', name: 'Sarangani' },
        { id: 'SOUTH_COTABATO', name: 'South Cotabato' },
        { id: 'SULTAN_KUDARAT', name: 'Sultan Kudarat' }
      ],
      'Region XIII (Caraga)': [
        { id: 'AGUSAN_DEL_NORTE', name: 'Agusan del Norte' },
        { id: 'AGUSAN_DEL_SUR', name: 'Agusan del Sur' },
        { id: 'DINAGAT_ISLANDS', name: 'Dinagat Islands' },
        { id: 'SURIGAO_DEL_NORTE', name: 'Surigao del Norte' },
        { id: 'SURIGAO_DEL_SUR', name: 'Surigao del Sur' }
      ],
      'BARMM (Bangsamoro Autonomous Region)': [
        { id: 'BASILAN', name: 'Basilan' },
        { id: 'LANAO_DEL_SUR', name: 'Lanao del Sur' },
        { id: 'MAGUINDANAO', name: 'Maguindanao' },
        { id: 'SULU', name: 'Sulu' },
        { id: 'TAWI_TAWI', name: 'Tawi-Tawi' }
      ]
    };
    return fallbackData[regionName] || [];
  };

  const getFallbackCities = (provinceName) => {
    const fallbackData = {
      'Batangas': [
        { id: 'BATANGAS_CITY', name: 'Batangas City' },
        { id: 'LIPA_CITY', name: 'Lipa City' },
        { id: 'TANAUAN_CITY', name: 'Tanauan City' },
        { id: 'SANTA_ROSA', name: 'Santa Rosa' },
        { id: 'SAN_PASCUAL', name: 'San Pascual' },
        { id: 'LEMERY', name: 'Lemery' },
        { id: 'TAAL', name: 'Taal' },
        { id: 'BALAYAN', name: 'Balayan' },
        { id: 'CALACA', name: 'Calaca' },
        { id: 'CALATAGAN', name: 'Calatagan' },
        { id: 'CUENCA', name: 'Cuenca' },
        { id: 'IBAAN', name: 'Ibaan' },
        { id: 'LAUREL', name: 'Laurel' },
        { id: 'LOBO', name: 'Lobo' },
        { id: 'MABINI', name: 'Mabini' },
        { id: 'MALVAR', name: 'Malvar' },
        { id: 'MATAAS_NA_KAHAY', name: 'Mataas na Kahoy' },
        { id: 'NASUGBU', name: 'Nasugbu' },
        { id: 'PADRE_GARCIA', name: 'Padre Garcia' },
        { id: 'ROSARIO', name: 'Rosario' },
        { id: 'SAN_JOSE', name: 'San Jose' },
        { id: 'SAN_JUAN', name: 'San Juan' },
        { id: 'SAN_LUIS', name: 'San Luis' },
        { id: 'SAN_NICOLAS', name: 'San Nicolas' },
        { id: 'SAN_PASCUAL_2', name: 'San Pascual' },
        { id: 'SAN_TERESITA', name: 'San Teresita' },
        { id: 'SANTO_TOMAS', name: 'Santo Tomas' },
        { id: 'TAYSAN', name: 'Taysan' },
        { id: 'TINGLOY', name: 'Tingloy' },
        { id: 'TUY', name: 'Tuy' }
      ],
      'Manila': [
        { id: 'MANILA_BINONDO', name: 'Binondo' },
        { id: 'MANILA_QUIAPO', name: 'Quiapo' },
        { id: 'MANILA_SAMPALOC', name: 'Sampaloc' },
        { id: 'MANILA_SAN_MIGUEL', name: 'San Miguel' },
        { id: 'MANILA_ERMITA', name: 'Ermita' },
        { id: 'MANILA_INTRAMUROS', name: 'Intramuros' },
        { id: 'MANILA_MALATE', name: 'Malate' },
        { id: 'MANILA_PACO', name: 'Paco' },
        { id: 'MANILA_PANDACAN', name: 'Pandacan' },
        { id: 'MANILA_PORT_AREA', name: 'Port Area' },
        { id: 'MANILA_SANTA_ANA', name: 'Santa Ana' },
        { id: 'MANILA_SANTA_CRUZ', name: 'Santa Cruz' },
        { id: 'MANILA_SANTA_MESA', name: 'Santa Mesa' },
        { id: 'MANILA_TONDO', name: 'Tondo' }
      ],
      'Quezon City': [
        { id: 'QC_DILIMAN', name: 'Diliman' },
        { id: 'QC_COMMONWEALTH', name: 'Commonwealth' },
        { id: 'QC_NOVALICHES', name: 'Novaliches' },
        { id: 'QC_CUBAO', name: 'Cubao' },
        { id: 'QC_KAMUNING', name: 'Kamuning' },
        { id: 'QC_QUEZON_AVE', name: 'Quezon Avenue' },
        { id: 'QC_EAST_AVE', name: 'East Avenue' },
        { id: 'QC_WEST_AVE', name: 'West Avenue' },
        { id: 'QC_TIMOG', name: 'Timog' },
        { id: 'QC_MAGINSAYSAY', name: 'Magsaysay' }
      ],
      'Cebu': [
        { id: 'CEBU_CITY', name: 'Cebu City' },
        { id: 'LAPU_LAPU', name: 'Lapu-Lapu City' },
        { id: 'MANDAUE', name: 'Mandaue City' },
        { id: 'TALISAY', name: 'Talisay City' },
        { id: 'TOLEDO', name: 'Toledo City' },
        { id: 'DANAO', name: 'Danao City' },
        { id: 'BOGO', name: 'Bogo City' },
        { id: 'CARCAR', name: 'Carcar City' },
        { id: 'NAGA', name: 'Naga City' },
        { id: 'BALAMBAN', name: 'Balamban' }
      ],
      'Davao del Sur': [
        { id: 'DAVAO_CITY', name: 'Davao City' },
        { id: 'DIGOS', name: 'Digos City' },
        { id: 'MATI', name: 'Mati City' },
        { id: 'SANTA_CRUZ', name: 'Santa Cruz' },
        { id: 'BANSALAN', name: 'Bansalan' },
        { id: 'HAGONOY', name: 'Hagonoy' },
        { id: 'KIBLAWAN', name: 'Kiblawan' },
        { id: 'MAGSAYSAY', name: 'Magsaysay' },
        { id: 'MALALAG', name: 'Malalag' },
        { id: 'PADADA', name: 'Padada' }
      ],
      'Cavite': [
        { id: 'CAVITE_CITY', name: 'Cavite City' },
        { id: 'DASMARINAS', name: 'Dasmarinas' },
        { id: 'IMUS', name: 'Imus' },
        { id: 'TRECE_MARTIRES', name: 'Trece Martires' },
        { id: 'BACOOR', name: 'Bacoor' },
        { id: 'GENERAL_TRIAS', name: 'General Trias' },
        { id: 'SILANG', name: 'Silang' },
        { id: 'ALFONSO', name: 'Alfonso' },
        { id: 'AMADEO', name: 'Amadeo' },
        { id: 'CARMONA', name: 'Carmona' },
        { id: 'GENERAL_EMILIO_AGUINALDO', name: 'General Emilio Aguinaldo' },
        { id: 'GENERAL_MARIANO_ALVAREZ', name: 'General Mariano Alvarez' },
        { id: 'GENERAL_TRIAS', name: 'General Trias' },
        { id: 'INDANG', name: 'Indang' },
        { id: 'KAWIT', name: 'Kawit' },
        { id: 'MAGALLANES', name: 'Magallanes' },
        { id: 'MARAGONDON', name: 'Maragondon' },
        { id: 'MENDEZ', name: 'Mendez' },
        { id: 'NAIC', name: 'Naic' },
        { id: 'NOVELETA', name: 'Noveleta' },
        { id: 'ROSARIO_CAVITE', name: 'Rosario' },
        { id: 'TAGAYTAY', name: 'Tagaytay' },
        { id: 'TANZA', name: 'Tanza' },
        { id: 'TERNATE', name: 'Ternate' }
      ],
      'Laguna': [
        { id: 'CALAMBA', name: 'Calamba' },
        { id: 'SAN_PEDRO', name: 'San Pedro' },
        { id: 'BIÑAN', name: 'Biñan' },
        { id: 'SANTA_ROSA_LAGUNA', name: 'Santa Rosa' },
        { id: 'LOS_BAÑOS', name: 'Los Baños' },
        { id: 'CABUYAO', name: 'Cabuyao' },
        { id: 'ALAMINOS', name: 'Alaminos' },
        { id: 'BAY', name: 'Bay' },
        { id: 'CALAUAN', name: 'Calauan' },
        { id: 'CAVINTI', name: 'Cavinti' },
        { id: 'FAMY', name: 'Famy' },
        { id: 'KALAYAAN', name: 'Kalayaan' },
        { id: 'LILIW', name: 'Liliw' },
        { id: 'LONGOS', name: 'Longos' },
        { id: 'LUISIANA', name: 'Luisiana' },
        { id: 'LUMBAN', name: 'Lumban' },
        { id: 'MABITAC', name: 'Mabitac' },
        { id: 'MAGDALENA', name: 'Magdalena' },
        { id: 'MAJAYJAY', name: 'Majayjay' },
        { id: 'NAGCARLAN', name: 'Nagcarlan' },
        { id: 'PAETE', name: 'Paete' },
        { id: 'PAGSANJAN', name: 'Pagsanjan' },
        { id: 'PAKIL', name: 'Pakil' },
        { id: 'PANGIL', name: 'Pangil' },
        { id: 'PILA', name: 'Pila' },
        { id: 'RIZAL_LAGUNA', name: 'Rizal' },
        { id: 'SAN_PABLO', name: 'San Pablo' },
        { id: 'SANTA_CRUZ', name: 'Santa Cruz' },
        { id: 'SANTA_MARIA', name: 'Santa Maria' },
        { id: 'SINILOAN', name: 'Siniloan' },
        { id: 'VICTORIA', name: 'Victoria' }
      ],
      'Quezon': [
        { id: 'LUCENA', name: 'Lucena City' },
        { id: 'TAYABAS', name: 'Tayabas' },
        { id: 'AGDANGAN', name: 'Agdangan' },
        { id: 'ALABAT', name: 'Alabat' },
        { id: 'ATIMONAN', name: 'Atimonan' },
        { id: 'BUENAVISTA', name: 'Buenavista' },
        { id: 'BURDEOS', name: 'Burdeos' },
        { id: 'CALAUAG', name: 'Calauag' },
        { id: 'CANDELARIA', name: 'Candelaria' },
        { id: 'CATANAUAN', name: 'Catanauan' },
        { id: 'DOLORES', name: 'Dolores' },
        { id: 'GENERAL_LUNA', name: 'General Luna' },
        { id: 'GENERAL_NAKAR', name: 'General Nakar' },
        { id: 'GUINAYANGAN', name: 'Guinayangan' },
        { id: 'GUMACA', name: 'Gumaca' },
        { id: 'INFANTA', name: 'Infanta' },
        { id: 'JOMALIG', name: 'Jomalig' },
        { id: 'LOPEZ', name: 'Lopez' },
        { id: 'LUCBAN', name: 'Lucban' },
        { id: 'MACALELON', name: 'Macalelon' },
        { id: 'MAUBAN', name: 'Mauban' },
        { id: 'MULANAY', name: 'Mulanay' },
        { id: 'PADRE_BURGOS', name: 'Padre Burgos' },
        { id: 'PAGBILAO', name: 'Pagbilao' },
        { id: 'PANUKULAN', name: 'Panukulan' },
        { id: 'PATNANUNGAN', name: 'Patnanungan' },
        { id: 'PEREZ', name: 'Perez' },
        { id: 'PITOGO', name: 'Pitogo' },
        { id: 'PLARIDEL', name: 'Plaridel' },
        { id: 'POLILLO', name: 'Polillo' },
        { id: 'QUEZON', name: 'Quezon' },
        { id: 'REAL', name: 'Real' },
        { id: 'SAMPALOC', name: 'Sampaloc' },
        { id: 'SAN_ANDRES', name: 'San Andres' },
        { id: 'SAN_ANTONIO', name: 'San Antonio' },
        { id: 'SAN_FRANCISCO', name: 'San Francisco' },
        { id: 'SAN_NARCISO', name: 'San Narciso' },
        { id: 'SARIAYA', name: 'Sariaya' },
        { id: 'TAGKAWAYAN', name: 'Tagkawayan' },
        { id: 'TIAONG', name: 'Tiaong' },
        { id: 'UNISAN', name: 'Unisan' }
      ],
      'Rizal': [
        { id: 'ANTIPOLO', name: 'Antipolo' },
        { id: 'ANGONO', name: 'Angono' },
        { id: 'BINANGONAN', name: 'Binangonan' },
        { id: 'CAINTA', name: 'Cainta' },
        { id: 'CARDONA', name: 'Cardona' },
        { id: 'JALA_JALA', name: 'Jala-Jala' },
        { id: 'MORONG', name: 'Morong' },
        { id: 'PILILLA', name: 'Pililla' },
        { id: 'RODRIGUEZ', name: 'Rodriguez' },
        { id: 'SAN_MATEO', name: 'San Mateo' },
        { id: 'TANAY', name: 'Tanay' },
        { id: 'TAYTAY', name: 'Taytay' },
        { id: 'TERESA', name: 'Teresa' }
      ]
    };
    return fallbackData[provinceName] || [];
  };

  const getFallbackBarangays = (cityName) => {
    const fallbackData = {
      'Batangas City': [
        { id: 'BATANGAS_CITY_POBLACION', name: 'Poblacion' },
        { id: 'BATANGAS_CITY_BALAGTAS', name: 'Balagtas' },
        { id: 'BATANGAS_CITY_BALAYAN', name: 'Balayan' },
        { id: 'BATANGAS_CITY_BALITE', name: 'Balite' },
        { id: 'BATANGAS_CITY_BANABA', name: 'Banaba' },
        { id: 'BATANGAS_CITY_BARANGAY_1', name: 'Barangay 1' },
        { id: 'BATANGAS_CITY_BARANGAY_2', name: 'Barangay 2' },
        { id: 'BATANGAS_CITY_BARANGAY_3', name: 'Barangay 3' },
        { id: 'BATANGAS_CITY_BARANGAY_4', name: 'Barangay 4' },
        { id: 'BATANGAS_CITY_BARANGAY_5', name: 'Barangay 5' },
        { id: 'BATANGAS_CITY_BARANGAY_6', name: 'Barangay 6' },
        { id: 'BATANGAS_CITY_BARANGAY_7', name: 'Barangay 7' },
        { id: 'BATANGAS_CITY_BARANGAY_8', name: 'Barangay 8' },
        { id: 'BATANGAS_CITY_BARANGAY_9', name: 'Barangay 9' },
        { id: 'BATANGAS_CITY_BARANGAY_10', name: 'Barangay 10' }
      ],
      'Lipa City': [
        { id: 'LIPA_POBLACION', name: 'Poblacion' },
        { id: 'LIPA_ANILAO', name: 'Anilao' },
        { id: 'LIPA_BAGONG_POOK', name: 'Bagong Pook' },
        { id: 'LIPA_BALINTAGAW', name: 'Balintagaw' },
        { id: 'LIPA_BANAYBANAY', name: 'Banaybanay' },
        { id: 'LIPA_BULACNIN', name: 'Bulacnin' },
        { id: 'LIPA_CALAMIAS', name: 'Calamias' },
        { id: 'LIPA_CALAMBA', name: 'Calamba' },
        { id: 'LIPA_CANLUBANG', name: 'Canlubang' },
        { id: 'LIPA_CARMEN', name: 'Carmen' },
        { id: 'LIPA_CAVITE', name: 'Cavite' },
        { id: 'LIPA_DAGATAN', name: 'Dagatan' },
        { id: 'LIPA_DARO', name: 'Daro' },
        { id: 'LIPA_EMILIO', name: 'Emilio' },
        { id: 'LIPA_GULOD', name: 'Gulod' }
      ],
      'Manila': [
        { id: 'MANILA_BINONDO', name: 'Binondo' },
        { id: 'MANILA_QUIAPO', name: 'Quiapo' },
        { id: 'MANILA_SAMPALOC', name: 'Sampaloc' },
        { id: 'MANILA_SAN_MIGUEL', name: 'San Miguel' },
        { id: 'MANILA_ERMITA', name: 'Ermita' },
        { id: 'MANILA_INTRAMUROS', name: 'Intramuros' },
        { id: 'MANILA_MALATE', name: 'Malate' },
        { id: 'MANILA_PACO', name: 'Paco' },
        { id: 'MANILA_PANDACAN', name: 'Pandacan' },
        { id: 'MANILA_PORT_AREA', name: 'Port Area' },
        { id: 'MANILA_SANTA_ANA', name: 'Santa Ana' },
        { id: 'MANILA_SANTA_CRUZ', name: 'Santa Cruz' },
        { id: 'MANILA_SANTA_MESA', name: 'Santa Mesa' },
        { id: 'MANILA_TONDO', name: 'Tondo' }
      ],
      'Cebu City': [
        { id: 'CEBU_ADLAON', name: 'Adlaon' },
        { id: 'CEBU_AGUS', name: 'Agus' },
        { id: 'CEBU_APAS', name: 'Apas' },
        { id: 'CEBU_BACAYAN', name: 'Bacayan' },
        { id: 'CEBU_BANILAD', name: 'Banilad' },
        { id: 'CEBU_BASAK_PARDO', name: 'Basak Pardo' },
        { id: 'CEBU_BASAK_SAN_NICOLAS', name: 'Basak San Nicolas' },
        { id: 'CEBU_BUSAY', name: 'Busay' },
        { id: 'CEBU_CALAMBA', name: 'Calamba' },
        { id: 'CEBU_CAMPO_SANTO', name: 'Campo Santo' },
        { id: 'CEBU_CAPITOL_SITE', name: 'Capitol Site' },
        { id: 'CEBU_CARBON', name: 'Carbon' },
        { id: 'CEBU_CARRELL', name: 'Carrell' },
        { id: 'CEBU_CENTRAL', name: 'Central' },
        { id: 'CEBU_CENTRO', name: 'Centro' }
      ],
      'Davao City': [
        { id: 'DAVAO_ACACIA', name: 'Acacia' },
        { id: 'DAVAO_AGDAO', name: 'Agdao' },
        { id: 'DAVAO_ALAMINOS', name: 'Alaminos' },
        { id: 'DAVAO_ALANG_ALANG', name: 'Alang-alang' },
        { id: 'DAVAO_ALBANY', name: 'Albany' },
        { id: 'DAVAO_ALFONSO_ANG', name: 'Alfonso Ang' },
        { id: 'DAVAO_ALFREDO_QUINTOS', name: 'Alfredo Quintos' },
        { id: 'DAVAO_ALFREDO_QUINTOS_2', name: 'Alfredo Quintos 2' },
        { id: 'DAVAO_ALFREDO_QUINTOS_3', name: 'Alfredo Quintos 3' },
        { id: 'DAVAO_ALFREDO_QUINTOS_4', name: 'Alfredo Quintos 4' },
        { id: 'DAVAO_ALFREDO_QUINTOS_5', name: 'Alfredo Quintos 5' },
        { id: 'DAVAO_ALFREDO_QUINTOS_6', name: 'Alfredo Quintos 6' },
        { id: 'DAVAO_ALFREDO_QUINTOS_7', name: 'Alfredo Quintos 7' },
        { id: 'DAVAO_ALFREDO_QUINTOS_8', name: 'Alfredo Quintos 8' },
        { id: 'DAVAO_ALFREDO_QUINTOS_9', name: 'Alfredo Quintos 9' }
      ]
    };
    return fallbackData[cityName] || [];
  };

  // Fetch regions from API
  const fetchRegions = async () => {
    try {
      setLoading(true);
      console.log('Fetching regions...');
      
      // Try multiple reliable APIs in order of preference
      const apiEndpoints = [
        {
          url: 'https://api.jsonbin.io/v3/b/65f8b8b21f5677401f3c4a2b',
          name: 'jsonbin-philippines'
        },
        {
          url: 'https://api.allorigins.win/raw?url=https://raw.githubusercontent.com/ajhalili2006/Philippines-Region-City-Municipality-Barangay-Master-Data/master/regions.json',
          name: 'allorigins-github'
        },
        {
          url: 'https://api.codetabs.com/v1/proxy?quest=https://raw.githubusercontent.com/ajbarbosa/Philippines-API/master/regions.json',
          name: 'codetabs-github'
        },
        {
          url: 'https://corsproxy.io/?https://raw.githubusercontent.com/ajhalili2006/Philippines-Region-City-Municipality-Barangay-Master-Data/master/regions.json',
          name: 'corsproxy-github'
        }
      ];
      
      let regions = [];
      let apiUsed = '';
      
      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying API: ${endpoint.name}`);
          const response = await fetch(endpoint.url);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Success with API: ${endpoint.name}`, data);
            
            // Process different data structures
            if (Array.isArray(data)) {
              regions = data.map((region, index) => ({
                id: region.id || region.region_id || region.code || index + 1,
                name: region.name || region.region_name || region.regionName || region
              }));
            } else if (data && typeof data === 'object') {
              regions = Object.values(data).map((region, index) => ({
                id: region.id || region.region_id || region.code || index + 1,
                name: region.name || region.region_name || region.regionName || region
              }));
            }
            
            if (regions.length > 0) {
              apiUsed = endpoint.name;
              break;
            }
          }
        } catch (apiError) {
          console.log(`API ${endpoint.name} failed:`, apiError);
          continue;
        }
      }
      
      if (regions.length > 0) {
        console.log(`Using ${apiUsed} API with ${regions.length} regions`);
        setLocationData(prev => ({
        ...prev,
          regions: regions
        }));
      } else {
        console.log('All APIs failed, using fallback data');
        // Use fallback data immediately
        setLocationData(prev => ({
          ...prev,
          regions: [
            { id: 'NCR', name: 'NCR (National Capital Region)' },
            { id: 'REGION_I', name: 'Region I (Ilocos Region)' },
            { id: 'REGION_II', name: 'Region II (Cagayan Valley)' },
            { id: 'REGION_III', name: 'Region III (Central Luzon)' },
            { id: 'REGION_IV_A', name: 'Region IV-A (CALABARZON)' },
            { id: 'REGION_IV_B', name: 'Region IV-B (MIMAROPA)' },
            { id: 'REGION_V', name: 'Region V (Bicol Region)' },
            { id: 'REGION_VI', name: 'Region VI (Western Visayas)' },
            { id: 'REGION_VII', name: 'Region VII (Central Visayas)' },
            { id: 'REGION_VIII', name: 'Region VIII (Eastern Visayas)' },
            { id: 'REGION_IX', name: 'Region IX (Zamboanga Peninsula)' },
            { id: 'REGION_X', name: 'Region X (Northern Mindanao)' },
            { id: 'REGION_XI', name: 'Region XI (Davao Region)' },
            { id: 'REGION_XII', name: 'Region XII (SOCCSKSARGEN)' },
            { id: 'REGION_XIII', name: 'Region XIII (Caraga)' },
            { id: 'BARMM', name: 'BARMM (Bangsamoro Autonomous Region)' }
          ]
        }));
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
      console.log('Using fallback data due to error');
      // Comprehensive fallback - all major regions
      setLocationData(prev => ({
        ...prev,
        regions: [
          { id: 'NCR', name: 'NCR (National Capital Region)' },
          { id: 'REGION_I', name: 'Region I (Ilocos Region)' },
          { id: 'REGION_II', name: 'Region II (Cagayan Valley)' },
          { id: 'REGION_III', name: 'Region III (Central Luzon)' },
          { id: 'REGION_IV_A', name: 'Region IV-A (CALABARZON)' },
          { id: 'REGION_IV_B', name: 'Region IV-B (MIMAROPA)' },
          { id: 'REGION_V', name: 'Region V (Bicol Region)' },
          { id: 'REGION_VI', name: 'Region VI (Western Visayas)' },
          { id: 'REGION_VII', name: 'Region VII (Central Visayas)' },
          { id: 'REGION_VIII', name: 'Region VIII (Eastern Visayas)' },
          { id: 'REGION_IX', name: 'Region IX (Zamboanga Peninsula)' },
          { id: 'REGION_X', name: 'Region X (Northern Mindanao)' },
          { id: 'REGION_XI', name: 'Region XI (Davao Region)' },
          { id: 'REGION_XII', name: 'Region XII (SOCCSKSARGEN)' },
          { id: 'REGION_XIII', name: 'Region XIII (Caraga)' },
          { id: 'BARMM', name: 'BARMM (Bangsamoro Autonomous Region)' }
        ]
      }));
    } finally {
      setLoading(false);
    }
  };

  // Fetch provinces for a region
  const fetchProvinces = async (regionName) => {
    try {
      console.log('Fetching provinces for region:', regionName);
      
      const apiEndpoints = [
        {
          url: 'https://raw.githubusercontent.com/ajhalili2006/Philippines-Region-City-Municipality-Barangay-Master-Data/master/provinces.json',
          name: 'ajhalili2006'
        },
        {
          url: 'https://raw.githubusercontent.com/ajbarbosa/Philippines-API/master/provinces.json',
          name: 'ajbarbosa'
        }
      ];
      
      let provinces = [];
      let apiUsed = '';
      
      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying provinces API: ${endpoint.name}`);
          const response = await fetch(endpoint.url);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Provinces API response from ${endpoint.name}:`, data);
            
            // Filter provinces by region with multiple possible field names
            const regionProvinces = data.filter(province => {
              const regionField = province.region_name || province.region || province.regionName || province.region_code;
              return regionField === regionName || 
                     regionField === regionName.replace(' (National Capital Region)', '') ||
                     regionField === regionName.replace('Region IV-A (CALABARZON)', 'CALABARZON') ||
                     regionField === regionName.replace('Region III (Central Luzon)', 'Central Luzon');
            });
            
            console.log(`Found ${regionProvinces.length} provinces for ${regionName}`);
            
            if (regionProvinces.length > 0) {
              provinces = regionProvinces.map(province => ({
                id: province.id || province.province_id || province.code,
                name: province.name || province.province_name || province.provinceName
              }));
              apiUsed = endpoint.name;
              break;
            }
          }
        } catch (apiError) {
          console.log(`Provinces API ${endpoint.name} failed:`, apiError);
          continue;
        }
      }
      
      if (provinces.length > 0) {
        console.log(`Using ${apiUsed} API with ${provinces.length} provinces for ${regionName}`);
        setLocationData(prev => ({
          ...prev,
          provinces: {
            ...prev.provinces,
            [regionName]: provinces
          }
        }));
      } else {
        console.log(`No provinces found for ${regionName}, using fallback data`);
        // Use fallback data immediately
        const fallbackProvinces = getFallbackProvinces(regionName);
        setLocationData(prev => ({
          ...prev,
          provinces: {
            ...prev.provinces,
            [regionName]: fallbackProvinces
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
      console.log(`Using fallback data for ${regionName}`);
      // Always use fallback data
      const fallbackProvinces = getFallbackProvinces(regionName);
      setLocationData(prev => ({
        ...prev,
        provinces: {
          ...prev.provinces,
          [regionName]: fallbackProvinces
        }
      }));
    }
  };

  // Fetch cities for a province
  const fetchCities = async (provinceName) => {
    try {
      console.log('Fetching cities for province:', provinceName);
      
      const apiEndpoints = [
        {
          url: 'https://raw.githubusercontent.com/ajhalili2006/Philippines-Region-City-Municipality-Barangay-Master-Data/master/cities.json',
          name: 'ajhalili2006'
        },
        {
          url: 'https://raw.githubusercontent.com/ajbarbosa/Philippines-API/master/cities.json',
          name: 'ajbarbosa'
        }
      ];
      
      let cities = [];
      let apiUsed = '';
      
      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying cities API: ${endpoint.name}`);
          const response = await fetch(endpoint.url);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Cities API response from ${endpoint.name}:`, data);
            
            // Filter cities by province with multiple possible field names
            const provinceCities = data.filter(city => {
              const provinceField = city.province_name || city.province || city.provinceName || city.province_code;
              return provinceField === provinceName || 
                     provinceField === provinceName.replace(' City', '') ||
                     provinceField === provinceName.replace(' Province', '');
            });
            
            console.log(`Found ${provinceCities.length} cities for ${provinceName}`);
            
            if (provinceCities.length > 0) {
              cities = provinceCities.map(city => ({
                id: city.id || city.city_id || city.code,
                name: city.name || city.city_name || city.cityName
              }));
              apiUsed = endpoint.name;
              break;
            }
          }
        } catch (apiError) {
          console.log(`Cities API ${endpoint.name} failed:`, apiError);
          continue;
        }
      }
      
      if (cities.length > 0) {
        console.log(`Using ${apiUsed} API with ${cities.length} cities for ${provinceName}`);
        setLocationData(prev => ({
          ...prev,
          cities: {
            ...prev.cities,
            [provinceName]: cities
          }
        }));
      } else {
        console.log(`No cities found for ${provinceName}, using fallback data`);
        // Use fallback data immediately
        const fallbackCities = getFallbackCities(provinceName);
        setLocationData(prev => ({
          ...prev,
          cities: {
            ...prev.cities,
            [provinceName]: fallbackCities
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      console.log(`Using fallback data for ${provinceName}`);
      // Always use fallback data
      const fallbackCities = getFallbackCities(provinceName);
      setLocationData(prev => ({
        ...prev,
        cities: {
          ...prev.cities,
          [provinceName]: fallbackCities
        }
      }));
    }
  };

  // Fetch barangays for a city
  const fetchBarangays = async (cityName) => {
    try {
      console.log('Fetching barangays for city:', cityName);
      
      const apiEndpoints = [
        {
          url: 'https://raw.githubusercontent.com/ajhalili2006/Philippines-Region-City-Municipality-Barangay-Master-Data/master/barangays.json',
          name: 'ajhalili2006'
        },
        {
          url: 'https://raw.githubusercontent.com/ajbarbosa/Philippines-API/master/barangays.json',
          name: 'ajbarbosa'
        }
      ];
      
      let barangays = [];
      let apiUsed = '';
      
      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying barangays API: ${endpoint.name}`);
          const response = await fetch(endpoint.url);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Barangays API response from ${endpoint.name}:`, data);
            
            // Filter barangays by city with multiple possible field names
            const cityBarangays = data.filter(barangay => {
              const cityField = barangay.city_name || barangay.city || barangay.cityName || barangay.city_code;
              return cityField === cityName || 
                     cityField === cityName.replace(' City', '') ||
                     cityField === cityField.replace(' Municipality', '');
            });
            
            console.log(`Found ${cityBarangays.length} barangays for ${cityName}`);
            
            if (cityBarangays.length > 0) {
              barangays = cityBarangays.map(barangay => ({
                id: barangay.id || barangay.barangay_id || barangay.code,
                name: barangay.name || barangay.barangay_name || barangay.barangayName
              }));
              apiUsed = endpoint.name;
              break;
            }
          }
        } catch (apiError) {
          console.log(`Barangays API ${endpoint.name} failed:`, apiError);
          continue;
        }
      }
      
      if (barangays.length > 0) {
        console.log(`Using ${apiUsed} API with ${barangays.length} barangays for ${cityName}`);
        setLocationData(prev => ({
          ...prev,
          barangays: {
            ...prev.barangays,
            [cityName]: barangays
          }
        }));
      } else {
        console.log(`No barangays found for ${cityName}, using fallback data`);
        // Use fallback data immediately
        const fallbackBarangays = getFallbackBarangays(cityName);
        setLocationData(prev => ({
          ...prev,
          barangays: {
            ...prev.barangays,
            [cityName]: fallbackBarangays
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching barangays:', error);
      console.log(`Using fallback data for ${cityName}`);
      // Always use fallback data
      const fallbackBarangays = getFallbackBarangays(cityName);
      setLocationData(prev => ({
        ...prev,
        barangays: {
          ...prev.barangays,
          [cityName]: fallbackBarangays
        }
      }));
    }
  };

  const totalAmount = cartItems.reduce((total, item) => {
    return total + (parseFloat(item.price) * item.quantity);
  }, 0);

  const totalItems = cartItems.reduce((total, item) => {
    return total + item.quantity;
  }, 0);

  const handlePlaceOrder = () => {
    const orderData = {
      deliveryAddress,
      shippingMethod,
      selectedLocation,
      orderNotes,
      items: cartItems,
      totalAmount,
      totalItems,
      orderDate: new Date().toISOString()
    };
    
    onPlaceOrder(orderData);
    onClose();
  };


  // Check if user has address from database
  const checkUserAddress = async () => {
    try {
      const addressData = await userService.getUserAddress();
      if (addressData && addressData.address) {
        setDeliveryAddress({
          address: addressData.address,
          receiver: addressData.fullName,
          phone: addressData.phone
        });
        setHasAddress(true);
        setShowAddressForm(false);
      } else {
        setHasAddress(false);
        setShowAddressForm(true);
      }
    } catch (error) {
      console.log('No address found or error:', error.message);
      setHasAddress(false);
      setShowAddressForm(true);
    }
  };

  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (addressErrors[name]) {
      setAddressErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateAddressForm = () => {
    const errors = {};
    const requiredFields = ['fullName', 'phone', 'streetAddress', 'province', 'city', 'barangay', 'postalCode'];
    
    requiredFields.forEach(field => {
      if (!newAddress[field] || newAddress[field].trim() === '') {
        errors[field] = 'This field is required';
      }
    });
    
    // Phone validation
    if (newAddress.phone && !/^[\d\s\-\+\(\)]+$/.test(newAddress.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAddress = async () => {
    if (validateAddressForm()) {
      try {
        // Save address to database
        const addressData = {
          fullName: newAddress.fullName,
          phone: newAddress.phone,
          streetAddress: newAddress.streetAddress,
          barangay: newAddress.barangay,
          city: newAddress.city,
          province: newAddress.province,
          postalCode: newAddress.postalCode,
          address: `${newAddress.streetAddress}, ${newAddress.barangay}, ${newAddress.city}, ${newAddress.province} ${newAddress.postalCode}`
        };

        await userService.saveUserAddress(addressData);
        
        // Update local state
        setDeliveryAddress({
          receiver: newAddress.fullName,
          phone: newAddress.phone,
          address: addressData.address
        });
        setHasAddress(true);
        setShowAddressForm(false);
        
        console.log('Address saved to database:', addressData);
      } catch (error) {
        console.error('Failed to save address:', error.message);
        alert('Failed to save address. Please try again.');
      }
    }
  };

  const handleLocationSelect = (type, value) => {
    setSelectedLocationData(prev => ({
      ...prev,
      [type]: value,
      // Reset dependent fields when parent changes
      ...(type === 'region' && { province: '', city: '', barangay: '' }),
      ...(type === 'province' && { city: '', barangay: '' }),
      ...(type === 'city' && { barangay: '' })
    }));
    
    // Update the address form
    setNewAddress(prev => ({
      ...prev,
      [type]: value
    }));

    // Fetch data based on selection
    if (type === 'region') {
      fetchProvinces(value);
    } else if (type === 'province') {
      fetchCities(value);
    } else if (type === 'city') {
      fetchBarangays(value);
    }
  };

  const getLocationDisplayText = () => {
    const { region, province, city, barangay } = selectedLocationData;
    if (!region) return 'Region, Province, City, Barangay';
    
    const parts = [region, province, city, barangay].filter(Boolean);
    return parts.join(', ') || 'Region, Province, City, Barangay';
  };

  // Debug function to check data
  const debugLocationData = () => {
    console.log('Location Data:', locationData);
    console.log('Regions count:', locationData.regions.length);
    console.log('Selected location data:', selectedLocationData);
    console.log('Show location selector:', showLocationSelector);
  };

  const handleChangeAddress = () => {
    setShowAddressForm(true);
    // Reset form with current address data
    setNewAddress({
      fullName: deliveryAddress.receiver || '',
      phone: deliveryAddress.phone || '',
      streetAddress: '',
      barangay: '',
      city: '',
      province: '',
      postalCode: ''
    });
  };

  return (
    <div className="checkout-modal-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="checkout-close-button" onClick={onClose}>
          <FaTimes />
        </button>

        {/* Header */}
        <div className="checkout-header">
          <h1>CHECKOUT</h1>
          <button 
            onClick={debugLocationData}
            style={{
              position: 'absolute',
              top: '20px',
              right: '60px',
              background: '#ff6b6b',
              color: '#fff',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Debug
          </button>
        </div>

        {/* Delivery Address Section */}
        <div className="checkout-section">
          <div className="section-header">
            <h2>DELIVERY ADDRESS</h2>
          </div>
          
          {showAddressForm ? (
            /* Address Input Form */
            <div className="address-form">
              <div className="form-header">
                <h3>Address</h3>
        </div>
              
              <div className="address-form-fields">
        <div className="form-group">
          <input
            type="text"
                    name="fullName"
                    value={newAddress.fullName}
                    onChange={handleAddressInputChange}
                    className={addressErrors.fullName ? 'error' : ''}
                    placeholder="Full Name"
                  />
                  {addressErrors.fullName && (
                    <span className="error-message">{addressErrors.fullName}</span>
          )}
        </div>
                
        <div className="form-group">
          <input
            type="tel"
            name="phone"
                    value={newAddress.phone}
                    onChange={handleAddressInputChange}
                    className={addressErrors.phone ? 'error' : ''}
                    placeholder="Phone Number"
                  />
                  {addressErrors.phone && (
                    <span className="error-message">{addressErrors.phone}</span>
          )}
        </div>
                
        <div className="form-group">
          <input
                    type="text" 
                    name="province" 
                    value={newAddress.province} 
                    onChange={handleAddressInputChange} 
                    className={addressErrors.province ? 'error' : ''} 
                    placeholder="Province (e.g., Batangas, Cavite)" 
                  />
                  {addressErrors.province && (<span className="error-message">{addressErrors.province}</span>)}
        </div>
        <div className="form-group">
          <input
            type="text"
                    name="city" 
                    value={newAddress.city} 
                    onChange={handleAddressInputChange} 
                    className={addressErrors.city ? 'error' : ''} 
                    placeholder="City/Municipality (e.g., Batangas City, Lipa City)" 
                  />
                  {addressErrors.city && (<span className="error-message">{addressErrors.city}</span>)}
        </div>
        <div className="form-group">
          <input
            type="text"
                    name="barangay" 
                    value={newAddress.barangay} 
                    onChange={handleAddressInputChange} 
                    className={addressErrors.barangay ? 'error' : ''} 
                    placeholder="Barangay (e.g., Poblacion, Balagtas)" 
                  />
                  {addressErrors.barangay && (<span className="error-message">{addressErrors.barangay}</span>)}
        </div>
                
        <div className="form-group">
          <input
            type="text"
                    name="postalCode"
                    value={newAddress.postalCode}
                    onChange={handleAddressInputChange}
                    className={addressErrors.postalCode ? 'error' : ''}
                    placeholder="Postal Code"
                  />
                  {addressErrors.postalCode && (
                    <span className="error-message">{addressErrors.postalCode}</span>
          )}
        </div>
                
        <div className="form-group">
          <input
            type="text"
                    name="streetAddress"
                    value={newAddress.streetAddress}
                    onChange={handleAddressInputChange}
                    className={addressErrors.streetAddress ? 'error' : ''}
                    placeholder="Street Name, Building, House No."
                  />
                  {addressErrors.streetAddress && (
                    <span className="error-message">{addressErrors.streetAddress}</span>
          )}
        </div>
      </div>
              
              <div className="form-actions">
                <button className="save-address-btn" onClick={handleSaveAddress}>
                  Save Address & Continue
                </button>
    </div>
            </div>
          ) : (
            /* Existing Address Display */
            <div className="address-card">
              <div className="address-card-content">
                <div className="address-header">
                  <div className="location-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <div className="receiver-info">
                    <div className="receiver-name">{deliveryAddress.receiver}</div>
                    <div className="receiver-phone">{deliveryAddress.phone}</div>
                  </div>
                  <div className="address-chevron" onClick={handleChangeAddress}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                  </div>
                </div>
                <div className="address-details">
                  <div className="address-line">{deliveryAddress.address}</div>
                </div>
              </div>
            </div>
          )}
    </div>

        {/* Products Ordered Section */}
        <div className="checkout-section products-section">
          <div className="section-header">
            <h2>PRODUCTS ORDERED</h2>
      </div>
          <div className="products-table">
            <div className="table-header">
              <div className="header-item">ITEM</div>
              <div className="header-price">PRICE</div>
              <div className="header-quantity">QUANTITY</div>
              <div className="header-total">TOTAL PRICE</div>
    </div>
        {cartItems.map((item, index) => (
              <div key={index} className="table-row">
                <div className="item-cell">
            <div className="item-image">
              {item.main_image ? (
                <img src={item.main_image} alt={item.name} />
              ) : (
                <div className="placeholder-image">🏀</div>
              )}
            </div>
            <div className="item-details">
                    <div className="item-name">{item.name}</div>
                    <div className="item-description">{item.description || 'High-quality sportswear'}</div>
                    {item.isTeamOrder && (
                      <div className="team-order-indicator">
                        <FaUsers className="team-icon" />
                        <span>Team Orders</span>
                        <FaChevronDown className="dropdown-icon" />
                </div>
              )}
                </div>
                </div>
                <div className="price-cell">₱ {parseFloat(item.price).toFixed(2)}</div>
                <div className="quantity-cell">{item.quantity}</div>
                <div className="total-cell">₱ {(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>
      </div>
      
        {/* Shipping Options and Notes */}
        <div className="checkout-section">
          <div className="shipping-notes-container">
            {/* Shipping Options */}
            <div className="shipping-options">
              <div className="section-header">
                <h2>SHIPPING OPTIONS</h2>
      </div>
              <div className="shipping-methods">
                <label className="shipping-option">
              <input
                type="radio"
                    name="shipping"
                    value="pickup"
                    checked={shippingMethod === 'pickup'}
                    onChange={(e) => setShippingMethod(e.target.value)}
                  />
                  <span className="checkmark"></span>
                  <span className="option-text">PICK UP</span>
            </label>
                
                <div className="location-grid">
                  {locations.map((location, index) => (
                    <label key={index} className="location-option">
              <input
                type="radio"
                        name="location"
                        value={location}
                        checked={selectedLocation === location}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                      />
                      <span className="checkmark"></span>
                      <span className="location-text">{location}</span>
            </label>
                  ))}
                </div>

                <label className="shipping-option">
              <input
                type="radio"
                    name="shipping"
                    value="cod"
                    checked={shippingMethod === 'cod'}
                    onChange={(e) => setShippingMethod(e.target.value)}
                  />
                  <span className="checkmark"></span>
                  <span className="option-text">CASH ON DELIVERY</span>
            </label>
          </div>
        </div>
        
            {/* Notes Section */}
            <div className="notes-section">
              <div className="section-header">
                <h2>NOTES/MESSAGE TO YOHANNS :</h2>
          </div>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Please Leave A Message ....."
                className="notes-textarea"
              />
          </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="checkout-section">
        <div className="order-summary">
          <div className="summary-row">
              <span>MERCHANDISE SUBTOTAL:</span>
              <span>₱ {totalAmount.toFixed(2)}</span>
        </div>
          <div className="summary-row">
              <span>SHIPPING SUBTOTAL:</span>
              <span>₱ 0</span>
          </div>
            <div className="summary-total">
              <span>Total Payment ({totalItems} Items):</span>
              <span className="total-amount">₱ {totalAmount.toFixed(2)}</span>
          </div>
            <button className="place-order-btn" onClick={handlePlaceOrder}>
              PLACE ORDER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;