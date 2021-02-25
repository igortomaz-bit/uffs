const sessionService = require('../services/session');

class SessionController {
  async index(request, response) {
    try {
      const { login, password } = request.body;

      const { token } = sessionService.createSession({
        login, 
        password
      });

      response.json({ token });
    } catch (error) {
      return response.status(400).json({error: error.message })
    }
  }
}

module.exports = new SessionController()