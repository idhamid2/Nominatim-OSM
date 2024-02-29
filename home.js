var poiDisplay = true;
var geocodingDisplay = routingDisplay = false;
var reverseGeocodeApiResult; // variable used to store the result after API response
var routingCoord1, routingCoord2 // variables used to store the coordinates for the routing path.
var startMarker = endMarker = L.marker(); // variable used to store the marker for routing
var routingPath = L.geoJSON(); // variable used to store the routing path
var routingProfileValue = "driving-car"; // variable used to store the routing profile for getting directions 
var locationLat, locationLng; // variables used to store location lat & lng for getting POI data via API
// var transportPoiLayer, educationPoiLayer, fuelPoiLayer, medicalPoiLayer; // variables used to store their repective POI layers





var map = L.map('map').setView([50.80926, 7.149998], 13);

var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);



new Autocomplete("search", {
    selectFirst: true,
    insertToInput: true,
    cache: true,
    howManyCharacters: 2,
    // onSearch
    onSearch: ({
        currentValue
    }) => {
        // api
        const api = `https://nominatim.openstreetmap.org/search?format=geojson&limit=10&q=${encodeURI(
        currentValue
      )}`;
        return new Promise((resolve) => {
            fetch(api)
                .then((response) => response.json())
                .then((data) => {
                    resolve(data.features);
                })
                .catch((error) => {
                    console.error(error);
                });
        });
    },

    // nominatim GeoJSON format
    onResults: ({
        currentValue,
        matches,
        template
    }) => {
        const regex = new RegExp(currentValue, "gi");

        // if the result returns 0 we
        // show the no results element
        return matches === 0 ?
            template :
            matches
            .map((element) => {
                return `
                  <li>
                    <p>
                      ${element.properties.display_name.replace(
                        regex,
                        (str) => `<b>${str}</b>`
                      )}
                    </p>
                  </li> `;
            })
            .join("");
    },

    onSubmit: ({
        object

    }) => {
        const {
            display_name
        } = object.properties;
        const [lng, lat] = object.geometry.coordinates;
        routingCoord1 = [lng, lat];

        // custom id for marker
        if (!routingDisplay) {
            var marker = L.marker([lat, lng], {
                title: display_name,
            });
            // remove all layers from the map
            map.eachLayer(function (layer) {
                if (!!layer.toGeoJSON) {
                    map.removeLayer(layer);
                }
            });
            marker.addTo(map).bindPopup(display_name);
        } else {
            if (map.hasLayer(startMarker)) {
                map.removeLayer(startMarker);
            }
            var startIcon = new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });


            startMarker = L.marker([lat, lng], {
                title: display_name,
                icon: startIcon,
            });

            startMarker.addTo(map).bindPopup(display_name);
        }

        map.setView([lat, lng], 15);
        //getPOIData(lng, lat);
        if (poiDisplay) {
            //alert('POII');
            locationLat = lat;
            locationLng = lng;
            requestPOIData('foodPOIValue');

        } else if (geocodingDisplay) {
            console.log('Getting the Coordinates for the Searched Address via API and Display the data in form of tables');
            showAddressTableData(object);
        }

    },

    noResults: ({
            currentValue,
            template
        }) =>
        template(`<li>No results found: "${currentValue}"</li>`),
});

// --------------------------------------------------

// following Nomiantaim places search will be used only for Routing

new Autocomplete("search2", {
    selectFirst: true,
    insertToInput: true,
    cache: true,
    howManyCharacters: 2,
    // onSearch
    onSearch: ({
        currentValue
    }) => {
        // api
        const api = `https://nominatim.openstreetmap.org/search?format=geojson&limit=10&q=${encodeURI(
        currentValue
      )}`;
        return new Promise((resolve) => {
            fetch(api)
                .then((response) => response.json())
                .then((data) => {
                    resolve(data.features);
                })
                .catch((error) => {
                    console.error(error);
                });
        });
    },

    // nominatim GeoJSON format
    onResults: ({
        currentValue,
        matches,
        template
    }) => {
        const regex = new RegExp(currentValue, "gi");

        // if the result returns 0 we
        // show the no results element
        return matches === 0 ?
            template :
            matches
            .map((element) => {
                return `
                  <li>
                    <p>
                      ${element.properties.display_name.replace(
                        regex,
                        (str) => `<b>${str}</b>`
                      )}
                    </p>
                  </li> `;
            })
            .join("");
    },

    onSubmit: ({
        object

    }) => {

        const {
            display_name
        } = object.properties;
        const [lng, lat] = object.geometry.coordinates;
        routingCoord2 = [lng, lat];


        var endIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        if (map.hasLayer(endMarker)) {
            map.removeLayer(endMarker);
        }
        // custom id for marker
        endMarker = L.marker([lat, lng], {
            title: display_name,
            icon: endIcon,
        });

        endMarker.addTo(map).bindPopup(display_name);
        map.setView([lat, lng], 15);
    },

    noResults: ({
            currentValue,
            template
        }) =>
        template(`<li>No results found: "${currentValue}"</li>`),
});

