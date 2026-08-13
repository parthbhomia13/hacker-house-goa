import { list } from "@vercel/blob";

export async function generateMetadata({ params }) {
    const { id } = await params;

    const { blobs } = await list({
        prefix: `hacker-house-goa/${id}.jpg`,
    });

    const image = blobs[0]?.url;

    return {
        title: `Hacker House Goa - ${id}`,

        description:
            "Hacker House Goa participant ID",

        openGraph: {
            title:
                `Hacker House Goa - ${id}`,

            description:
                "Hacker House Goa participant ID",

            images: image
                ? [
                      {
                          url: image,
                          width: 1200,
                          height: 1800,
                          alt:
                              `Hacker House Goa ID ${id}`,
                      },
                  ]
                : [],
        },

        twitter: {
            card: "summary_large_image",

            title:
                `Hacker House Goa - ${id}`,

            description:
                "Hacker House Goa participant ID",

            images: image
                ? [image]
                : [],
        },
    };
}

export default async function IdPage({ params }) {
    const { id } = await params;

    const { blobs } = await list({
        prefix: `hacker-house-goa/${id}.jpg`,
    });

    const image = blobs[0]?.url;

    if (!image) {
        return (
            <main
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "#111",
                    color: "white",
                    fontFamily: "Arial",
                }}
            >
                <h1>ID not found</h1>
            </main>
        );
    }

    return (
        <main
            style={{
                minHeight: "100vh",
                background: "#111",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "30px",
                boxSizing: "border-box",
            }}
        >
            <img
                src={image}
                alt={`Hacker House Goa ID ${id}`}
                style={{
                    maxWidth: "100%",
                    width: "600px",
                    height: "auto",
                    borderRadius: "20px",
                }}
            />
        </main>
    );
}