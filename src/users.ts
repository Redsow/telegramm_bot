import bcrypt from 'bcryptjs';

interface User {
    password: string;
    role: string;
}

export const users: { [key: string]: User } = {
    admin: { password: bcrypt.hashSync('admin_password', 8), role: 'admin' },
    user: { password: bcrypt.hashSync('user_password', 8), role: 'user' },
};