// --------------------------------------------------



function requestPOIData(poiValue) {

    if(poiValue == "foodPOIValue"){
        urlPart = 'node["amenity"~ "fast_food|cafes"](around:500,' + locationLat + "," + locationLng + ');'
        getPOIData(urlPart, 'foodPoiLayer');   
    }
    else if(poiValue == "transportPoiValue"){
        urlPart = '(node["amenity"~ "bus_station"](around:500,' + locationLat + "," + locationLng + ');'+
        'node["public_transport"~ "stop_position|station"](around:500,' + locationLat + "," + locationLng + '););'
        getPOIData(urlPart, 'transportPoiLayer');   
    }
    else if(poiValue == "educationPoiValue"){
        urlPart = '(node["amenity"~ "school|university|kindergarten|college"](around:500,' + locationLat + "," + locationLng + ');'+
        'node["buidling"~ "college"](around:500,' + locationLat + "," + locationLng + '););'
        getPOIData(urlPart, 'educationPoiLayer');   
    }
    else if(poiValue == "medicalPoiValue"){
        urlPart = '(node["amenity"~ "hospital|clinic"](around:500,' + locationLat + "," + locationLng + ');'+
        'node["buidling"~ "hospital"](around:500,' + locationLat + "," + locationLng + '););'
        getPOIData(urlPart, 'medicalPoiLayer');   
    }

} // end of requestPOIData function

function getPOIData(urlPart, poiLayerName){
    var apiData;
    $.ajax({
        url:
            'https://www.overpass-api.de/api/interpreter?data=' + 
            '[out:json][timeout:4000];' + 
            urlPart +
            'out;', 
        dataType: 'json',
        type: 'GET',
        async: true,
        crossDomain: true
    }).done(function(data) {
        console.log( "Data has been received from Overpass API" );
        apiData = osmtogeojson(data);
        addData(apiData,poiLayerName);
        // L.geoJSON(foodPoiLayer).addTo(map);
        
        
    }).fail(function(error) {
        console.log(error);
        console.log( "error" );
    }).always(function() {
        console.log( "complete" );
    });  

}





// setting the markers for different POI data types
var hotelIcon = L.AwesomeMarkers.icon({
    prefix: 'fa', //font awesome rather than bootstrap
    markerColor: 'red', // see colors above
    icon: 'hotel', //http://fortawesome.github.io/Font-Awesome/icons/

});

var busStationIcon = L.AwesomeMarkers.icon({
    prefix: 'fa', //font awesome rather than bootstrap
    markerColor: 'skyblue', // see colors above
    icon: 'bus', //http://fortawesome.github.io/Font-Awesome/icons/

});


var foodIcon = L.AwesomeMarkers.icon({
    prefix: 'fa', //font awesome rather than bootstrap
    markerColor: 'cadetblue', // see colors above
    icon: 'utensils', //http://fortawesome.github.io/Font-Awesome/icons/

});

var educationIcon = L.AwesomeMarkers.icon({
    prefix: 'fa', //font awesome rather than bootstrap
    markerColor: 'darkgreen', // see colors above
    icon: 'university', //http://fortawesome.github.io/Font-Awesome/icons/

});

var medicalIcon = L.AwesomeMarkers.icon({
    prefix: 'fa', //font awesome rather than bootstrap
    markerColor: 'darkblue', // see colors above
    icon: "house-medical" //http://fortawesome.github.io/Font-Awesome/icons/

});


// Cluster Marker layer for every Single POI-Category

