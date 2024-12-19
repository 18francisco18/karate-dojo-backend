const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const token = require('../middleware/token');
const User = require('../models/user');

// Configurar o multer para armazenar as imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // limite de 5MB
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens são permitidas!'));
  }
});

// Rota para upload da imagem de perfil
router.post('/upload', token, upload.single('profileImage'), async (req, res) => {
  try {
    console.log('Requisição de upload recebida');
    console.log('Arquivo:', req.file);
    console.log('Usuário:', req.user);

    if (!req.file) {
      console.log('Nenhum arquivo enviado');
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      console.log('Usuário não encontrado:', req.user.userId);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Se já existe uma imagem antiga, deleta
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, '..', user.profileImage);
      console.log('Tentando deletar imagem antiga:', oldImagePath);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log('Imagem antiga deletada com sucesso');
      }
    }

    // Atualiza o caminho da imagem no banco de dados
    user.profileImage = req.file.filename;
    await user.save();
    console.log('Perfil atualizado com sucesso:', user.profileImage);

    res.json({
      message: 'Imagem de perfil atualizada com sucesso',
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
});

// Rota para servir as imagens
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || !user.profileImage) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }

    const imagePath = path.join(__dirname, '..', 'uploads', user.profileImage);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Arquivo de imagem não encontrado' });
    }

    res.sendFile(imagePath);
  } catch (error) {
    console.error('Erro ao buscar imagem:', error);
    res.status(500).json({ error: 'Erro ao buscar imagem' });
  }
});

module.exports = router;
