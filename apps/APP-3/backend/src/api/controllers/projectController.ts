
import { Request, Response, NextFunction } from 'express';
import Project from '../models/Project';

// GET /api/projects
export const getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await (Project as any).findAll({ 
        where: { userId: req.user!.id },
        order: [['updatedAt', 'DESC']]
    });
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// GET /api/projects/:id
export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await (Project as any).findOne({ where: { id: req.params.id, userId: req.user!.id } });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
};

// POST /api/projects
export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  const { name, htmlCode, projectPlan } = req.body;
  try {
    const newProject = await (Project as any).create({
      name,
      htmlCode,
      projectPlan,
      userId: req.user!.id,
    });
    res.status(201).json(newProject);
  } catch (error) {
    next(error);
  }
};

// PUT /api/projects/:id
export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await (Project as any).findOne({ where: { id: req.params.id, userId: req.user!.id } });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const updatedProject = await project.update(req.body);
    res.json(updatedProject);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:id
export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await (Project as any).findOne({ where: { id: req.params.id, userId: req.user!.id } });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    await project.destroy();
    res.status(204).send(); // No content
  } catch (error) {
    next(error);
  }
};