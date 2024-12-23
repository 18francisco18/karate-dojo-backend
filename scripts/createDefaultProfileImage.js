const fs = require('fs');
const path = require('path');

// Base64 string of a simple avatar icon (you can replace this with any other base64 image)
const defaultImageBase64 = `iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAADdgAAA3YBfdWCzAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAA0cSURBVHic7Z15kBvVmcB/r1v3HJqey+MDY4bBHhvbGEOWYGMOBwI4hBCyBAIhG5JNyG6ShZAsuVjCZrObbEJ2k3VqQ0J2E5IA4QgQMBCHA2PAJuYwYGyDj/F4xvaMZ0b3pdavpJb6/dEz8tgjqUfqllrS6FdVXeOR+n3ve/3e97773ZJEKcUCc5NZwBPAMmAE+BHwHFDKd6EWyD1PAq3A54EfAFcAXwLuz2ehFsg9y4EfAzuBPwK7gB8C6/NZqAXyjwTMABqgAzpgAhYDdqAMsM5+ZoF5xgKgLwAAAABJRU5ErkJggg==`;

const uploadDir = path.join(__dirname, '..', 'uploads', 'profile-images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const buffer = Buffer.from(defaultImageBase64, 'base64');
fs.writeFileSync(path.join(uploadDir, 'default-profile.png'), buffer);

console.log('Default profile image created successfully!');
