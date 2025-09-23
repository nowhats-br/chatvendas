const { v4: uuidv4 } = require('uuid');

/**
 * Gerenciador centralizado de sessões para múltiplas conexões WhatsApp
 * Suporta tanto Baileys quanto Web.js
 */
class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.connectionsBySocket = new Map();
    this.sessionTimeout = parseInt(process.env.SESSION_TIMEOUT) || 3600000; // 1 hora
  }

  /**
   * Cria uma nova sessão
   * @param {string} provider - 'baileys' ou 'web.js'
   * @param {string} socketId - ID do socket cliente
   * @param {Object} connectionInstance - Instância da conexão
   * @returns {string} sessionId
   */
  createSession(provider, socketId, connectionInstance) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      provider,
      socketId,
      connection: connectionInstance,
      status: 'initializing',
      phoneNumber: null,
      createdAt: new Date(),
      lastActivity: new Date(),
      metadata: {}
    };

    this.sessions.set(sessionId, session);
    
    // Mapear socket para sessões
    if (!this.connectionsBySocket.has(socketId)) {
      this.connectionsBySocket.set(socketId, new Set());
    }
    this.connectionsBySocket.get(socketId).add(sessionId);

    // Configurar timeout automático
    this.setSessionTimeout(sessionId);

    console.log(`📱 Nova sessão criada: ${sessionId} (${provider})`);
    return sessionId;
  }

  /**
   * Obtém uma sessão pelo ID
   * @param {string} sessionId 
   * @returns {Object|null}
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Obtém todas as sessões de um socket
   * @param {string} socketId 
   * @returns {Array}
   */
  getSessionsBySocket(socketId) {
    const sessionIds = this.connectionsBySocket.get(socketId) || new Set();
    return Array.from(sessionIds).map(id => this.sessions.get(id)).filter(Boolean);
  }

  /**
   * Obtém todas as sessões ativas
   * @returns {Array}
   */
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Obtém sessões por provedor
   * @param {string} provider 
   * @returns {Array}
   */
  getSessionsByProvider(provider) {
    return Array.from(this.sessions.values()).filter(session => session.provider === provider);
  }

  /**
   * Atualiza o status de uma sessão
   * @param {string} sessionId 
   * @param {string} status 
   * @param {Object} metadata 
   */
  updateSessionStatus(sessionId, status, metadata = {}) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = status;
      session.lastActivity = new Date();
      session.metadata = { ...session.metadata, ...metadata };
      
      if (metadata.phoneNumber) {
        session.phoneNumber = metadata.phoneNumber;
      }

      console.log(`📊 Sessão ${sessionId} atualizada: ${status}`);
    }
  }

  /**
   * Remove uma sessão
   * @param {string} sessionId 
   * @returns {boolean}
   */
  async removeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    try {
      // Desconectar a instância se existir
      if (session.connection && typeof session.connection.disconnect === 'function') {
        await session.connection.disconnect();
      }

      // Remover dos mapeamentos
      this.sessions.delete(sessionId);
      
      const socketSessions = this.connectionsBySocket.get(session.socketId);
      if (socketSessions) {
        socketSessions.delete(sessionId);
        if (socketSessions.size === 0) {
          this.connectionsBySocket.delete(session.socketId);
        }
      }

      // Limpar timeout
      if (session.timeoutId) {
        clearTimeout(session.timeoutId);
      }

      console.log(`🗑️ Sessão removida: ${sessionId}`);
      return true;
    } catch (error) {
      console.error(`Erro ao remover sessão ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Remove todas as sessões de um socket
   * @param {string} socketId 
   */
  async removeSessionsBySocket(socketId) {
    const sessionIds = Array.from(this.connectionsBySocket.get(socketId) || []);
    
    for (const sessionId of sessionIds) {
      await this.removeSession(sessionId);
    }
  }

  /**
   * Configura timeout automático para uma sessão
   * @param {string} sessionId 
   */
  setSessionTimeout(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Limpar timeout anterior se existir
    if (session.timeoutId) {
      clearTimeout(session.timeoutId);
    }

    // Configurar novo timeout
    session.timeoutId = setTimeout(async () => {
      console.log(`⏰ Timeout da sessão: ${sessionId}`);
      await this.removeSession(sessionId);
    }, this.sessionTimeout);
  }

  /**
   * Renova o timeout de uma sessão (chamado em atividade)
   * @param {string} sessionId 
   */
  renewSessionTimeout(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      this.setSessionTimeout(sessionId);
    }
  }

  /**
   * Limpa sessões inativas
   */
  cleanupInactiveSessions() {
    const now = new Date();
    const inactiveThreshold = this.sessionTimeout;

    for (const [sessionId, session] of this.sessions.entries()) {
      const inactiveTime = now - session.lastActivity;
      
      if (inactiveTime > inactiveThreshold) {
        console.log(`🧹 Limpando sessão inativa: ${sessionId}`);
        this.removeSession(sessionId);
      }
    }
  }

  /**
   * Obtém estatísticas das sessões
   * @returns {Object}
   */
  getStats() {
    const sessions = Array.from(this.sessions.values());
    const stats = {
      total: sessions.length,
      byProvider: {},
      byStatus: {},
      activeSockets: this.connectionsBySocket.size
    };

    sessions.forEach(session => {
      // Por provedor
      stats.byProvider[session.provider] = (stats.byProvider[session.provider] || 0) + 1;
      
      // Por status
      stats.byStatus[session.status] = (stats.byStatus[session.status] || 0) + 1;
    });

    return stats;
  }

  /**
   * Inicia limpeza automática de sessões inativas
   */
  startCleanupInterval() {
    // Executar limpeza a cada 30 minutos
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, 30 * 60 * 1000);

    console.log('🔄 Limpeza automática de sessões iniciada');
  }
}

// Instância singleton
const sessionManager = new SessionManager();

// Iniciar limpeza automática
sessionManager.startCleanupInterval();

module.exports = sessionManager;