import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rapor = await db.rapor.findUnique({
      where: { id },
      select: {
        id: true,
        pdfUrl: true,
        pdfName: true,
        namaSiswa: true,
      },
    });

    if (!rapor || !rapor.pdfUrl) {
      return new NextResponse("Berkas PDF rapor tidak ditemukan", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Jika berupa external URL (misal Cloud Storage / S3 / Supabase Storage)
    if (rapor.pdfUrl.startsWith("http://") || rapor.pdfUrl.startsWith("https://")) {
      return NextResponse.redirect(rapor.pdfUrl);
    }

    // Jika berupa Data URL Base64 (data:application/pdf;base64,...)
    if (rapor.pdfUrl.startsWith("data:")) {
      const parts = rapor.pdfUrl.split(",");
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : "application/pdf";
      const base64Data = parts[1] || "";
      const buffer = Buffer.from(base64Data, "base64");

      const fileName = rapor.pdfName || `Rapor_${rapor.namaSiswa.replace(/\s+/g, "_")}.pdf`;

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
        },
      });
    }

    // Fallback jika format data raw
    return new NextResponse("Format berkas PDF tidak didukung", { status: 400 });
  } catch (error: any) {
    return new NextResponse(`Terjadi kesalahan: ${error.message}`, { status: 500 });
  }
}