var foodPoiLayer = L.markerClusterGroup({
    maxClusterRadius: 80,    
    iconCreateFunction: function  (cluster){
        return L.AwesomeMarkers.icon({
            prefix: 'fa', //font awesome rather than bootstrap
            markerColor: 'cadetblue', // see colors above
            icon: 'utensils',//http://fortawesome.github.io/Font-Awesome/icons/ 
            html : cluster.getChildCount(),
        });
    }
});



var transportPoiLayer = L.markerClusterGroup({
    maxClusterRadius: 80,    
    iconCreateFunction: function  (cluster){
        return L.AwesomeMarkers.icon({
            prefix: 'fa', //font awesome rather than bootstrap
            markerColor: 'skyblue', // see colors above
            icon: 'bus',//http://fortawesome.github.io/Font-Awesome/icons/ 
            html : cluster.getChildCount(),
        });
    }
});

var educationPoiLayer = L.markerClusterGroup({
    maxClusterRadius: 80,    
    iconCreateFunction: function  (cluster){
        return L.AwesomeMarkers.icon({
            prefix: 'fa', //font awesome rather than bootstrap
            markerColor: 'darkgreen', // see colors above
            icon: 'university', //http://fortawesome.github.io/Font-Awesome/icons/
            html : cluster.getChildCount(),
        
        });
    }
});


var medicalPoiLayer = L.markerClusterGroup({
    maxClusterRadius: 80,    
    iconCreateFunction: function  (cluster){
        return L.AwesomeMarkers.icon({
            prefix: 'fa', //font awesome rather than bootstrap
            markerColor: 'darkblue', // see colors above
            icon: "house-medical", //http://fortawesome.github.io/Font-Awesome/icons/
            html : cluster.getChildCount(),
        });
    }
});

function addData(apiData,poiLayerName){
    var currentIcon, popupContent;

    if(poiLayerName == "foodPoiLayer"){
        currentIcon = foodIcon;
        popupContent = 'Food/Restaurent';
        addDataToLayer(apiData, foodPoiLayer, currentIcon, popupContent);


    }
    else if(poiLayerName == "transportPoiLayer"){
        currentIcon = busStationIcon;
        popupContent = 'Bus Station';
        addDataToLayer(apiData, transportPoiLayer, currentIcon, popupContent);
    }
    else if(poiLayerName == "educationPoiLayer"){
        currentIcon = educationIcon;
        popupContent = 'Education';
        addDataToLayer(apiData, educationPoiLayer, currentIcon, popupContent);
    }
    else if(poiLayerName == "medicalPoiLayer"){
        currentIcon = medicalIcon;
        popupContent = 'Medical';
        addDataToLayer(apiData, medicalPoiLayer, currentIcon, popupContent);
    }


    $("#removePOI").click(function () {
        map.removeLayer(educationPoiLayer);
        map.removeLayer(foodPoiLayer);
        map.removeLayer(transportPoiLayer);
        map.removeLayer(medicalPoiLayer);
    });

    $("#transport").click(function () {
        requestPOIData('transportPoiValue');
    });

    $("#education").click(function () {
        requestPOIData('educationPoiValue');
    });

    $("#medical").click(function () {
        requestPOIData('medicalPoiValue');
    });

    
}



function addDataToLayer(apiData, currentPoiLayer, currentIcon, popupContent){

    L.geoJSON(apiData,{
        pointToLayer: function (feature, latlng) {
            return currentPoiLayer.addLayer(L.marker(latlng, {
                icon: currentIcon
            }).on('mouseover', function () {
                this.bindPopup(popupContent).openPopup();
            }));
        }
    }).addTo(map);

}

function removePOIData() {
    map.removeLayer(educationPoiLayer);
    map.removeLayer(foodPoiLayer);
    map.removeLayer(transportPoiLayer);
    map.removeLayer(medicalPoiLayer);
}



