/* The places, the photographs and the route. One source of truth: hobbies.js
 * draws the page from it, pins.js draws the layout options from it, and a new
 * town gets added here once.
 *
 * A row is: name, lat, lon, region, photo count, and for the places that carry
 * a name on the map, [label x, label y, text-anchor] in map coordinates.
 */
// The route drawn across the map. Not every place, on purpose: nine
// well-separated anchors read as one journey, where forty-nine would read
// as a ball of string.
var CHAIN = ["Honolulu", "Victoria", "East Lansing", "New York",
             "Amsterdam", "Göttingen", "Prague", "New Delhi", "Bengaluru"];

// name, lat, lon, region, photos, [label x, label y, text-anchor]
// The photo count is kept but no longer shown. It is the record of which
// places carried the most time, and putting it back is a one-line change.
// A place with label coordinates becomes an anchor: it is named on the
// map. The rest are dots, so a crowded region still reads as crowded
// without nineteen names fighting for the same forty pixels.
var PLACES = [
  ["Honolulu",        21.31, -157.86, "Hawaii",           88,  [95, 202, "start"]],
  ["Victoria",        48.43, -123.37, "British Columbia",  5,  [196, 88, "end"]],
  ["Vancouver",       49.28, -123.12, "British Columbia",  0],
  ["Portland",        45.52, -122.68, "Oregon",            0],
  ["Minneapolis",     44.98,  -93.27, "Minnesota",       112 /*,[300, 96, "end"] */],
  ["Kansas City",     39.10,  -94.58, "Missouri",         92],
  ["St. Louis",       38.63,  -90.20, "Missouri",         87],
  ["Milwaukee",       43.04,  -87.91, "Wisconsin",        38],
  ["Chicago",         41.88,  -87.63, "Illinois",        593,  [262, 148, "end"]],
  ["Marquette",       46.54,  -87.40, "Michigan",        150],
  ["Indianapolis",    39.77,  -86.16, "Indiana",          12],
  ["Grand Rapids",    42.96,  -85.67, "Michigan",        130],
  ["Mackinac Island", 45.85,  -84.62, "Michigan",        161],
  ["East Lansing",    42.74,  -84.48, "Michigan",       2164,  [344, 82, "start"]],
  ["Atlanta",         33.75,  -84.39, "Georgia",          30],
  ["Detroit",         42.33,  -83.05, "Michigan",         26],
  ["Savannah",        32.08,  -81.09, "Georgia",          49 /*,[352, 171, "start"] */],
  ["Toronto",         43.65,  -79.38, "Ontario",           6 /*,[388, 104, "start"] */],
  ["New York",        40.71,  -74.01, "New York",         41,  [388, 134, "start"]],
  ["Amsterdam",       52.37,    4.90, "Netherlands",      94,  [524, 64, "end"]],
  ["Cologne",         50.94,    6.96, "Germany",          37],
  ["Strasbourg",      48.58,    7.75, "France",           62,  [528, 124, "end"]],
  ["Frankfurt am Main", 50.11,  8.68, "Germany",          22],
  ["Stuttgart",       48.78,    9.18, "Germany",          33],
  ["Kassel",          51.31,    9.50, "Germany",         123],
  ["Göttingen",       51.53,    9.94, "Germany",         766,  [608, 54, "start"]],
  ["Nuremberg",       49.45,   11.08, "Germany",           7],
  ["Regensburg",      49.02,   12.10, "Germany",          76],
  ["Berlin",          52.52,   13.40, "Germany",          10 /*,[628, 76, "start"] */],
  ["Prague",          50.08,   14.44, "Czechia",          74,  [626, 112, "start"]],
  ["Amritsar",        31.63,   74.87, "Punjab",           48],
  ["Jalandhar",       31.33,   75.58, "Punjab",            5],
  ["Jaipur",          26.91,   75.79, "Rajasthan",       184 /*,[726, 196, "end"] */],
  ["Ludhiana",        30.90,   75.86, "Punjab",         1042,  [722, 170, "end"]],
  ["Dharamshala",     32.22,   76.32, "Himachal Pradesh", 10 /*,[724, 142, "end"] */],
  ["Ooty",            11.41,   76.70, "Tamil Nadu",       25],
  ["New Delhi",       28.61,   77.21, "Delhi",             5,  [820, 176, "start"]],
  ["Bengaluru",       12.97,   77.59, "Karnataka",        49,  [822, 240, "start"]],
  ["Hyderabad",       17.39,   78.49, "Telangana",        20 /*,[822, 214, "start"] */]
];

// Place -> file stem in photos/. Written out rather than derived, because a
// slug rule that has to cope with "Göttingen" and "Kansas City" is longer
// than the list it replaces.
var PHOTOS = {
  "Amritsar": "amritsar",     "Amsterdam": "amsterdam",   "Bengaluru": "bengaluru",
  "Chicago": "chicago",       "Dharamshala": "dharamshala", "Göttingen": "gottingen",
  "Honolulu": "honolulu",     "Jaipur": "jaipur",         "Jalandhar": "jalandhar",
  "Kansas City": "kansas-city",
  "Minneapolis": "minneapolis", "New York": "new-york",   "Ooty": "ooty",
  "Portland": "portland",     "Prague": "prague",         "Savannah": "savannah",
  "Strasbourg": "strasbourg", "Stuttgart": "stuttgart",   "Vancouver": "vancouver"
};

/* Dropped from the map on 17 August 2026, to clear the crowding around the
 * Great Lakes and in Punjab. Kept here, commented out, so any of them can
 * go back by moving one line into PLACES above.
 */
// ["Kalaoa",          19.72, -156.03, "Hawaii",            6]
// ["Pupukea",         21.65, -158.05, "Hawaii",           42]
// ["Surrey",          49.19, -122.85, "British Columbia",  6]
// ["Harrison Hot Springs", 49.30, -121.78, "British Columbia", 5]
// ["Champaign",       40.12,  -88.24, "Illinois",         11]
// ["Munising",        46.41,  -86.65, "Michigan",         13]
// ["Traverse City",   44.76,  -85.62, "Michigan",         70]
// ["Ithaca",          42.44,  -76.50, "New York",          6]
// ["Wernigerode",     51.83,   10.79, "Germany",          34]
// ["Ajmer",           26.45,   74.64, "Rajasthan",         8]
// ["Bathinda",        30.21,   74.95, "Punjab",           20]
// ["Mysuru",          12.30,   76.64, "Karnataka",        20]
