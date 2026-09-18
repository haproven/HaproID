require("dotenv").config();

const express = require("express");
const path = require("path");
const {
    MongoClient,
    ServerApiVersion
} = require("mongodb");

const app = express();

const PORT = process.env.PORT || 3000;

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME =
    process.env.MONGODB_DB || "haproid";

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is missing in .env");
    process.exit(1);
}

const client = new MongoClient(
    MONGODB_URI,
    {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true
        }
    }
);

let db;
let profilesCollection;


/*
 * Middleware
 */

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


/*
 * Static frontend files
 */

app.use(
    express.static(__dirname)
);


/*
 * Connect MongoDB
 */

async function connectDatabase() {

    try {

        await client.connect();

        await client
            .db("admin")
            .command({
                ping: 1
            });

        db = client.db(
            DATABASE_NAME
        );

        profilesCollection =
            db.collection("profiles");

        console.log(
            "✅ MongoDB connected successfully"
        );

        console.log(
            `📦 Database: ${DATABASE_NAME}`
        );

        console.log(
            "📁 Collection: profiles"
        );

    } catch (error) {

        console.error(
            "❌ MongoDB connection failed:"
        );

        console.error(
            error
        );

        process.exit(1);
    }
}


/*
 * Database middleware
 */

function requireDatabase(
    req,
    res,
    next
) {

    if (!profilesCollection) {

        return res.status(503).json({
            success: false,
            message:
                "Database is not connected."
        });

    }

    next();
}


/*
 * Home
 */

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );

    }
);


/*
 * API health check
 */

app.get(
    "/api/health",
    (req, res) => {

        res.json({
            success: true,
            server: "Node.js + Express",
            database:
                profilesCollection
                    ? "MongoDB connected"
                    : "MongoDB disconnected"
        });

    }
);


/*
 * GET all profiles
 */

app.get(
    "/api/profiles",
    requireDatabase,
    async (req, res) => {

        try {

            const profiles =
                await profilesCollection
                    .find({})
                    .sort({
                        name: 1
                    })
                    .toArray();

            res.json({
                success: true,
                count: profiles.length,
                profiles
            });

        } catch (error) {

            console.error(
                "GET /api/profiles error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to fetch profiles."
            });

        }

    }
);


/*
 * GET profile by role + id
 *
 * Example:
 * /api/profiles/user/amit-kumar
 */

app.get(
    "/api/profiles/:role/:id",
    requireDatabase,
    async (req, res) => {

        try {

            const role =
                String(
                    req.params.role
                )
                .toLowerCase()
                .trim();

            const id =
                String(
                    req.params.id
                )
                .trim();

            const profile =
                await profilesCollection
                    .findOne({
                        id: id,
                        role: role
                    });

            if (!profile) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Profile not found."
                });

            }

            res.json({
                success: true,
                profile
            });

        } catch (error) {

            console.error(
                "GET profile error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to fetch profile."
            });

        }

    }
);


/*
 * POST new profile
 */

app.post(
    "/api/profiles",
    requireDatabase,
    async (req, res) => {

        try {

            const {
                id,
                name,
                role,
                bio,
                email,
                image
            } = req.body;

            if (
                !id ||
                !name ||
                !role
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "id, name and role are required."
                });

            }

            const normalizedRole =
                String(role)
                    .toLowerCase()
                    .trim();

            const normalizedId =
                String(id)
                    .toLowerCase()
                    .trim();

            const existing =
                await profilesCollection
                    .findOne({
                        id: normalizedId,
                        role: normalizedRole
                    });

            if (existing) {

                return res.status(409).json({
                    success: false,
                    message:
                        "Profile already exists."
                });

            }

            const profile = {
                id: normalizedId,
                name: String(name).trim(),
                role: normalizedRole,
                bio: bio || "",
                email: email || "",
                image: image || "",
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result =
                await profilesCollection
                    .insertOne(profile);

            res.status(201).json({
                success: true,
                message:
                    "Profile created successfully.",
                profile: {
                    _id: result.insertedId,
                    ...profile
                }
            });

        } catch (error) {

            console.error(
                "POST /api/profiles error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to create profile."
            });

        }

    }
);


/*
 * PUT update profile
 */

app.put(
    "/api/profiles/:role/:id",
    requireDatabase,
    async (req, res) => {

        try {

            const role =
                String(
                    req.params.role
                )
                .toLowerCase()
                .trim();

            const id =
                String(
                    req.params.id
                )
                .trim();

            const allowedFields = [
                "name",
                "bio",
                "email",
                "image"
            ];

            const updateData = {};

            for (
                const field of allowedFields
            ) {

                if (
                    req.body[field] !==
                    undefined
                ) {

                    updateData[field] =
                        req.body[field];

                }

            }

            updateData.updatedAt =
                new Date();

            const result =
                await profilesCollection
                    .updateOne(
                        {
                            id: id,
                            role: role
                        },
                        {
                            $set: updateData
                        }
                    );

            if (
                result.matchedCount === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Profile not found."
                });

            }

            const updatedProfile =
                await profilesCollection
                    .findOne({
                        id: id,
                        role: role
                    });

            res.json({
                success: true,
                message:
                    "Profile updated successfully.",
                profile:
                    updatedProfile
            });

        } catch (error) {

            console.error(
                "PUT profile error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to update profile."
            });

        }

    }
);


/*
 * DELETE profile
 */

app.delete(
    "/api/profiles/:role/:id",
    requireDatabase,
    async (req, res) => {

        try {

            const role =
                String(
                    req.params.role
                )
                .toLowerCase()
                .trim();

            const id =
                String(
                    req.params.id
                )
                .trim();

            const result =
                await profilesCollection
                    .deleteOne({
                        id: id,
                        role: role
                    });

            if (
                result.deletedCount === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Profile not found."
                });

            }

            res.json({
                success: true,
                message:
                    "Profile deleted successfully."
            });

        } catch (error) {

            console.error(
                "DELETE profile error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to delete profile."
            });

        }

    }
);


/*
 * Clean profile URL
 *
 * /user/amit-kumar
 * /team/yashika-son
 * /founder/susheel
 */

app.get(
    "/:role/:id",
    (req, res, next) => {

        const role =
            String(
                req.params.role || ""
            )
            .toLowerCase()
            .trim();

        const id =
            String(
                req.params.id || ""
            )
            .trim();

        const validRoles = [
            "founder",
            "team",
            "user"
        ];

        if (
            !validRoles.includes(role) ||
            !id
        ) {

            return next();

        }

        res.sendFile(
            path.join(
                __dirname,
                "profile.html"
            )
        );

    }
);


/*
 * 404 API
 */

app.use(
    "/api",
    (req, res) => {

        res.status(404).json({
            success: false,
            message:
                "API endpoint not found."
        });

    }
);


/*
 * Start
 */

async function startServer() {

    await connectDatabase();

    app.listen(
        PORT,
        () => {

            console.log("");
            console.log(
                "🚀 HaproID server started"
            );

            console.log(
                `🌐 http://localhost:${PORT}`
            );

            console.log(
                `❤️ API: http://localhost:${PORT}/api/health`
            );

        }
    );

}

startServer();