function filterPOIData(apiData) {
    console.log('entering');

    var busStationLayer = L.geoJson(apiData, {
        filter: function (feature, layer) {
          return feature.properties.amenity == "bus_station";
         
        },
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: hotelIcon
            }).on('mouseover', function () {
                this.bindPopup("Hotel/Accomodation").openPopup();
            });
        }
    })
    
    busStationLayer.addTo(map);


    console.log(busStationLayer.getLayers().length);

    var hotelLayer = L.geoJson(apiData, {
        filter: function (feature, layer) {
          return feature.properties.amenity == "bus_station";
         
        },
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: hotelIcon
            }).on('mouseover', function () {
                this.bindPopup("Hotel/Accomodation").openPopup();
            });
        }
    })
    
    
    
    
    

    var foodLayer = L.geoJson(apiData, {
        filter: function (feature, layer) {
          return feature.properties.amenity == "fast_food";
         
        },
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: busStationIcon
            }).on('mouseover', function () {
                this.bindPopup("Hotel/Accomodation").openPopup();
            });
        }
    });
    foodLayer.addTo(map);
    console.log(foodLayer.getLayers().length);

    var schoolLayer = L.geoJson(apiData, {
        filter: function (feature, layer) {
          return feature.properties.amenity == "fast_food";
         
        },
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: schoolIcon
            }).on('mouseover', function () {
                this.bindPopup("Hotel/Accomodation").openPopup();
            });
        }
    });


    var medicalLayer = L.geoJson(apiData, {
        filter: function (feature, layer) {
          return feature.properties.amenity == "fast_food";
         
        },
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: medicalIcon
            }).on('mouseover', function () {
                this.bindPopup("Hotel/Accomodation").openPopup();
            });
        }
    });




    addPOIData(hotelLayer, foodLayer, schoolLayerCluter, medicalLayer);

    // map.fitBounds(others.getBounds(), {
    //     padding: [50, 50]
    // });

}


function addPOIData(hotelLayer, foodLayer, schoolLayerCluter, medicalLayer) {

    // addAllPOIData(hotelLayer, foodLayer, schoolLayerCluter, medicalLayer);


    $("#allPOI").click(function () {
        addAllPOIData(hotelLayer, foodLayer, schoolLayerCluter, medicalLayer);

    });

    $("#food").click(function () {
        console.log('added Food POI LAyer');
        map.addLayer(foodLayer)
        removePOIData(hotelLayer, foodLayer, schoolLayerCluter, medicalLayer)
    });

    $("#education").click(function () {
        console.log('added Education POI LAyer');
        map.addLayer(schoolLayerCluter)
        removePOIData(hotelLayer, foodLayer, schoolLayerCluter, medicalLayer)
    });

    $("#hotel").click(function () {
        console.log('added hotel POI LAyer');
        map.addLayer(hotelLayer)
        removePOIData(hotelLayer, foodLayer, schoolLayerCluter, medicalLayer)
    });
    $("#medical").click(function () {
        console.log('added medical POI LAyer');
        map.addLayer(medicalLayer)
        removePOIData(hotelLayer, foodLayer, schoolLayerCluter, medicalLayer)
    });
}


// function addAllPOIData(hotelLayer, foodLayer, schoolLayerCluter, medicalLayer) {
//     map.addLayer(hotelLayer);
//     map.addLayer(foodLayer);
//     map.addLayer(schoolLayerCluter);
//     map.addLayer(medicalLayer);
//     console.log('added all POI LAyer');
// }




$('#poi').click(function () {
    resetElements("poi");
    console.log('POI Clik');
});

$('#routing').click(function () {
    resetElements("routing");
    console.log('Routing Click');
    $('#drivingRoutingProfile').css({
        "background": "rgb(203, 224, 252)"
    }); // default select of driving routing profiel for directions 
});

$('#reverseGeocoding').click(function () {
    resetElements("reverseGeocoding");
    console.log('Rev Geo Clik');
});

$('#addressGeocoding').click(function () {
    resetElements("addressGeocoding");
    console.log('Add Click');
});

$('#drivingRoutingProfile').click(function () {
    resetRoutingProfile();
    routingProfileValue = "driving-car"
    $(this).css({
        "background": "rgb(203, 224, 252)"
    });
});
$('#walkRoutingProfile').click(function () {
    resetRoutingProfile();
    routingProfileValue = "foot-walking"
    $(this).css({
        "background": "rgb(203, 224, 252)"
    });
});
$('#cycleRoutingProfile').click(function () {
    resetRoutingProfile();
    $(this).css({
        "background": "rgb(203, 224, 252)"
    });
    routingProfileValue = "cycling-regular"
});
// function to reset the menu items or display the fields of navbar items
function resetElements(caseValue) {
    cleanMapLayers(), clearStuff();
    $('#poi').removeClass('active');
    $('#routing').removeClass('active');
    $('#placeSearchInput').hide();
    $('#poiSection').hide();
    $('#geocodingSection').removeClass('show');
    $('#reverseGeocodingInput').removeClass('show');
    $('#routingSection').removeClass('show');

    switch (caseValue) {
        case "poi":
            $('#poi').addClass('active');
            $('#placeSearchInput').show();
            $('#poiSection').show();
            routingDisplay = geocodingDisplay = false;
            poiDisplay = true;
            break;

        case "routing":
            $('#routing').addClass('active');
            $('#placeSearchInput').show();
            $('#routingSection').addClass('show');
            poiDisplay = geocodingDisplay = false;
            routingDisplay = true;
            break;

        case "addressGeocoding":
            $('#placeSearchInput').show();
            $('#geocodingSection').addClass('show');
            poiDisplay = routingDisplay = false;
            geocodingDisplay = true;
            break;

        case "reverseGeocoding":
            $('#geocodingSection').addClass('show');
            $('#reverseGeocodingInput').addClass('show');
            break;

    } // end of switch statement


} // end of resetElements function




