import { NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ImageRun,
  TextRun,
  PageOrientation,
  BorderStyle,
  VerticalAlign,
  HeightRule,
} from 'docx';

interface ReportItemInput {
  no: number;
  tanggal: string;
  keterangan: string;
  fotoList: Array<{
    dataUrl: string; // base64 string or url
    namaFile?: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const judul = (body.judul || 'LAPORAN DOKUMENTASI KEGIATAN').toUpperCase();
    const subjudul = body.subjudul || 'TK CAHAYA HATI';
    const items: ReportItemInput[] = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada data kegiatan untuk diekspor.' },
        { status: 400 }
      );
    }

    // Border table hitam tunggal tipis rapi (seperti di SPEC.md Python)
    const tableBorder = {
      style: BorderStyle.SINGLE,
      size: 4,
      color: '000000',
    };

    const cellBorders = {
      top: tableBorder,
      bottom: tableBorder,
      left: tableBorder,
      right: tableBorder,
    };

    // Header Tabel: No. (0.95cm), Tanggal (4.80cm), Keterangan (6.23cm), Dokumentasi (11.34cm)
    const colWidths = [540, 2720, 3530, 6430]; // dalam dxa

    const headerRow = new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: colWidths[0], type: WidthType.DXA },
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: 'F1F5F9' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'No.',
                  bold: true,
                  font: 'Arial',
                  size: 22, // 11pt
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: colWidths[1], type: WidthType.DXA },
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: 'F1F5F9' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Tanggal',
                  bold: true,
                  font: 'Arial',
                  size: 22,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: colWidths[2], type: WidthType.DXA },
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: 'F1F5F9' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Keterangan',
                  bold: true,
                  font: 'Arial',
                  size: 22,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: colWidths[3], type: WidthType.DXA },
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: 'F1F5F9' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Dokumentasi',
                  bold: true,
                  font: 'Arial',
                  size: 22,
                }),
              ],
            }),
          ],
        }),
      ],
    });

    const rows: TableRow[] = [headerRow];

    for (const item of items) {
      // 1. Kolom No
      const cellNo = new TableCell({
        width: { size: colWidths[0], type: WidthType.DXA },
        borders: cellBorders,
        verticalAlign: VerticalAlign.TOP,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 80 },
            children: [
              new TextRun({
                text: `${item.no}.`,
                font: 'Arial',
                size: 22,
              }),
            ],
          }),
        ],
      });

      // 2. Kolom Tanggal
      const cellTanggal = new TableCell({
        width: { size: colWidths[1], type: WidthType.DXA },
        borders: cellBorders,
        verticalAlign: VerticalAlign.TOP,
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 80, after: 80 },
            children: [
              new TextRun({
                text: item.tanggal,
                font: 'Arial',
                size: 22,
              }),
            ],
          }),
        ],
      });

      // 3. Kolom Keterangan (Dukungan Multiline)
      const descLines = (item.keterangan || '-').split('\n');
      const descParagraphs = descLines.map(
        (line, lineIdx) =>
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: lineIdx === 0 ? 80 : 20, after: 40, line: 276 },
            children: [
              new TextRun({
                text: line,
                font: 'Arial',
                size: 22,
              }),
            ],
          })
      );

      const cellKeterangan = new TableCell({
        width: { size: colWidths[2], type: WidthType.DXA },
        borders: cellBorders,
        verticalAlign: VerticalAlign.TOP,
        children: descParagraphs,
      });

      // 4. Kolom Dokumentasi (Foto terpusat, skala ~7.5 cm = ~280 pt)
      const photoParagraphs: Paragraph[] = [];

      if (!item.fotoList || item.fotoList.length === 0) {
        photoParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 80 },
            children: [
              new TextRun({
                text: '-\n(Tidak ada foto)',
                font: 'Arial',
                size: 18,
                italics: true,
                color: '94A3B8',
              }),
            ],
          })
        );
      } else {
        for (const foto of item.fotoList) {
          try {
            let imageBuffer: Buffer | null = null;
            if (foto.dataUrl.startsWith('data:image/')) {
              const base64Data = foto.dataUrl.split(';base64,').pop();
              if (base64Data) {
                imageBuffer = Buffer.from(base64Data, 'base64');
              }
            } else if (foto.dataUrl.startsWith('http://') || foto.dataUrl.startsWith('https://')) {
              const resImg = await fetch(foto.dataUrl);
              const arrayBuffer = await resImg.arrayBuffer();
              imageBuffer = Buffer.from(arrayBuffer);
            }

            if (imageBuffer) {
              photoParagraphs.push(
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 60, after: 120 },
                  children: [
                    new ImageRun({
                      data: imageBuffer,
                      transformation: {
                        width: 285, // ~7.5 cm proporsional
                        height: 200,
                      },
                      type: 'jpg',
                    }),
                  ],
                })
              );
            }
          } catch (imgErr) {
            console.error('Gagal memproses gambar untuk docx:', imgErr);
          }
        }

        if (photoParagraphs.length === 0) {
          photoParagraphs.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: '-', font: 'Arial', size: 20 })],
            })
          );
        }
      }

      const cellDokumentasi = new TableCell({
        width: { size: colWidths[3], type: WidthType.DXA },
        borders: cellBorders,
        verticalAlign: VerticalAlign.TOP,
        children: photoParagraphs,
      });

      rows.push(
        new TableRow({
          cantSplit: true,
          children: [cellNo, cellTanggal, cellKeterangan, cellDokumentasi],
        })
      );
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                orientation: PageOrientation.LANDSCAPE,
                width: 15840, // 11 inchi (Letter Landscape)
                height: 12240, // 8.5 inchi
              },
              margin: {
                top: 1134, // 2.0 cm
                bottom: 1134,
                left: 1134,
                right: 1134,
              },
            },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 60 },
              children: [
                new TextRun({
                  text: judul,
                  bold: true,
                  font: 'Arial',
                  size: 28, // 14pt
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 },
              children: [
                new TextRun({
                  text: subjudul,
                  bold: true,
                  font: 'Arial',
                  size: 22, // 11pt
                  color: '02677F',
                }),
              ],
            }),
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              rows,
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Laporan_Dokumentasi_Kegiatan_TK_Cahaya_Hati.docx"',
      },
    });
  } catch (error: any) {
    console.error('Error export docx:', error);
    return NextResponse.json(
      { success: false, message: `Gagal menghasilkan file Word: ${error.message}` },
      { status: 500 }
    );
  }
}
