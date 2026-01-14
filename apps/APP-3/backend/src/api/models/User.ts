
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import bcrypt from 'bcryptjs';

// Interface for User attributes
interface UserAttributes {
  id: string;
  email: string;
  password_hash: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for User creation, making some fields optional and adding a plain password field
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {
  password?: string;
}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password_hash!: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance method to check password
  public checkPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }
}

(User as any).init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'users',
  hooks: {
    beforeSave: async (user: User, options: any) => {
      // Access the plain password from the special 'password' field if it exists
      const plainPassword = (user as any).password;
      if (plainPassword) {
         const salt = await bcrypt.genSalt(10);
         user.password_hash = await bcrypt.hash(plainPassword, salt);
      }
    },
  }
});

export default User;
