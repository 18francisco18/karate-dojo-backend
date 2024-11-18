const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

async function generateDiploma(graduation, instructorName) {
  return new Promise((resolve, reject) => {
    if (!graduation.user || !graduation.user.name) {
      return reject(new Error("Dados do usuário estão incompletos"));
    }

    const doc = new PDFDocument();
    const dirPath = path.join(__dirname, "../diplomas");
    const filePath = path.join(dirPath, `${graduation._id}.pdf`);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Adiciona conteúdo ao PDF
    doc.image(path.join(__dirname, "../assets/logo-ipp.png"), {
      fit: [100, 100],
      align: "center",
      valign: "top",
    });

    doc
      .fontSize(30)
      .font("Helvetica-Bold")
      .text("Cobra Kai Dojo", { align: "center", underline: true });

    doc
      .moveDown()
      .fontSize(25)
      .font("Helvetica-Bold")
      .text(`Diploma de Graduação`, { align: "center" });

    doc
      .moveDown()
      .fontSize(18)
      .font("Helvetica")
      .text(`Certificamos que o aluno ${graduation.user.name.toUpperCase()}`, {
        align: "center",
      })
      .moveDown()
      .text(
        `Alcançou o cinto de nível ${graduation.level.toUpperCase()} com mérito.`,
        { align: "center" }
      )
      .moveDown()
      .text(`Data de Graduação: ${graduation.date.toLocaleDateString()}`, {
        align: "center",
      })
      .moveDown()
      .text(`Emitido no local: ${graduation.location}`, { align: "center" });

    doc
      .moveDown()
      .fontSize(14)
      .text(`Pontuação obtida: ${graduation.score}`, { align: "center" });

    if (graduation.comments) {
      doc
        .moveDown()
        .text(`Comentário: ${graduation.comments}`, { align: "center" });
    }

    // Espaço adicional antes da assinatura
    doc.moveDown(3);

    // Adiciona a imagem de assinatura fictícia
    const signaturePath = path.join(__dirname, "../assets/masterSignature.png");
    const signatureWidth = 150; // Largura da imagem de assinatura
    const pageWidth = doc.page.width; // Largura da página
    const signatureX = (pageWidth - signatureWidth) / 2; // Centraliza a imagem
    const signatureY = doc.y; // Usa a posição atual da linha

    doc.image(signaturePath, signatureX, signatureY, {
      width: signatureWidth,
      height: 50,
    });

    // Adiciona a linha de assinatura e o nome do instrutor
    doc
      .moveDown(2)
      .fontSize(16)
      .text("_________________________", { align: "center" })
      .text(`O Mestre: ${instructorName}`, { align: "center" })
      .text("Cobra Kai Dojo", { align: "center" });

    doc.end();

    writeStream.on("finish", () => resolve(filePath));
    writeStream.on("error", (error) => reject(error));
  });
}

module.exports = {
  generateDiploma,
};
