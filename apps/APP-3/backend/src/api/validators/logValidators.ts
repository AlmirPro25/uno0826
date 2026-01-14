import { body } from 'express-validator';

export const validateLogCreation = [
  body('interactionId').isString().notEmpty(),
  body('timestamp').isISO8601().toDate(),
  body('userPrompt').isString().notEmpty(),
  body('initialGeminiCode').isString(),
  body('finalUserCode').isString(),
  body('modelVersionUsed').isString().notEmpty(),
  body('feedbackSignal').optional().isString(),
  body('userRating').optional().isIn(['liked', 'disliked']),
  body('isGoodForTraining').optional().isBoolean(),
];
