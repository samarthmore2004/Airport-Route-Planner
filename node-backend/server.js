const express = require("express");
const app = express();
const { exec } = require("child_process");
const path = require("path");
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", "views");
const axios = require("axios");
const FLIGHT_KEY = "ac33a105854138fcb07d4b2c7151adf5";

const airlineLogos = {
    "indigo": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/IndiGo_Logo.svg/512px-IndiGo_Logo.svg.png",
    "air india": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Air_India_Logo.svg/512px-Air_India_Logo.svg.png",
    "vistara": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Vistara_Logo.svg/512px-Vistara_Logo.svg.png",
    "spicejet": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/SpiceJet_logo.svg/512px-SpiceJet_logo.svg.png",
    "akasa": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Akasa_Air_logo.svg/512px-Akasa_Air_logo.svg.png"
};

const defaultLogo =
 "https://cdn-icons-png.flaticon.com/512/2972/2972185.png";


const graph = {
    Delhi: { Mumbai: 1400, Jaipur: 280, Lucknow: 500, Ahmedabad: 950 },
    Mumbai: { Delhi: 1400, Pune: 150, Goa: 580, Ahmedabad: 530 },
    Bangalore: { Hyderabad: 570, Chennai: 350, Goa: 560 },
    Hyderabad: { Bangalore: 570, Chennai: 630, Pune: 560 },
    Chennai: { Bangalore: 350, Hyderabad: 630, Cochin: 680 },
    Kolkata: { Bhubaneswar: 440, Guwahati: 970, Delhi: 1500 },
    Ahmedabad: { Mumbai: 530, Delhi: 950, Indore: 400 },
    Pune: { Mumbai: 150, Hyderabad: 560 },
    Jaipur: { Delhi: 280, Lucknow: 580 },
    Goa: { Mumbai: 580, Bangalore: 560, Cochin: 720 },
    Lucknow: { Delhi: 500, Jaipur: 580, Bhubaneswar: 930 },
    Cochin: { Chennai: 680, Goa: 720 },
    Bhubaneswar: { Kolkata: 440, Lucknow: 930 },
    Guwahati: { Kolkata: 970 },
    Indore: { Ahmedabad: 400 }
};

const airportCoords = {
    Delhi: [28.5562, 77.1000],
    Mumbai: [19.0896, 72.8656],
    Bangalore: [13.1986, 77.7066],
    Hyderabad: [17.2403, 78.4294],
    Chennai: [12.9941, 80.1709],
    Kolkata: [22.6547, 88.4467],
    Ahmedabad: [23.0722, 72.6347],
    Pune: [18.5821, 73.9197],
    Jaipur: [26.8242, 75.8025],
    Goa: [15.3800, 73.8310],
    Lucknow: [26.7606, 80.8893],
    Cochin: [10.1519, 76.4019],
    Bhubaneswar: [20.2444, 85.8178],
    Guwahati: [26.1061, 91.5859],
    Indore: [22.7253, 75.8011]
};
const airportCodes = {
    Delhi: "DEL",
    Mumbai: "BOM",
    Bangalore: "BLR",
    Hyderabad: "HYD",
    Chennai: "MAA",
    Kolkata: "CCU",
    Ahmedabad: "AMD",
    Pune: "PNQ",
    Jaipur: "JAI",
    Goa: "GOI",
    Lucknow: "LKO",
    Cochin: "COK",
    Bhubaneswar: "BBI",
    Guwahati: "GAU",
    Indore: "IDR"
};


const airports = Object.keys(graph);




app.get("/", (req, res) => {
    res.render("home");
});

app.get("/planner", (req, res) => {
    res.render("index", {
        airports,
        path: null,
        cost: null,
        coordinates: [],
        error: null,
        source: "",
        destination: "",
        stops: null,
        flightTime: null
    });
});

app.post("/route", async (req, res) => {
    const { source, destination } = req.body;

    if (source === destination) {
        return res.render("index", {
            airports,
            path: null,
            cost: null,
            coordinates: [],
            error: "Source and destination cannot be the same.",
            source,
            destination,
            stops: null,
            flightTime: null,
            flightOptions: []
        });
    }


    const routePath = path.join(__dirname, "cpp-engine", "skyroute");
    const command = `"${routePath}" "${source}" "${destination}"`;

    exec(command, async (error, stdout, stderr) => {

        if (error || stdout.includes("No route")) {
            return res.render("index", {
                airports,
                path: null,
                cost: null,
                coordinates: [],
                error: "Route not found",
                source,
                destination,
                stops: null,
                flightTime: null,
                flightInfo: null
            });
        }

        const output = stdout.trim();
        const [pathStr, costStr] = output.split("|");
        const pathArr = pathStr.split(",");

        const coords = pathArr.map(city => airportCoords[city]);
        const distance = parseInt(costStr);

        // Stops
        const stops = pathArr.length - 2;
        const stopText = stops <= 0 ? "Non-stop" : `${stops} stop${stops > 1 ? "s" : ""}`;

        // Time
        const hours = distance / 800;
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        const timeText = `${h}h ${m}m`;

        // -------- Flight API --------
let flightOptions = [];

try {
    const depCode = airportCodes[source];
    const arrCode = airportCodes[destination];

    if (depCode && arrCode) {
        const response = await axios.get(
            "http://api.aviationstack.com/v1/flights",
            {
                params: {
                    access_key: FLIGHT_KEY,
                    dep_iata: depCode,
                    arr_iata: arrCode
                }
            }
        );

        const flights = response.data.data;

        if (flights && flights.length > 0) {
            flightOptions = flights
                .filter(f => f.airline && f.flight && f.airline.name)
                .slice(0, 3)
                .map(f => {

                    const depTime = f.departure?.scheduled;
                    const arrTime = f.arrival?.scheduled;

                    let duration = "N/A";
                    if (depTime && arrTime) {
                        const d1 = new Date(depTime);
                        const d2 = new Date(arrTime);
                        const diff = (d2 - d1) / 60000;
                        const h = Math.floor(diff / 60);
                        const m = Math.floor(diff % 60);
                        duration = `${h}h ${m}m`;
                    }

                    const airlineName = (f.airline.name || "").toLowerCase();

                    let logo = defaultLogo;

                    for (let key in airlineLogos) {
                        if (airlineName.includes(key)) {
                            logo = airlineLogos[key];
                            break;
                        }
                    }

                    console.log("Airline:", airlineName, "Logo:", logo);

                    return {
                        airline: f.airline.name,
                        flightNumber: f.flight.iata || "N/A",
                        duration: duration,
                        fare: "₹" + (4000 + Math.floor(Math.random() * 3000)),
                        distance: distance,
                        logo: logo
                    };
                });
        }
    }
} catch (err) {
    console.log("Flight API error:", err.message);
}
if (!flightOptions || flightOptions.length === 0) {
    return res.render("index", {
        airports,
        path: null,            
        cost: null,            
        coordinates: [],       
        error: "No flights available on this route.",
        source,
        destination,
        stops: null,
        flightTime: null,
        flightOptions: []
    });
}



        
       res.render("index", {
    airports,
    path: pathArr,
    cost: distance,
    coordinates: coords,
    error: null,
    source,
    destination,
    stops: stopText,
    flightTime: timeText,
    flightOptions
});

    });
})



app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
