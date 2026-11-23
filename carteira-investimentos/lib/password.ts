import * as argon2 from "argon2";

// Gerar hash da senha
export async function gerarHash(senha: string): Promise<string> {
  return await argon2.hash(senha, {
    type: argon2.argon2id,
  });
}

// Verificar se a senha corresponde ao hash
export async function verificarSenha(
  senha: string,
  hash: string,
): Promise<boolean> {
  return await argon2.verify(hash, senha);
}