// function to clean the search markers of the input field from the map 
function cleanMapLayers() {
    map.eachLayer(function (layer) {
        if (!!layer.toGeoJSON) {
            map.removeLayer(layer);
        }
    });
}


// function to reset the reset the color of routing proofile option
function resetRoutingProfile() {
    $('#drivingRoutingProfile').css('background', 'transparent');
    $('#walkRoutingProfile').css('background', 'transparent');
    $('#cycleRoutingProfile').css('background', 'transparent');
}


// function to show the Longitude and Latitude result in the form of table when user enters address on the map
function showAddressTableData(addressSearchData) {
    clearStuff();
    document.getElementById("tableDiv").className = 'show';

    table = document.getElementById("tbl").getElementsByTagName('tbody')[0];



    // console.log(addressSearchData);
    // document.getElementById("geocodingSection").className = 'show';

    // clearStuff();
    // document.getElementById("addressDeatilHeading").className = 'show';
    // document.getElementById("tableDiv").className = 'show';
    // table = document.getElementById("tbl").getElementsByTagName('tbody')[0];

    latitudeValue = addressSearchData.geometry.coordinates[1].toFixed(5);
    longitudeValue = addressSearchData.geometry.coordinates[0].toFixed(5);
    addressValue = addressSearchData.properties.display_name;
    propertyType = addressSearchData.properties.type

    propertyNames = ["Longitude", "Latitude", "Address", "Property Type"];
    propertyValues = [longitudeValue, latitudeValue, addressValue, propertyType];
    console.log(propertyValues)

    for (i = 0; i < propertyNames.length; i++) {
        row = table.insertRow();
        row.insertCell(0).innerHTML = propertyNames[i];
        row.insertCell(1).innerHTML = propertyValues[i];
    }
} // end of showAddressTableData function


// function to hide & reset the div,input and variables
function clearStuff() {
    document.getElementById("tbl").getElementsByTagName('tbody')[0].innerHTML = "";
    document.getElementById("tableDiv").className = 'hide';
    //document.getElementById("coordinatesDeatilHeading").className = 'hide';
    document.getElementById("addressDeatilHeading").className = 'hide';
    //document.getElementById("latitude").value = "";
    //document.getElementById("longitude").value = "";
}



// getting the latitude and longitude values of the user input
function getInputValue() {
    cleanMapLayers();
    var userLatitude = document.getElementById("latitude").value;
    var userLongitude = document.getElementById("longitude").value;

    // checking input value that it is empty or not
    if (userLatitude.length < 1 && userLongitude.length < 1) {
        alert('Please entered the Latitude  and Longitude values')
    } else if (userLatitude.length < 1) {
        alert('Please entered the Latitude value')
    } else if (userLongitude.length < 1) {
        alert('Please entered the Longitude value')
    } else {
        getAPIdata(userLatitude, userLongitude);
    }

} // end of getInputValue function

// calling the Nominatim API to get the data
function getAPIdata(userLatitude, userLongitude) {
    var apiLink = "https://nominatim.openstreetmap.org/reverse?format=geojson&lat=" + userLatitude +
        "&lon=" + userLongitude;
    // console.log(apiLink);
    $.ajax({
        url: apiLink,
        type: "GET",
        success: function (result) {
            console.log(result);
            reverseGeocodeApiResult = result;
            if ((reverseGeocodeApiResult.hasOwnProperty('error'))) {
                alert("Unable to Geocode for the entered coordinates please try different with different coordinates");
            } else {
                showDataOnMap(userLatitude, userLongitude);
            }
        },
        error: function (error) {
            console.log(`Error is ${error}`);
            alert('The entered coordinates has no address. Please try again!')
        },
    });

} // end of getAPIdata function

