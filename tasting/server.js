const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

/*
 * Root directory
 */
const ROOT_DIR = __dirname;

/*
 * Static files
 *
 * index.html
 * profile.html
 * assets/
 */
app.use(
    express.static(ROOT_DIR)
);

/*
 * Home page
 */
app.get("/", (req, res) => {

    res.sendFile(
        path.join(ROOT_DIR, "index.html")
    );

});

/*
 * Clean profile URLs
 *
 * /user/amit
 * /user/priya
 * /team/yashika
 * /founder/susheel
 */

app.get("/:role/:id", (req, res, next) => {

    const role =
        String(req.params.role || "")
            .toLowerCase()
            .trim();

    const id =
        String(req.params.id || "")
            .trim();

    const validRoles = [
        "founder",
        "team",
        "user"
    ];

    /*
     * If URL is not a profile URL,
     * continue to other Express routes.
     */

    if (!validRoles.includes(role)) {
        return next();
    }

    if (!id) {
        return next();
    }

    /*
     * Serve the same profile.html
     *
     * profile.html itself reads:
     *
     * /user/amit
     * /team/yashika
     */

    res.sendFile(
        path.join(
            ROOT_DIR,
            "profile.html"
        )
    );

});

/*
 * 404
 */

app.use((req, res) => {

    res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport"
                content="width=device-width, initial-scale=1.0">
            <title>404 | Not Found</title>
        </head>
        <body>
            <h1>404 - Page Not Found</h1>
            <p>The requested page does not exist.</p>
            <a href="/">Go Home</a>
        </body>
        </html>
    `);

});

/*
 * Start server
 */

app.listen(PORT, () => {

    console.log(
        `🚀 Profile server running on port ${PORT}`
    );

    console.log(
        `🌐 http://localhost:${PORT}`
    );

});