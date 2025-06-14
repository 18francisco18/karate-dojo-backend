const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

async function generateDiploma(
  studentName,
  beltLevel,
  graduationDate,
  instructorName
) {
  return new Promise((resolve, reject) => {
    try {
      // Criar diretório para os diplomas se não existir
      const dirPath = path.join(__dirname, "../diplomas");
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const doc = new PDFDocument();
      const fileName = `${studentName.replace(
        /\s+/g,
        "_"
      )}_${beltLevel}_${new Date().getTime()}.pdf`;
      const filePath = path.join(dirPath, fileName);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Adiciona logo
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
        .text(`Certificamos que o aluno ${studentName.toUpperCase()}`, {
          align: "center",
        })
        .moveDown()
        .text(
          `Alcançou o cinto de nível ${beltLevel.toUpperCase()} com mérito.`,
          { align: "center" }
        );

      // Adiciona data da graduação
      doc
        .moveDown()
        .moveDown()
        .fontSize(12)
        .text(`Data: ${new Date(graduationDate).toLocaleDateString()}`, {
          align: "center",
        });

      // Adiciona imagem da assinatura
      doc.moveDown().moveDown();

      // Verifica se a imagem da assinatura existe
      const signaturePath = path.join(
        __dirname,
        "../assets/masterSignature.png"
      );
      if (fs.existsSync(signaturePath)) {
        doc.image(signaturePath, {
          fit: [150, 50],
          align: "center",
        });
      } else {
        // Se não houver imagem, usa linha de assinatura
        doc.text(`_______________________________`, { align: "center" });
      }

      doc.fontSize(12).text("Instrutor", instructorName, { align: "center" });

      // Finaliza o PDF
      doc.end();

      // Aguarda o stream terminar
      writeStream.on("finish", () => {
        resolve(filePath);
      });

      writeStream.on("error", (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function generateReceipt(monthlyFee, instructorName) {
  return new Promise((resolve, reject) => {
    try {
      // Criar diretório para os recibos se não existir
      const dirPath = path.join(__dirname, "../receipts");
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const doc = new PDFDocument();
      const month = new Date(monthlyFee.paymentDate).getMonth() + 1;
      const year = new Date(monthlyFee.paymentDate).getFullYear();
      const fileName = `recibo_${monthlyFee.user.name.replace(/\s+/g, "_")}_${month}_${year}.pdf`;
      const filePath = path.join(dirPath, fileName);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Adiciona logo
      const logoPath = path.join(__dirname, "../assets/logo-ipp.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, {
          fit: [100, 100],
          align: "center",
          valign: "top",
        });
      }

      doc
        .fontSize(30)
        .font("Helvetica-Bold")
        .text("Cobra Kai Dojo", { align: "center", underline: true });

      doc
        .moveDown()
        .fontSize(25)
        .font("Helvetica-Bold")
        .text(`Recibo de Pagamento`, { align: "center" });

      doc
        .moveDown()
        .fontSize(14)
        .font("Helvetica")
        .text(`Nome do Aluno: ${monthlyFee.user.name}`)
        .moveDown()
        .text(`Valor Pago: €${monthlyFee.amount}`)
        .moveDown()
        .text(`Data de Pagamento: ${new Date(monthlyFee.paymentDate).toLocaleDateString()}`)
        .moveDown()
        .text(`Método de Pagamento: ${monthlyFee.paymentMethod}`);

      // Adiciona imagem da assinatura
      doc.moveDown().moveDown();

      // Verifica se a imagem da assinatura existe
      const signaturePath = path.join(__dirname, "../assets/masterSignature.png");
      if (fs.existsSync(signaturePath)) {
        doc.image(signaturePath, {
          fit: [150, 50],
          align: "center",
        });
      } else {
        // Se não houver imagem, usa linha de assinatura
        doc.text(`_______________________________`, { align: "center" });
      }

      doc.fontSize(12).text(instructorName, { align: "center" });

      // Finaliza o PDF
      doc.end();

      // Aguarda o stream terminar
      writeStream.on("finish", () => {
        resolve(filePath);
      });

      writeStream.on("error", (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateDiploma,
  generateReceipt,
};
