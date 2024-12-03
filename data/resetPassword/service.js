const mongoose = require('mongoose');
const ResetPasswordModel = require('./model');

class ResetPasswordService {
  // Criar uma nova solicitação de redefinição de senha
  static async createResetRequest(email, resetCode) {
    try {
      console.log("Creating reset request:", { email, resetCode });
      // Remover solicitações de redefinição de senha anteriores para este email
      await ResetPasswordModel.deleteMany({ email });

      // Criar nova solicitação de redefinição de senha
      const resetRequest = new ResetPasswordModel({
        email,
        resetCode,
        expiresAt: new Date(Date.now() + 3600000) // 1 hora de validade
      });

      await resetRequest.save();
      console.log("Reset request created:", resetRequest);
      return resetRequest;
    } catch (error) {
      console.error('Erro ao criar solicitação de redefinição de senha:', {
        email, 
        resetCode,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Encontrar uma solicitação de redefinição de senha válida
  static async findValidResetRequest(email, resetCode) {
    try {
      console.log("Finding valid reset request:", { email, resetCode });
      const resetRequest = await ResetPasswordModel.findOne({
        email,
        resetCode,
        expiresAt: { $gt: new Date() }, // Verifica se não expirou
        used: false // Verifica se não foi usado
      });

      console.log("Reset request found:", !!resetRequest);
      return resetRequest;
    } catch (error) {
      console.error('Erro ao buscar solicitação de redefinição de senha:', {
        email, 
        resetCode,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Invalidar a solicitação de redefinição de senha após uso
  static async invalidateResetRequest(email, resetCode) {
    try {
      console.log("Invalidating reset request:", { email, resetCode });
      const result = await ResetPasswordModel.findOneAndUpdate(
        { email, resetCode },
        { used: true }
      );

      console.log("Invalidation result:", !!result);
      return result;
    } catch (error) {
      console.error('Erro ao invalidar solicitação de redefinição de senha:', {
        email, 
        resetCode,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

module.exports = ResetPasswordService;
