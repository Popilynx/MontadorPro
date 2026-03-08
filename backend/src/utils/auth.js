const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const generateAccessToken = (montadorId, role) => {
    return jwt.sign({ id: montadorId, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m'
    });
};

const generateRefreshToken = (montadorId, role) => {
    return jwt.sign({ id: montadorId, role }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES || '30d'
    });
};

const verifyToken = (token, secret) => {
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        return null;
    }
};

const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    hashPassword,
    comparePassword
};
