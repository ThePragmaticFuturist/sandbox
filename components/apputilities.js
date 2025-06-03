//apputilities.j
import { Platform } from 'react-native';
import * as Location from 'expo-location';

const accessDatabase = async (content) => {
    const dynamoUrl = Platform.OS === 'ios' 
    ? "https://n9mwutp811.execute-api.us-east-1.amazonaws.com/data"
    : "https://n9mwutp811.execute-api.us-east-1.amazonaws.com/data";

    const response = await fetch(dynamoUrl, 
    {
        method: "POST",
        body: JSON.stringify(content),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });

    const result = await response.json();
    
    if (result.message) {
        return [];
    } else if (result && result.result && result.result.Responses) {
        return result.result.Responses; 
    } else if (result && result.result && result.result.Items) {
        return result.result.Items;
    }
      
    return [];
}; 

const getImageSource = (imageBuffer) => {
  // If no image is provided, return default image
  if (!imageBuffer) {
    return require('../assets/images/adaptive-icon.png'); // Make sure this image exists in your assets
  }

  // Handle require() cases (numeric values)
  if (typeof imageBuffer === 'number') {
    return imageBuffer;
  }

  // Handle string cases (URLs or local paths)
  if (typeof imageBuffer === 'string') {
    if (imageBuffer.length < 2) {
      return require('../assets/images/adaptive-icon.png'); // Make sure this image exists in your assets
    }
    
    // Handle remote URLs
    if (imageBuffer.startsWith('http://') || imageBuffer.startsWith('https://')) {
      return { uri: imageBuffer };
    }
    
    // Handle local file paths
    return { uri: imageBuffer };
  }

  // If none of the above, return default image
  return require('../assets/images/adaptive-icon.png'); // Make sure this image exists in your assets
};

////////////////////////////////////////////////////////

// Convert date from form (MM/DD/YYYY) to DynamoDB format (YYYY-MM-DD)
function formToDynamoDB(dateString) {
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Convert date from DynamoDB format (YYYY-MM-DD) to form format (MM/DD/YYYY)
function dynamoDBToForm(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
}

// Convert date object to DynamoDB format (YYYY-MM-DD)
function dateToDynamoDB(date) {
    return date.toISOString().split('T')[0];
}

// Convert DynamoDB format (YYYY-MM-DD) to Date object
function dynamoDBToDate(dateString) {
    return new Date(dateString);
}

// Convert DynamoDB format (YYYY-MM-DD) to display format (MM/DD/YYYY)
function dynamoDBToDisplay(dateString) {
    //console.log("dateString", dateString);

    const [year, month, day] = dateString.split('-');
    const monthIndex = parseInt(month, 10) - 1; // Adjust for 0-indexed months
    const date = new Date(year, monthIndex, day);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
}

// Convert display format (MM/DD/YYYY) to DynamoDB format (YYYY-MM-DD)
function displayToDynamoDB(dateString) {
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function dynamoDBToDateObject(dateString) {
    // Validate the input format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }
    
    // Split the date string into components
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Create a new Date object
    // Note: month is 0-indexed in JavaScript Date, so we subtract 1
    const date = new Date(year, month - 1, day);
    
    // Validate the resulting date
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
    }
    
    return date;
}

////////////////////////////////////////////////////////

// Validate Date of Birth
const validateDOB = (dob) => {
  //console.log("dob", dob);

  const dobDate = dynamoDBToDateObject(dob);

  //console.log("dobDate", dobDate);

  if (!dobDate) return false;

  const minDate = new Date();

  const delta = minDate.getFullYear() - 21;

  //console.log("delta", delta);

  minDate.setFullYear(delta);

  //console.log("minDate", minDate);

  return (dobDate <= minDate);
};

const getOperatingHours = () => {
    const tDay = new Date();
    let dayOfTheWeekOpen = tDay.getDay();
    let dayOfTheWeekClose = dayOfTheWeekOpen;
    let timeOfDay = tDay.getHours();

    if (timeOfDay < 6) {
      dayOfTheWeekOpen--;
      if (dayOfTheWeekOpen < 0) {
        dayOfTheWeekOpen = 6;
      }
    }

    const openDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfTheWeekOpen];
    const closeDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfTheWeekClose];

    return { openDay: openDay, closeDay: closeDay }
};

