/**
 * Rotas para gerenciamento de pessoas e reconhecimento facial
 */

import express from 'express';
import multer from 'multer';
import { faceRecognitionService } from '../services/faceRecognitionService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Detecta pessoas em uma imagem
router.post('/detect', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Imagem não fornecida' });
    }

    const sessionId = parseInt(req.body.sessionId) || 0;
    const imageBase64 = req.file.buffer.toString('base64');

    const result = await faceRecognitionService.detectPeople(imageBase64, sessionId);
    
    res.json(result);
  } catch (error: any) {
    console.error('Erro ao detectar pessoas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Adiciona uma nova pessoa
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, description, relationship } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Imagem é obrigatória' });
    }

    const imageBase64 = req.file.buffer.toString('base64');

    const personId = await faceRecognitionService.addPerson(
      name,
      imageBase64,
      description,
      relationship
    );

    res.json({ 
      success: true, 
      personId,
      message: `Pessoa ${name} adicionada com sucesso!`
    });
  } catch (error: any) {
    console.error('Erro ao adicionar pessoa:', error);
    res.status(500).json({ error: error.message });
  }
});

// Busca pessoa por ID
router.get('/:id', (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const person = faceRecognitionService.getPerson(personId);

    if (!person) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(person);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Busca pessoa por nome
router.get('/name/:name', (req, res) => {
  try {
    const person = faceRecognitionService.getPersonByName(req.params.name);

    if (!person) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(person);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Lista todas as pessoas
router.get('/', (req, res) => {
  try {
    const people = faceRecognitionService.getAllPeople();
    res.json(people);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Atualiza informações de uma pessoa
router.put('/:id', (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const { description, relationship, notes } = req.body;

    faceRecognitionService.updatePerson(personId, {
      description,
      relationship,
      notes
    });

    res.json({ success: true, message: 'Pessoa atualizada' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Busca histórico de detecções
router.get('/:id/history', (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 50;

    const history = faceRecognitionService.getPersonHistory(personId, limit);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Remove uma pessoa
router.delete('/:id', (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    faceRecognitionService.deletePerson(personId);
    res.json({ success: true, message: 'Pessoa removida' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
