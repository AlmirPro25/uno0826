
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import User from './User';

// Reflects frontend's InteractionLogData
interface InteractionLogAttributes {
  id: string;
  interactionId: string;
  timestamp: Date;
  userPrompt: string;
  initialGeminiCode: string;
  finalUserCode: string;
  modelVersionUsed: string;
  feedbackSignal?: string;
  userRating?: 'liked' | 'disliked';
  isGoodForTraining?: boolean;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type InteractionLogCreationAttributes = Optional<InteractionLogAttributes, 'id' | 'createdAt' | 'updatedAt'>;

class InteractionLog extends Model<InteractionLogAttributes, InteractionLogCreationAttributes> implements InteractionLogAttributes {
  public id!: string;
  public interactionId!: string;
  public timestamp!: Date;
  public userPrompt!: string;
  public initialGeminiCode!: string;
  public finalUserCode!: string;
  public modelVersionUsed!: string;
  public feedbackSignal?: string;
  public userRating?: 'liked' | 'disliked';
  public isGoodForTraining?: boolean;
  public userId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

(InteractionLog as any).init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  interactionId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  userPrompt: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
  initialGeminiCode: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  finalUserCode: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  modelVersionUsed: {
    type: DataTypes.STRING,
    allowNull: false
  },
  feedbackSignal: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userRating: {
    type: DataTypes.ENUM('liked', 'disliked'),
    allowNull: true
  },
  isGoodForTraining: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
  tableName: 'interaction_logs',
});

// Associations
(User as any).hasMany(InteractionLog, { foreignKey: 'userId', as: 'interactionLogs' });
(InteractionLog as any).belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default InteractionLog;
