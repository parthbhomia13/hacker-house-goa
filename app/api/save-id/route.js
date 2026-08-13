import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const formData =
            await request.formData();

        const id =
            formData.get("id");

        const file =
            formData.get("file");

        if (!id || !file) {
            return NextResponse.json(
                {
                    error:
                        "Missing ID or file"
                },
                {
                    status: 400
                }
            );
        }

        const blob =
            await put(
                `hacker-house-goa/${id}.jpg`,
                file,
                {
                    access:
                        "public",

                    addRandomSuffix:
                        false
                }
            );

        return NextResponse.json({
            success:
                true,

            url:
                blob.url
        });

    } catch (error) {
        console.error(
            "VERCEL BLOB ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error?.message ||
                    "Upload failed"
            },
            {
                status: 500
            }
        );
    }
}