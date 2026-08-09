import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, type PDFFont, type PDFPage, rgb } from "pdf-lib";
import {
  ISSUE_CATALOG,
  buildIssueArticleSections,
  type IssueArticle,
} from "../src/lib/journal/issueArticles";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "../public/articles/issues");

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BODY_SIZE = 10.5;
const BODY_LINE = 14;
const HEADING_SIZE = 11.5;
const TITLE_SIZE = 15;
const SMALL_SIZE = 8.5;

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

class PdfWriter {
  private doc: PDFDocument;
  private page: PDFPage;
  regular!: PDFFont;
  bold!: PDFFont;
  italic!: PDFFont;
  private y = PAGE_HEIGHT - MARGIN;
  private pageNumber = 1;
  private issueLabel = "";

  private constructor(doc: PDFDocument, page: PDFPage) {
    this.doc = doc;
    this.page = page;
  }

  static async create(): Promise<PdfWriter> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const writer = new PdfWriter(doc, page);
    writer.regular = await doc.embedFont(StandardFonts.TimesRoman);
    writer.bold = await doc.embedFont(StandardFonts.TimesRomanBold);
    writer.italic = await doc.embedFont(StandardFonts.TimesRomanItalic);
    return writer;
  }

  setIssueLabel(label: string) {
    this.issueLabel = label;
  }

  private drawPageFooter() {
    const footer = `TUES Economics Journal · ${this.issueLabel} · ${this.pageNumber}`;
    this.page.drawText(footer, {
      x: MARGIN,
      y: 28,
      size: SMALL_SIZE,
      font: this.regular,
      color: rgb(0.45, 0.45, 0.45),
    });
    this.page.drawText(String(this.pageNumber), {
      x: PAGE_WIDTH - MARGIN - 10,
      y: 28,
      size: SMALL_SIZE,
      font: this.regular,
      color: rgb(0.45, 0.45, 0.45),
    });
  }

  private newPage() {
    this.drawPageFooter();
    this.pageNumber += 1;
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  private ensureSpace(height: number) {
    if (this.y - height >= MARGIN + 20) return;
    this.newPage();
  }

  drawJournalBanner() {
    this.page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 72,
      width: PAGE_WIDTH,
      height: 72,
      color: rgb(0.12, 0.16, 0.23),
    });
    this.page.drawText("TUES Economics Journal", {
      x: MARGIN,
      y: PAGE_HEIGHT - 38,
      size: 14,
      font: this.bold,
      color: rgb(1, 1, 1),
    });
    this.page.drawText("Peer-reviewed open access · economics & policy", {
      x: MARGIN,
      y: PAGE_HEIGHT - 54,
      size: SMALL_SIZE,
      font: this.regular,
      color: rgb(0.82, 0.86, 0.92),
    });
    this.y = PAGE_HEIGHT - 96;
  }

  drawLines(
    lines: string[],
    options: { size?: number; font?: PDFFont; lineHeight?: number; indent?: number; color?: ReturnType<typeof rgb> } = {},
  ) {
    const size = options.size ?? BODY_SIZE;
    const font = options.font ?? this.regular;
    const lineHeight = options.lineHeight ?? BODY_LINE;
    const indent = options.indent ?? 0;
    const color = options.color ?? rgb(0.1, 0.1, 0.1);

    for (const line of lines) {
      this.ensureSpace(lineHeight);
      this.page.drawText(line, {
        x: MARGIN + indent,
        y: this.y,
        size,
        font,
        color,
      });
      this.y -= lineHeight;
    }
  }

  drawParagraph(text: string, options: { size?: number; font?: PDFFont; indent?: number } = {}) {
    const size = options.size ?? BODY_SIZE;
    const font = options.font ?? this.regular;
    const lines = wrapText(text, font, size, CONTENT_WIDTH - (options.indent ?? 0));
    this.drawLines(lines, { size, font, indent: options.indent });
    this.y -= 8;
  }

  drawMetaLine(text: string) {
    this.drawParagraph(text, { size: SMALL_SIZE, font: this.regular });
  }

  drawHeading(text: string) {
    this.y -= 10;
    this.drawLines([text], { size: HEADING_SIZE, font: this.bold, lineHeight: 16 });
    this.page.drawLine({
      start: { x: MARGIN, y: this.y + 4 },
      end: { x: MARGIN + 48, y: this.y + 4 },
      thickness: 1,
      color: rgb(0.12, 0.16, 0.23),
    });
    this.y -= 4;
  }

  drawAbstractBlock(abstract: string, keywords: string[]) {
    this.drawHeading("Abstract");
    this.drawParagraph(abstract);
    this.y -= 4;
    this.drawLines(["Keywords: " + keywords.join("; ")], {
      size: SMALL_SIZE,
      font: this.italic,
      lineHeight: 12,
      color: rgb(0.25, 0.25, 0.25),
    });
    this.y -= 6;
  }

  finalize() {
    this.drawPageFooter();
  }

  async save(path: string) {
    const bytes = await this.doc.save();
    writeFileSync(path, bytes);
  }
}

async function buildArticlePdf(article: IssueArticle, issueLabel: string): Promise<void> {
  const writer = await PdfWriter.create();
  writer.setIssueLabel(issueLabel);

  const published = new Date(article.publishedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  writer.drawJournalBanner();
  writer.drawMetaLine(`${issueLabel}  ·  ${article.category}  ·  Published ${published}`);
  writer.drawMetaLine(`DOI: ${article.doi.replace("https://doi.org/", "")}  ·  Pages ${article.pages}`);

  writer.y -= 6;
  writer.drawLines(wrapText(article.title, writer.bold, TITLE_SIZE, CONTENT_WIDTH), {
    size: TITLE_SIZE,
    font: writer.bold,
    lineHeight: 19,
  });
  writer.y -= 8;
  writer.drawParagraph(article.authors, { font: writer.italic, size: 11 });
  writer.drawMetaLine("TUES University and affiliated research institutions");

  writer.y -= 4;
  writer.drawAbstractBlock(article.abstract, article.keywords);

  for (const section of buildIssueArticleSections(article)) {
    writer.drawHeading(section.heading);
    for (const paragraph of section.paragraphs) {
      writer.drawParagraph(paragraph);
    }
  }

  writer.finalize();

  const path = join(OUTPUT_DIR, `${article.id}.pdf`);
  mkdirSync(dirname(path), { recursive: true });
  await writer.save(path);
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  let count = 0;

  for (const issue of Object.values(ISSUE_CATALOG)) {
    for (const article of issue.articles) {
      await buildArticlePdf(article, issue.label);
      count += 1;
      console.log(`Generated ${article.id}.pdf`);
    }
  }

  console.log(`Done. ${count} issue PDFs written to public/articles/issues/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
