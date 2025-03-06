import mongoose from "mongoose";

// Definição do schema base para os tokens
const tokenSchema = new mongoose.Schema({
  ownerId: { type: String, required: true }, // tenantId ou franchiseId
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Criar coleções separadas para Tenant e Franchisee
const TenantTokenModel = mongoose.model(
  "TenantPushNotificationToken",
  tokenSchema
);
const FranchiseTokenModel = mongoose.model(
  "FranchisePushNotificationToken",
  tokenSchema
);

// Enum para definir os tipos permitidos
type OwnerType = "tenant" | "franchisee";

// Função genérica para salvar ou atualizar o token na coleção correta
export async function saveToken(
  ownerType: OwnerType,
  ownerId: string,
  token: string
): Promise<void> {
  try {
    // Seleciona o modelo correto com base no tipo de owner
    const Model =
      ownerType === "tenant" ? TenantTokenModel : FranchiseTokenModel;

    // Verifica se o token já existe para o ownerId
    const existingToken = await Model.findOne({ ownerId });

    if (existingToken) {
      // Atualiza o token existente
      existingToken.token = token;
      await existingToken.save();
    } else {
      // Cria um novo registro
      await Model.create({ ownerId, token });
    }

    console.log(`[${ownerType}] Token salvo com sucesso!`);
  } catch (error) {
    console.error(`[${ownerType}] Erro ao salvar o token:`, error);
    throw new Error("Erro ao salvar o token.");
  }
}

export async function getToken(ownerType: OwnerType, ownerId: string) {
  try {
    // Seleciona o modelo correto com base no tipo de owner
    const Model =
      ownerType === "tenant" ? TenantTokenModel : FranchiseTokenModel;

    // Busca o token pelo ownerId
    const tokenDoc = await Model.findOne({ ownerId });

    if (tokenDoc) {
      return tokenDoc.token;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`[${ownerType}] Erro ao obter o token:`, error);
    throw new Error("Erro ao obter o token.");
  }
}
