import { NextRequest, NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_CLOUD_API_KEY!;

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
        return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: "Only JPG, JPEG, or PNG images allowed." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString("base64");

    try {
        const res = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requests: [
                        {
                            image: { content: base64Image },
                            features: [{ type: "TEXT_DETECTION" }],
                        },
                    ],
                }),
            }
        );

        const result = await res.json();
        const text = result.responses?.[0]?.fullTextAnnotation?.text || "";

        return NextResponse.json({ text });
    } catch (err) {
        console.error("Google OCR error:", err);
        return NextResponse.json({ error: "Google OCR failed" }, { status: 500 });
    }
}
