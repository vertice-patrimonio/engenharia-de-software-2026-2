# Dados Pessoais — Vértice Patrimônio

## 1. Objetivo

Este documento apresenta o inventário dos dados pessoais envolvidos no desenvolvimento do sistema Carteira de Investimentos, elaborado na disciplina de Engenharia de Software da Universidade Federal do Tocantins (UFT).

O objetivo é identificar os dados utilizados, suas finalidades, formas de armazenamento, mecanismos de proteção e questões pendentes relacionadas à privacidade.

## 2. Situação atual

O sistema encontra-se em desenvolvimento, com interfaces de cadastro, login e perfil já criadas.

O backend possui implementação inicial de cadastro e autenticação de usuários, utilizando senhas protegidas por hash Argon2id e sessões JWT armazenadas em cookies HTTP-only.

Também foram adicionadas a conexão com PostgreSQL, as consultas SQL e a configuração inicial do banco de dados por meio de Docker Compose.

Entretanto, os formulários de cadastro e login ainda precisam ser integrados às respectivas APIs. O funcionamento completo das funcionalidades, da persistência e dos controles de acesso também depende de testes.

Dessa forma, este documento diferencia os recursos implementados no código daqueles que ainda necessitam de integração e validação.

## 3. Inventário de dados pessoais

| Dado | Finalidade | Armazenamento | Situação |
|---|---|---|---|
| Nome | Identificação do usuário | PostgreSQL — tabela `usuarios` | Implementado no backend |
| E-mail | Identificação e autenticação | PostgreSQL — tabela `usuarios` | Implementado no backend |
| Senha | Autenticação | Hash Argon2id na tabela `usuarios` | Proteção implementada no backend |
| Telefone | Informação de contato | Apenas estado local da interface | Persistência não implementada |
| Perfil de investidor | Registrar o perfil de risco do usuário | PostgreSQL — tabela `usuarios` | Campo e atualização implementados no backend |
| Dados da carteira e investimentos | Organizar e acompanhar investimentos | PostgreSQL — tabelas `carteiras` e `investimentos` | Estrutura e consultas implementadas |
| Histórico de operações | Registrar compras e vendas informadas pelo usuário | PostgreSQL — tabela `operacoes` | Estrutura e consultas implementadas |

Os dados associados às carteiras e operações podem ser considerados informações pessoais quando vinculados a um usuário identificável.

O CPF não integra o modelo de persistência atual nem os dados processados pela API de cadastro. Entretanto, o campo ainda aparece nas interfaces de cadastro e perfil, sendo necessária sua retirada pela equipe responsável.

As informações registradas nesta seção correspondem à implementação identificada no repositório e não representam confirmação de funcionamento completo em ambiente de produção.

## 4. Armazenamento e proteção

O banco de dados relacional escolhido para o projeto é o PostgreSQL.

A aplicação possui uma camada inicial de acesso ao banco utilizando a biblioteca `pg` e consultas SQL parametrizadas.

As senhas são transformadas em hashes utilizando o algoritmo Argon2id antes do armazenamento.

A autenticação utiliza tokens JWT assinados, armazenados em cookies configurados como HTTP-only, com atributo `SameSite=Lax` e opção `Secure` habilitada em ambiente de produção.

O acesso ao banco, as chaves de sessão e os serviços externos dependem de variáveis de ambiente. Essas credenciais devem permanecer protegidas e não devem ser incluídas no repositório.

A existência desses mecanismos não substitui a necessidade de testes e verificações de segurança.

## 5. Controle de acesso

O backend possui verificações de autenticação em rotas relacionadas aos usuários, carteiras, investimentos e operações.

As rotas protegidas utilizam a identificação da sessão e retornam HTTP 401 quando não existe autenticação válida.

As consultas da carteira utilizam o identificador do usuário autenticado para buscar seus respectivos registros.

Entretanto, a efetividade dessas verificações ainda precisa ser confirmada por testes, especialmente quanto à tentativa de acesso aos dados de outros usuários.

A rota `/api/db-check`, utilizada para diagnóstico da conexão com PostgreSQL, também precisa ser revisada antes da implantação, pois atualmente não exige autenticação.

## 6. Retenção e exclusão

Os períodos de retenção dos dados pessoais ainda não foram definidos pela equipe.

O banco possui relacionamentos e regras de integridade referencial, mas não foi identificada uma funcionalidade completa para que o usuário solicite a exclusão de sua conta.

Será necessário estabelecer um procedimento para exclusão ou anonimização de dados pessoais, quando aplicável, considerando as necessidades do sistema e os requisitos legais pertinentes.

Até essas definições, não se considera concluída a política de retenção e exclusão de dados.

## 7. Questões pendentes

- [ ] Definir os períodos de retenção dos dados pessoais.
- [ ] Estabelecer o procedimento de exclusão de contas e dados pessoais.
- [ ] Validar os controles de autenticação e autorização implementados no backend.
- [ ] Confirmar a integração das interfaces de cadastro e login com as APIs.
- [ ] Revisar as informações de segurança e privacidade apresentadas nas interfaces, incluindo a retirada do CPF.
- [ ] Revisar a exposição de informações técnicas pela rota de diagnóstico do banco de dados.

## 8. Considerações finais

O desenvolvimento do Vértice Patrimônio contempla mecanismos iniciais de proteção de dados, incluindo armazenamento de senhas por hash, autenticação por sessão e restrição de acesso às informações privadas.

Entretanto, a implementação dessas medidas não representa, isoladamente, comprovação de conformidade integral com a Lei Geral de Proteção de Dados Pessoais (LGPD).

A documentação deverá acompanhar a evolução do projeto, especialmente após a conclusão dos testes, da integração das interfaces e das decisões da equipe sobre retenção e exclusão de informações pessoais.
