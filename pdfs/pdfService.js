// pdfService.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

async function generateDiploma(graduation) {
  return new Promise((resolve, reject) => {
    // Verificar se os campos necessários estão presentes
    if (!graduation.user || !graduation.user.name) {
      return reject(new Error("Dados do usuário estão incompletos"));
    }

    // Continuação da criação do PDF
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

    // Adiciona assinatura fictícia
    doc
      .moveDown(2)
      .fontSize(16)
      .text("_________________________", { align: "right" })
      .text("O Mestre:", { align: "right" })
      .text("Cobra Kai Dojo", { align: "right" });

    doc.end();

    writeStream.on("finish", () => resolve(filePath));
    writeStream.on("error", (error) => reject(error));
  });
}

module.exports = {
  generateDiploma,
};