// showing the API-Data on the Map with details on application
function showDataOnMap(userLatitude, userLongitude) {
    userMarker = new L.Marker([userLatitude, userLongitude]);
    map.addLayer(userMarker);
    map.setView(new L.LatLng(userLatitude, userLongitude), 18);
    showCoordinatesTableData();

} // end of showDataOnMap function

// function to show the Nomintaim-API result in the form of table when user enters coordinates
function showCoordinatesTableData() {
    clearStuff();

    document.getElementById("tableDiv").className = 'show';

    table = document.getElementById("tbl").getElementsByTagName('tbody')[0];

    displayName = reverseGeocodeApiResult.features[0].properties.display_name;
    propertyType = reverseGeocodeApiResult.features[0].properties.addresstype;
    houseNumber = reverseGeocodeApiResult.features[0].properties.address.house_number;
    streetName = reverseGeocodeApiResult.features[0].properties.address.road;
    cityName = reverseGeocodeApiResult.features[0].properties.address.city;
    postalCode = reverseGeocodeApiResult.features[0].properties.address.postcode;
    stateName = reverseGeocodeApiResult.features[0].properties.address.state;
    countryName = reverseGeocodeApiResult.features[0].properties.address.country;

    propertyNames = ['OSM Name', 'Property Type', 'House Number', 'Street Name', 'Postal Code', 'City', 'State', 'Country'];
    propertyValues = [displayName, propertyType, houseNumber, streetName, cityName, postalCode, stateName, countryName];

    for (i = 0; i < propertyNames.length; i++) {
        row = table.insertRow();
        row.insertCell(0).innerHTML = propertyNames[i];
        row.insertCell(1).innerHTML = propertyValues[i];
    }
} // end of showCoordinatesTableData function


// function to get the routes and direction from the API and display on the map
function getDirections() {

    var routingPlace1 = document.getElementById("search").value;
    var routingPlace2 = document.getElementById("search2").value;

    if (routingPlace1.length < 1 && routingPlace2.length < 1) {
        alert('Please entered the start and end locations for the routing');
    } else if (routingPlace1.length < 1) {
        alert('Please entered the start location for the routing');
    } else if (routingPlace2.length < 1) {
        alert('Please entered the end location for the routing');
    } else {

        let request = new XMLHttpRequest();

        request.open('POST', "https://api.openrouteservice.org/v2/directions/" + routingProfileValue + "/geojson");

        request.setRequestHeader('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader('Authorization', '5b3ce3597851110001cf6248cc83fd1ccde9453fa144389fb968c3a6');

        request.onreadystatechange = function () {
            if (this.readyState === 4) {
                data = JSON.parse(this.responseText);
                console.log('Getting the Routing data from the API for the ' + routingProfileValue + " profile");
                console.log(data);
                showRoutingDirections(data);

            }
        };

        const body = '{"coordinates":[[' + routingCoord1 + '],[' + routingCoord2 + ']]}';

        request.send(body);
    }

}

function showRoutingDirections(data) {
    if (map.hasLayer(routingPath)) {
        map.removeLayer(routingPath);
        clearStuff();
    }
    routingPath = L.geoJSON(data).addTo(map);
    map.fitBounds(routingPath.getBounds());


    document.getElementById("tableDiv").className = 'show';
    table = document.getElementById("tbl").getElementsByTagName('tbody')[0];
    propertyNames = ['Total Distance', 'Estimated Time'];
    propertyValues = [];

    if(data.features[0].properties.summary.distance < 1000){
        distanceValue = data.features[0].properties.summary.distance + " meter";        
        propertyValues.push(distanceValue);
    }else{
        distanceValue = (data.features[0].properties.summary.distance/1000).toFixed(3) + " Km";        
        propertyValues.push(distanceValue);     
    }
    timevalue = (data.features[0].properties.summary.duration/60).toFixed(3) + " minutes"
        propertyValues.push(timevalue);
    
    for (i = 0; i < propertyNames.length; i++) {
        row = table.insertRow();
        row.insertCell(0).innerHTML = propertyNames[i];
        row.insertCell(1).innerHTML = propertyValues[i];
    }

}