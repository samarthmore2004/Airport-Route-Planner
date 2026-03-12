const { execFile } = require("child_process");
const path = require("path");
console.log("Start:", start);
console.log("End:", end);

exports.route = (req, res) => {

    const start = req.body.source;
    const end = req.body.destination;

    const exePath = path.resolve(__dirname, "../cpp-engine/skyroute.exe");

    execFile(exePath, [start, end], (error, stdout, stderr) => {

        if (error) {
            console.error(error);
            return res.send("Error running route engine");
        }

        const output = stdout.trim();
        const [pathString, distance] = output.split("|");
        const pathArray = pathString.split(",");

res.render("result", {
    source: start,
    destination: end,
    path: pathArray,
    stops: pathArray.length - 1 + " stops",
    flightTime: Math.floor(distance / 800) + " hrs approx",
    cost: distance,
    coordinates: [],
    found: true   // 👈 ADD THIS
});
    });
};