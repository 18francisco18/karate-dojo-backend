const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const token = require('../middleware/token');
const { Student, Instructor } = require('../models/user');

// Configurar o multer para armazenar as imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'profile-images');
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

// Rota para servir a imagem padrão
router.get('/default', (req, res) => {
  const defaultImagePath = path.join(__dirname, '..', 'uploads', 'profile-images', 'default-profile.png');
  if (fs.existsSync(defaultImagePath)) {
    res.sendFile(defaultImagePath);
  } else {
    res.status(404).json({ error: 'Imagem padrão não encontrada' });
  }
});

// Rota para upload da imagem de perfil
router.post('/upload', token(), upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    console.log('Upload request:', { userId: req.userId, file: req.file });

    // Primeiro tenta encontrar um estudante
    let user = await Student.findById(req.userId);
    let isInstructor = false;

    // Se não encontrar estudante, tenta encontrar um instrutor
    if (!user) {
      user = await Instructor.findById(req.userId);
      isInstructor = true;
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
    }

    console.log('Found user:', { id: user._id, type: isInstructor ? 'instructor' : 'student', profileImage: user.profileImage });

    // Se existir uma imagem antiga, remover
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, '..', 'uploads', 'profile-images', user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Atualizar o caminho da imagem no banco de dados
    user.profileImage = req.file.filename;
    await user.save();

    console.log('Updated user:', { id: user._id, type: isInstructor ? 'instructor' : 'student', profileImage: user.profileImage });

    res.json({
      message: 'Imagem de perfil atualizada com sucesso',
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error('Erro ao processar upload:', error);
    res.status(500).json({ error: 'Erro ao processar o upload da imagem' });
  }
});

// Rota para servir as imagens
router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, '..', 'uploads', 'profile-images', filename);
  
  console.log('Serving image:', { filename, filepath });
  
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    console.log('Image not found, serving default');
    // Se a imagem específica não for encontrada, tenta servir a imagem padrão
    const defaultImagePath = path.join(__dirname, '..', 'uploads', 'profile-images', 'default-profile.png');
    if (fs.existsSync(defaultImagePath)) {
      res.sendFile(defaultImagePath);
    } else {
      res.status(404).json({ error: 'Imagem não encontrada' });
    }
  }
});

module.exports = router;
