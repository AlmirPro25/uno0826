
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import User from './User';

interface ProjectAttributes {
  id: string;
  name: string;
  htmlCode: string;
  projectPlan?: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type ProjectCreationAttributes = Optional<ProjectAttributes, 'id' | 'createdAt' | 'updatedAt'>;

class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: string;
  public name!: string;
  public htmlCode!: string;
  public projectPlan?: string;
  public userId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

(Project as any).init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  htmlCode: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
  projectPlan: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  }
}, {
  sequelize,
  tableName: 'projects',
});

// Associations
(User as any).hasMany(Project, { foreignKey: 'userId', as: 'projects' });
(Project as any).belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Project;
