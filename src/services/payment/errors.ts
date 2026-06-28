// Erro compartilhado pelos gateways: assinatura de webhook inválida.
// A rota de webhook responde 401 ao capturá-lo (planoassic §4.5).
export class AssinaturaInvalidaError extends Error {
  constructor() {
    super("Assinatura do webhook inválida");
    this.name = "AssinaturaInvalidaError";
  }
}
