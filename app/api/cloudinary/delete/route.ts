import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const { publicId } = await req.json();

    if (!publicId) {
      return NextResponse.json({ error: "publicId gereklidir." }, { status: 400 });
    }

    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: "Cloudinary API anahtarları eksik." }, { status: 500 });
    }

    // Dosyayı Cloudinary sunucularından siliyoruz
    const result = await cloudinary.uploader.destroy(publicId);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Cloudinary silme hatası:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
