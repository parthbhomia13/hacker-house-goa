import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const formData = await request.formData();

        const id = formData.get("id");
        const file = formData.get("file");

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: "ID is missing"
                },
                { status: 400 }
            );
        }

        if (!file) {
            return NextResponse.json(
                {
                    success: false,
                    error: "File is missing"
                },
                { status: 400 }
            );
        }

        console.log(
            "Uploading:",
            `hacker-house-goa/${id}.jpg`
        );

        const blob = await put(
            `hacker-house-goa/${id}.jpg`,
            file,
            {
                access: "public",
                allowOverwrite: true
            }
        );

        console.log(
            "UPLOAD SUCCESS:",
            blob.url
        );

        return NextResponse.json({
            success: true,
            id: id,
            url: blob.url
        });

    } catch (error) {
        console.error(
            "VERCEL BLOB ERROR:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : String(error)
            },
            { status: 500 }
        );
    }
}