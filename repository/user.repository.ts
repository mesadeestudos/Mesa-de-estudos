// Usando um mock para simular um banco
// Definição do tipo User (estrutura de um usuário)
type User = {
  id: string                // identificador único do usuário
  nome: string              // nome do usuário
  email: string             // email do usuário (usado no login)
  senha: string             // senha do usuário (hash futuramente)
  primeiroAcesso: boolean   // indica se é o primeiro acesso do usuário
}


// Array que vai simular o banco de dados
// Enquanto o banco real (Prisma) não existe,
// os usuários serão armazenados aqui em memória
const users: User[] = []


// Função para buscar um usuário pelo email
export async function findUserByEmail(email: string) {

  // procura no array um usuário com o email informado
  return users.find(user => user.email === email)

}


// Função para criar um novo usuário
export async function createUser(user: User) {

  // adiciona o novo usuário no array
  users.push(user)

  // retorna o usuário criado
  return user

}