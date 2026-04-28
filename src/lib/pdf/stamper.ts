import { PDFDocument, rgb, degrees } from 'pdf-lib';

export async function stampPdf(fileBlob: Blob): Promise<Blob> {
  const arrayBuffer = await fileBlob.arrayBuffer();
  // ignoreEncryption is useful in case some documents are locked but we still need to stamp them for review
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  
  const pages = pdfDoc.getPages();
  const softRed = rgb(0.78, 0.20, 0.20);
  
  for (const page of pages) {
    const { width, height } = page.getSize();
    
    // Stamp configuration
    const text = 'FIRMA RECHAZADA';
    const subText = 'DOCUMENTO SIN VALIDEZ LEGAL';
    const angle = degrees(45);
    const opacity = 0.5;

    // Approximate centering with rotation
    page.drawText(text, {
      x: width / 2 - 150,
      y: height / 2 - 50,
      size: 50,
      color: softRed,
      opacity,
      rotate: angle,
    });
    
    page.drawText(subText, {
      x: width / 2 - 80,
      y: height / 2 - 70,
      size: 18,
      color: softRed,
      opacity,
      rotate: angle,
    });
  }
  
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as any], { type: 'application/pdf' });
}
