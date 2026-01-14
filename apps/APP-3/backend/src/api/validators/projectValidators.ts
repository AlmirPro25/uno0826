import { body } from 'express-validator';

export const validateProjectCreation = [
  body('name').notEmpty().withMessage('Project name is required.').trim().escape(),
  body('htmlCode').notEmpty().withMessage('HTML code is required.'),
  body('projectPlan').optional().isString(),
];

export const validateProjectUpdate = [
  body('name').optional().notEmpty().withMessage('Project name cannot be empty.').trim().escape(),
  body('htmlCode').optional().notEmpty().withMessage('HTML code cannot be empty.'),
  body('projectPlan').optional().isString(),
];
