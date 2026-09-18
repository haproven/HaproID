document.addEventListener(
    "DOMContentLoaded",
    () => {
        loadProfiles();
    }
);


/*
 * Load all profiles
 */

async function loadProfiles() {

    const container =
        document.getElementById(
            "profiles"
        );

    if (!container) {

        console.error(
            "❌ #profiles element not found."
        );

        return;
    }

    try {

        /*
         * Load main.json
         */

        const response =
            await fetch(
                "/assets/JSON/main.json",
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                `main.json not found. HTTP ${response.status}`
            );
        }

        const main =
            await response.json();

        if (
            !main.profiles ||
            !Array.isArray(main.profiles)
        ) {

            throw new Error(
                "main.json mein profiles array nahi mila."
            );
        }

        container.innerHTML = "";


        /*
         * Load each profile JSON
         */

        for (
            const profile of main.profiles
        ) {

            if (!profile.file) {

                console.warn(
                    "⚠️ Profile file missing:",
                    profile
                );

                continue;
            }

            try {

                const profilePath =
                    "/assets/JSON/" +
                    profile.file;

                const profileResponse =
                    await fetch(
                        profilePath,
                        {
                            cache: "no-store"
                        }
                    );

                if (
                    !profileResponse.ok
                ) {

                    console.warn(
                        "⚠️ Profile JSON not found:",
                        profilePath
                    );

                    continue;
                }

                const user =
                    await profileResponse.json();


                /*
                 * Profile data
                 */

                const id =
                    String(
                        user.id || ""
                    ).trim();

                const name =
                    user.name ||
                    "Unknown User";

                const role =
                    String(
                        user.role ||
                        profile.type ||
                        "user"
                    )
                    .toLowerCase()
                    .trim();

                const bio =
                    user.bio || "";

                const image =
                    user.image || "";


                /*
                 * Clean profile URL
                 */

                if (!id) {

                    console.warn(
                        "⚠️ Profile ID missing:",
                        profile.file
                    );

                    continue;
                }

                const profileUrl =
                    `/${encodeURIComponent(role)}/${encodeURIComponent(id)}`;


                /*
                 * Create card
                 */

                const card =
                    document.createElement(
                        "article"
                    );

                card.className =
                    "card";


                /*
                 * Image
                 */

                const imageHTML =
                    image
                        ? `
                            <img
                                src="${escapeHTML(image)}"
                                alt="${escapeHTML(name)}"
                                loading="lazy"
                            >
                          `
                        : "";


                /*
                 * Card HTML
                 */

                card.innerHTML = `

                    ${imageHTML}

                    <h2>
                        ${escapeHTML(name)}
                    </h2>

                    <span class="role">
                        ${escapeHTML(role)}
                    </span>

                    <p class="bio">
                        ${escapeHTML(bio)}
                    </p>

                    <a
                        class="profile-link"
                        href="${profileUrl}"
                    >
                        View Profile
                    </a>

                `;


                container.appendChild(
                    card
                );

            } catch (error) {

                console.error(
                    "❌ Profile loading error:",
                    profile.file,
                    error
                );

            }
        }


        /*
         * No profile found
         */

        if (
            !container.children.length
        ) {

            container.innerHTML = `

                <div class="error">

                    <h3>
                        No profiles found.
                    </h3>

                    <p>
                        Profile JSON files
                        could not be loaded.
                    </p>

                </div>

            `;
        }

    } catch (error) {

        console.error(
            "❌ Profile system error:",
            error
        );

        container.innerHTML = `

            <div class="error">

                <h3>
                    Failed to load profiles.
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;
    }
}


/*
 * Escape HTML
 */

function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}