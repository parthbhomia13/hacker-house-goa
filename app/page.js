"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function Home() {
    const [name, setName] = useState("");
    const [photo, setPhoto] = useState(null);
    const [photoURL, setPhotoURL] = useState("");
    const [facePhoto, setFacePhoto] = useState("");
    const [id, setId] = useState("");
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const cardRef = useRef(null);

    useEffect(() => {
        async function loadModel() {
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
                setLoading(false);
            } catch (error) {
                console.error("MODEL LOADING ERROR:", error);
                setLoading(false);
                alert(
                    "Face detector could not be loaded. Make sure the models are inside public/models."
                );
            }
        }

        loadModel();
    }, []);

    function handlePhotoChange(event) {
        const selectedPhoto = event.target.files?.[0];

        if (!selectedPhoto) return;

        const fileName = selectedPhoto.name.toLowerCase();

        const isValid =
            selectedPhoto.type === "image/jpeg" ||
            selectedPhoto.type === "image/png" ||
            selectedPhoto.type === "image/heic" ||
            selectedPhoto.type === "image/heif" ||
            fileName.endsWith(".jpg") ||
            fileName.endsWith(".jpeg") ||
            fileName.endsWith(".png") ||
            fileName.endsWith(".heic") ||
            fileName.endsWith(".heif");

        if (!isValid) {
            alert("Please select a JPG, PNG or HEIC image.");
            return;
        }

        if (photoURL) {
            URL.revokeObjectURL(photoURL);
        }

        const url = URL.createObjectURL(selectedPhoto);

        setPhoto(selectedPhoto);
        setPhotoURL(url);
        setFacePhoto("");
        setId("");
    }

    async function generateId() {
        if (name.trim() === "") {
            alert("Please enter your name.");
            return;
        }

        if (!photo) {
            alert("Please select a photo.");
            return;
        }

        if (loading) {
            alert("Face detector is still loading. Please wait.");
            return;
        }

        setGenerating(true);

        try {
            const image = await faceapi.fetchImage(photoURL);

            const detections = await faceapi.detectAllFaces(
                image,
                new faceapi.TinyFaceDetectorOptions({
                    inputSize: 416,
                    scoreThreshold: 0.5
                })
            );

            if (detections.length === 0) {
                alert(
                    "No face detected. Please select a clear photo with one face."
                );
                setGenerating(false);
                return;
            }

            if (detections.length > 1) {
                alert(
                    "Multiple faces detected. Please select a photo with only one person."
                );
                setGenerating(false);
                return;
            }

            const box = detections[0].box;

            const marginX = box.width * 0.35;
            const marginTop = box.height * 0.75;
            const marginBottom = box.height * 0.45;

            let cropX = box.x - marginX;
            let cropY = box.y - marginTop;
            let cropWidth = box.width + marginX * 2;
            let cropHeight =
                box.height + marginTop + marginBottom;

            if (cropX < 0) {
                cropWidth += cropX;
                cropX = 0;
            }

            if (cropY < 0) {
                cropHeight += cropY;
                cropY = 0;
            }

            if (cropX + cropWidth > image.width) {
                cropWidth = image.width - cropX;
            }

            if (cropY + cropHeight > image.height) {
                cropHeight = image.height - cropY;
            }

            const canvas = document.createElement("canvas");

            canvas.width = cropWidth;
            canvas.height = cropHeight;

            const context = canvas.getContext("2d");

            if (!context) {
                alert("Could not create canvas.");
                setGenerating(false);
                return;
            }

            context.drawImage(
                image,
                cropX,
                cropY,
                cropWidth,
                cropHeight,
                0,
                0,
                cropWidth,
                cropHeight
            );

            setFacePhoto(canvas.toDataURL("image/png"));

            const newId =
                "ID-" +
                Math.floor(1000 + Math.random() * 9000);

            setId(newId);
            setGenerating(false);

            setTimeout(() => {
                cardRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }, 200);
        } catch (error) {
            console.error("FACE DETECTION ERROR:", error);

            alert(
                "Could not process this image. If you are using an iPhone HEIC photo, try JPG or PNG."
            );

            setGenerating(false);
        }
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    async function createFinalCanvas() {
        if (!facePhoto || !id || !name) {
            return null;
        }

        const canvas = document.createElement("canvas");

        canvas.width = 1200;
        canvas.height = 1800;

        const ctx = canvas.getContext("2d");

        if (!ctx) return null;

        const background = await loadImage(
            "/hackerhouse-bg.jpeg"
        );

        const canvasRatio = 1200 / 1800;
        const imageRatio =
            background.width / background.height;

        let drawWidth;
        let drawHeight;
        let drawX;
        let drawY;

        if (imageRatio > canvasRatio) {
            drawHeight = 1800;
            drawWidth = drawHeight * imageRatio;
            drawX = (1200 - drawWidth) / 2;
            drawY = 0;
        } else {
            drawWidth = 1200;
            drawHeight = drawWidth / imageRatio;
            drawX = 0;
            drawY = (1800 - drawHeight) / 2;
        }

        ctx.drawImage(
            background,
            drawX,
            drawY,
            drawWidth,
            drawHeight
        );

        const face = await loadImage(facePhoto);

        const faceX = 87 * 3;
        const faceY = 218 * 3;
        const faceSize = 225 * 3;

        ctx.save();

        ctx.beginPath();

        ctx.arc(
            faceX + faceSize / 2,
            faceY + faceSize / 2,
            faceSize / 2,
            0,
            Math.PI * 2
        );

        ctx.closePath();
        ctx.clip();

        const faceRatio = face.width / face.height;

        let sourceWidth;
        let sourceHeight;
        let sourceX;
        let sourceY;

        if (faceRatio > 1) {
            sourceHeight = face.height;
            sourceWidth = face.height;
            sourceX =
                (face.width - sourceWidth) / 2;
            sourceY = 0;
        } else {
            sourceWidth = face.width;
            sourceHeight = face.width;
            sourceX = 0;
            sourceY =
                (face.height - sourceHeight) / 2;
        }

        ctx.drawImage(
            face,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            faceX,
            faceY,
            faceSize,
            faceSize
        );

        ctx.restore();

        ctx.beginPath();

        ctx.arc(
            faceX + faceSize / 2,
            faceY + faceSize / 2,
            faceSize / 2 - 3,
            0,
            Math.PI * 2
        );

        ctx.lineWidth = 7 * 3;
        ctx.strokeStyle = "#D4AF37";
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillStyle = "white";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 6;
        ctx.shadowOffsetY = 6;

        ctx.font = "bold 72px Arial";

        ctx.fillText(
            name.toUpperCase(),
            600,
            485 * 3
        );

        ctx.font = "bold 60px Arial";

        ctx.fillText(
            id,
            600,
            535 * 3
        );

        ctx.shadowColor = "transparent";

        return canvas;
    }

    async function canvasToFile(canvas) {
        const blob = await new Promise((resolve) => {
            canvas.toBlob(
                resolve,
                "image/jpeg",
                0.85
            );
        });

        if (!blob) {
            throw new Error("Could not create image.");
        }

        return new File(
            [blob],
            "hacker-house-goa-id.jpg",
            {
                type: "image/jpeg"
            }
        );
    }

    async function downloadImage() {
        try {
            const canvas = await createFinalCanvas();

            if (!canvas) {
                alert("Please generate your ID first.");
                return;
            }

            const link = document.createElement("a");

            link.download =
                "hacker-house-goa-id.jpg";

            link.href = canvas.toDataURL(
                "image/jpeg",
                0.85
            );

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("DOWNLOAD ERROR:", error);
            alert("Could not create the image.");
        }
    }

    async function shareImage() {
        try {
            const canvas =
                await createFinalCanvas();

            if (!canvas) {
                alert("Please generate your ID first.");
                return;
            }

            const file =
                await canvasToFile(canvas);

            const caption =
                "🚀 I'm joining Hacker House Goa!\n\n" +
                "Building, learning and shipping with the community.\n\n" +
                "#HackerHouseGoa #FrameInGoa";

            if (
                navigator.share &&
                navigator.canShare &&
                navigator.canShare({
                    files: [file]
                })
            ) {
                await navigator.share({
                    title: "Hacker House Goa",
                    text: caption,
                    files: [file]
                });

                return;
            }

            await downloadImage();

            alert(
                "Image sharing is not supported here, so the image was downloaded."
            );
        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }

            console.error("SHARE ERROR:", error);
            alert("Could not share the image.");
        }
    }

    async function shareToX() {
        try {
            const canvas =
                await createFinalCanvas();

            if (!canvas) {
                alert("Please generate your ID first.");
                return;
            }

            const file =
                await canvasToFile(canvas);

            const caption =
                "🚀 I'm joining Hacker House Goa!\n\n" +
                "Building, learning and shipping with the community.\n\n" +
                "#HackerHouseGoa #FrameInGoa";

            /*
             * MOBILE:
             * Native share sheet with the actual image.
             * User can choose X.
             */
            if (
                navigator.share &&
                navigator.canShare &&
                navigator.canShare({
                    files: [file]
                })
            ) {
                try {
                    await navigator.share({
                        title: "Hacker House Goa",
                        text: caption,
                        files: [file]
                    });

                    return;
                } catch (error) {
                    if (error.name === "AbortError") {
                        return;
                    }
                }
            }

            /*
             * PC FALLBACK:
             * Download image and open X with text + ID link.
             */

            const link =
                document.createElement("a");

            link.download =
                "hacker-house-goa-id.jpg";

            link.href = canvas.toDataURL(
                "image/jpeg",
                0.85
            );

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            const idURL =
                `${window.location.origin}/id/${id}`;

            const finalText =
                caption +
                "\n\n" +
                idURL;

            const xURL =
                "https://twitter.com/intent/tweet?text=" +
                encodeURIComponent(finalText);

            window.open(
                xURL,
                "_blank",
                "noopener,noreferrer"
            );
        } catch (error) {
            console.error(
                "X SHARE ERROR:",
                error
            );

            alert(
                "Could not prepare the X post."
            );
        }
    }

    return (
        <main
            style={{
                minHeight: "100vh",
                margin: 0,
                padding: 0,
                fontFamily:
                    "Arial, Helvetica, sans-serif",
                backgroundImage:
                    "linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('/background.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
                color: "white",
                overflowX: "hidden"
            }}
        >
            <style jsx>{`
                @media (max-width: 600px) {
                    .id-card {
                        width: 90vw !important;
                        height: calc(90vw * 1.5) !important;
                    }

                    .id-photo {
                        top: 36.33% !important;
                        left: 21.75% !important;
                        width: 56.25% !important;
                        height: 37.5% !important;
                    }

                    .id-name {
                        top: 78.33% !important;
                        left: 7.5% !important;
                        width: 85% !important;
                    }

                    .id-number {
                        top: 86.67% !important;
                        left: 7.5% !important;
                        width: 85% !important;
                    }
                }
            `}</style>

            <section
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "30px 15px",
                    boxSizing: "border-box"
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: "500px",
                        padding: "35px",
                        borderRadius: "24px",
                        background:
                            "rgba(0,0,0,0.60)",
                        border:
                            "1px solid rgba(255,255,255,0.18)",
                        backdropFilter: "blur(15px)",
                        boxShadow:
                            "0 25px 70px rgba(0,0,0,0.5)",
                        boxSizing: "border-box"
                    }}
                >
                    <div
                        style={{
                            marginBottom: "25px",
                            textAlign: "center"
                        }}
                    >
                        <img
                            src="/hackerhouse-logo.png"
                            alt="Hacker House Goa"
                            style={{
                                width: "280px",
                                maxWidth: "100%",
                                height: "auto",
                                display: "block",
                                margin: "0 auto"
                            }}
                        />
                    </div>

                    <h1
                        style={{
                            fontSize: "30px",
                            margin: "0 0 10px"
                        }}
                    >
                        Create your ID
                    </h1>

                    <p
                        style={{
                            color: "#aaa",
                            lineHeight: "1.5",
                            marginBottom: "25px"
                        }}
                    >
                        Upload your photo and generate
                        your Hacker House Goa ID card.
                    </p>

                    <label
                        style={{
                            display: "block",
                            fontWeight: "bold",
                            marginBottom: "8px"
                        }}
                    >
                        Name
                    </label>

                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => {
                            const value =
                                e.target.value;

                            if (
                                /^[A-Za-z '-]*$/.test(
                                    value
                                )
                            ) {
                                setName(value);
                            }
                        }}
                        style={{
                            width: "100%",
                            padding: "15px",
                            fontSize: "16px",
                            borderRadius: "12px",
                            border:
                                "1px solid #444",
                            background: "#111",
                            color: "white",
                            outline: "none",
                            marginBottom: "20px",
                            boxSizing: "border-box"
                        }}
                    />

                    <label
                        style={{
                            display: "block",
                            fontWeight: "bold",
                            marginBottom: "8px"
                        }}
                    >
                        Photo
                    </label>

                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif"
                        onChange={handlePhotoChange}
                        style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "12px",
                            background: "#111",
                            color: "#ddd",
                            border:
                                "1px solid #444",
                            marginBottom: "25px",
                            boxSizing: "border-box"
                        }}
                    />

                    <button
                        onClick={generateId}
                        disabled={
                            loading ||
                            generating
                        }
                        style={{
                            width: "100%",
                            padding: "16px",
                            fontSize: "16px",
                            fontWeight: "bold",
                            border: "none",
                            borderRadius: "12px",
                            cursor:
                                loading ||
                                generating
                                    ? "not-allowed"
                                    : "pointer",
                            background:
                                loading ||
                                generating
                                    ? "#555"
                                    : "white",
                            color: "black"
                        }}
                    >
                        {loading
                            ? "Loading Face Detector..."
                            : generating
                            ? "Generating..."
                            : "Generate ID"}
                    </button>
                </div>
            </section>

            {id && (
                <section
                    style={{
                        minHeight: "100vh",
                        padding: "60px 15px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        background:
                            "rgba(0,0,0,0.75)",
                        boxSizing: "border-box"
                    }}
                >
                    <h2
                        style={{
                            fontSize: "32px",
                            marginBottom: "30px",
                            textAlign: "center"
                        }}
                    >
                        Your Hacker House ID
                    </h2>

                    <div
                        ref={cardRef}
                        className="id-card"
                        style={{
                            position: "relative",
                            width: "400px",
                            height: "600px",
                            maxWidth: "90vw",
                            borderRadius: "20px",
                            overflow: "hidden",
                            backgroundImage:
                                "url('/hackerhouse-bg.jpeg')",
                            backgroundSize: "cover",
                            backgroundPosition:
                                "center",
                            boxShadow:
                                "0 15px 40px rgba(0,0,0,0.5)"
                        }}
                    >
                        {facePhoto && (
                            <img
                                src={facePhoto}
                                className="id-photo"
                                alt="Participant face"
                                style={{
                                    position:
                                        "absolute",
                                    top: "218px",
                                    left: "87px",
                                    width: "225px",
                                    height: "225px",
                                    objectFit: "cover",
                                    objectPosition:
                                        "center center",
                                    borderRadius:
                                        "50%",
                                    border:
                                        "7px solid #D4AF37",
                                    boxSizing:
                                        "border-box"
                                }}
                            />
                        )}

                        <div
                            className="id-name"
                            style={{
                                position:
                                    "absolute",
                                top: "470px",
                                left: "30px",
                                width: "340px",
                                textAlign: "center",
                                fontSize: "24px",
                                fontWeight: "bold",
                                color: "white",
                                textShadow:
                                    "2px 2px 4px black"
                            }}
                        >
                            {name.toUpperCase()}
                        </div>

                        <div
                            className="id-number"
                            style={{
                                position:
                                    "absolute",
                                top: "520px",
                                left: "30px",
                                width: "340px",
                                textAlign: "center",
                                fontSize: "20px",
                                fontWeight: "bold",
                                color: "white",
                                textShadow:
                                    "2px 2px 4px black"
                            }}
                        >
                            {id}
                        </div>
                    </div>

                    <div
                        style={{
                            width: "400px",
                            maxWidth: "90vw",
                            display: "grid",
                            gridTemplateColumns:
                                "1fr 1fr",
                            gap: "12px",
                            marginTop: "25px"
                        }}
                    >
                        <button
                            onClick={downloadImage}
                            style={{
                                padding: "15px",
                                border: "none",
                                borderRadius:
                                    "12px",
                                background: "white",
                                color: "black",
                                fontWeight: "bold",
                                cursor: "pointer"
                            }}
                        >
                            ↓ Download
                        </button>

                        <button
                            onClick={shareImage}
                            style={{
                                padding: "15px",
                                border:
                                    "1px solid #444",
                                borderRadius:
                                    "12px",
                                background:
                                    "#171717",
                                color: "white",
                                fontWeight: "bold",
                                cursor: "pointer"
                            }}
                        >
                            Share
                        </button>

                        <button
                            onClick={shareToX}
                            style={{
                                gridColumn:
                                    "span 2",
                                padding: "15px",
                                border:
                                    "1px solid #333",
                                borderRadius:
                                    "12px",
                                background: "#000",
                                color: "white",
                                fontWeight: "bold",
                                cursor: "pointer",
                                fontSize: "15px"
                            }}
                        >
                            𝕏 Share to X
                        </button>
                    </div>
                </section>
            )}
        </main>
    );
}