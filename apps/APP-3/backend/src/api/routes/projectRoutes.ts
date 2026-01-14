import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController';
import { validateProjectCreation, validateProjectUpdate } from '../validators/projectValidators';
import { handleValidationErrors } from '../middleware/validationMiddleware';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// All project routes are protected
router.use(protect);

router.route('/')
  .get(getAllProjects)
  .post(validateProjectCreation, handleValidationErrors, createProject);

router.route('/:id')
  .get(getProjectById)
  .put(validateProjectUpdate, handleValidationErrors, updateProject)
  .delete(deleteProject);

export default router;
