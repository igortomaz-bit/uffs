const crypto = require('crypto')
const sha256 = (content) => crypto.createHash('sha256').update(content).digest('hex');
const { sign } = require('jsonwebtoken')

class SessionService {
  createSession({ login, password }) {
    if (!login || !password) {
      throw new Error('Client sent incorret login or password.')
    }

    const encryptedPassword = sha256(password);
    const secret = process.env.SECRET || 'base_secret';
    let defaultPassword = process.env.DEFAULT_PASSWORD || 'teste';
    defaultPassword = sha256(defaultPassword);

    if (encryptedPassword !== defaultPassword)
      throw new Error('User was not authenticated, password was not recognized.')

    const token = sign({}, secret, {
      subject: login,
      expiresIn: '1d'
    });

    return { token };
  }
}

module.exports = new SessionService()