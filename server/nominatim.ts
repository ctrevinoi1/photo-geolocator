import type { ReverseGeocoding, NominatimAddress } from "@shared/schema";

interface NominatimResponse {
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  lat: string;
  lon: string;
  type?: string;
  osm_type?: string;
}

export async function validateAndEnrichLocation(
  latitude: number,
  longitude: number,
  predictedCountry?: string
): Promise<ReverseGeocoding | null> {
  try {
    console.log(`[Nominatim] Reverse geocoding coordinates: ${latitude}, ${longitude}`);
    
    // OpenStreetMap Nominatim reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`,
      {
        headers: {
          'User-Agent': 'photo-geolocator/1.0 (Educational Project)',
          'Accept-Language': 'en'
        }
      }
    );

    if (!response.ok) {
      console.error(`[Nominatim] API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: NominatimResponse = await response.json();
    
    // Parse address components
    const address: NominatimAddress = {
      houseNumber: data.address.house_number,
      road: data.address.road,
      neighbourhood: data.address.neighbourhood,
      suburb: data.address.suburb,
      city: data.address.city || data.address.town || data.address.village,
      county: data.address.county,
      state: data.address.state,
      postcode: data.address.postcode,
      country: data.address.country,
      countryCode: data.address.country_code?.toUpperCase(),
    };

    // Validate location
    let isValid = true;
    let validationNotes: string | undefined;

    // Check if coordinates are in ocean/water (comprehensive water body detection)
    const waterBodyTypes = ['sea', 'ocean', 'water', 'bay', 'reservoir', 'lake', 'river', 'pond', 'wetland', 'canal'];
    if (data.type && waterBodyTypes.includes(data.type.toLowerCase())) {
      isValid = false;
      validationNotes = 'Coordinates appear to be in water body';
    }

    // Validate against predicted country if available
    if (predictedCountry && address.country) {
      const countryMatch = address.country.toLowerCase() === predictedCountry.toLowerCase();
      if (!countryMatch) {
        isValid = false;
        validationNotes = validationNotes 
          ? `${validationNotes}; Country mismatch (predicted: ${predictedCountry}, actual: ${address.country})`
          : `Country mismatch (predicted: ${predictedCountry}, actual: ${address.country})`;
      }
    }

    console.log(`[Nominatim] Resolved address: ${data.display_name}`);
    console.log(`[Nominatim] Validation: ${isValid ? 'Valid' : 'Invalid'} ${validationNotes ? `(${validationNotes})` : ''}`);

    return {
      displayName: data.display_name,
      address,
      isValid,
      validationNotes,
    };

  } catch (error) {
    console.error('[Nominatim] Reverse geocoding failed:', error);
    return null;
  }
}

// Rate limiting helper - Nominatim allows 1 request per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

export async function rateLimitedValidateAndEnrich(
  latitude: number,
  longitude: number,
  predictedCountry?: string
): Promise<ReverseGeocoding | null> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`[Nominatim] Rate limiting: waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
  return validateAndEnrichLocation(latitude, longitude, predictedCountry);
}