const validateEmail = (emaildata) => {
    //console.log(emaildata);

    if (typeof emaildata !== 'string'){
        return "";
    }

    emaildata = emaildata.toLowerCase().trim();
    
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    //console.log(emaildata);

    if (regex.test(emaildata)){
      return emaildata;
    } 

    return "";
};

const validateUSZipCode = (zipCode) => {
// Define a regular expression pattern for a valid US ZIP code
    if (zipCode && zipCode !== undefined){
    	const regex = /^\d{5}(?:-\d{4})?$/;

    	// Check if the ZIP code matches the regular expression pattern
    	if (regex.test(zipCode)){
          console.log(zipCode);
    	  return zipCode;
    	} 
    }

	return "";
};

const mapToken = Platform.OS === 'ios' 
  ? "###"
  : "###";

const getLatLong = async (zipcode) => {
    try {
        // Construct the Geocoding API URL
        const geocodingApiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${zipcode}&key=${mapToken}`;

        // Make an API request
        const response = await fetch(geocodingApiUrl);
        const data = await response.json();

        console.log(zipcode, data);

        // Check if the response contains results
        if (data.results.length > 0) {
            // Extract latitude and longitude
            const latitude = data.results[0].geometry.location.lat;
            const longitude = data.results[0].geometry.location.lng;

            return {lat:latitude, long:longitude}
        } else {
            return false
        }
    } catch (error) {
        console.log('Error:', error);
    }
};

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function haversine(lat1, lon1, lat2, lon2) {
    var R = 3959; // Radius of the Earth in miles
    var lat1_radians = toRadians(lat1);
    var lat2_radians = toRadians(lat2);
    var delta_lat = toRadians(lat2 - lat1);
    var delta_lon = toRadians(lon2 - lon1);

    var a = Math.sin(delta_lat / 2) * Math.sin(delta_lat / 2) +
            Math.cos(lat1_radians) * Math.cos(lat2_radians) *
            Math.sin(delta_lon / 2) * Math.sin(delta_lon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    var distance = R * c; // Distance in miles
    return distance;
};

const checkDistance = (lat, lon, barLocation, radius) => {
    const distance = haversine(lat, lon, barLocation.latitude, barLocation.longitude);
    //console.log('distance', distance);
    return distance <= radius;
};

const checkProximity = async (thisBar, profileData) => {
  //console.log('checkProximity', JSON.stringify(thisBar, null, 2));
  
  const barLocation = {
    latitude: parseFloat(thisBar[0].lat),
    longitude: parseFloat(thisBar[0].long)
  };

  // Check base location
  //console.log('local');
  if (checkDistance(parseFloat(profileData.lat), parseFloat(profileData.long), barLocation,  profileData.radius)) {
    return true;
  }

  // Check travel location if available
  //console.log('travel');
  if (profileData.travelzip && profileData.travelzip.length > 1) {
    if (checkDistance(parseFloat(profileData.travel_lat), parseFloat(profileData.travel_long), barLocation,  profileData.radius)) {
      return true;
    }
  }

  // Check current location
  //console.log('current');
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      //console.log('Permission to access location was denied');
      return false;
    }

    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return checkDistance(location.coords.latitude, location.coords.longitude, barLocation,  profileData.radius);
  } catch (error) {
    console.error("Error getting geolocation:", error);
    return false;
  }
};

const newUserData = {
  "origination": "0",
  "email": "",
  "gender": "none",
  "lastname": "",
  "password": "",
  "zipcode": "",
  "travelzip": "",
  "radius": '5',
  // "mobile": "",
  "notifications": true,
  "notificationtoken": "",
  "notify_count": 0,
  "dob": dateToDynamoDB(new Date()),
  "firstname": "",
  "sms": true,
  "lat": "",
  "registration": "",
  "long": "",
  "patron-id": "",
  "photo": "",
  "agecheck": false,
  "citizencheck": false,
  "tccheck": false,
  "location": false,
  "travel_lat": null,
  "travel_long": null,
};

export {
  newUserData,
  accessDatabase,
  validateEmail,
  validateUSZipCode,
  validateDOB,
  getLatLong,
  mapToken,
  getOperatingHours,
  getImageSource,
  checkProximity,
  haversine,
  formToDynamoDB,
  dynamoDBToForm,
  dateToDynamoDB,
  dynamoDBToDate,
  dynamoDBToDisplay,
  displayToDynamoDB,
  dynamoDBToDateObject 
}
