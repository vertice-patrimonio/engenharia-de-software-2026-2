
# Dados Pessoais — Vértice Patrimônio

## 1. Objetivo

Este documento apresenta o inventário dos dados pessoais previstos para o sistema Carteira de Investimentos, desenvolvido na disciplina de Engenharia de Software da Universidade Federal do Tocantins (UFT).

O objetivo é identificar os dados utilizados, suas finalidades, formas de armazenamento, permissões de acesso e questões pendentes relacionadas à privacidade e à proteção de dados.


## 2. Situação atual

O sistema encontra-se em desenvolvimento. As interfaces de cadastro, login e perfil já foram criadas.

O backend possui implementação inicial de autenticação, com senhas protegidas por hash Argon2id e sessões JWT. Também foram adicionadas a integração com PostgreSQL e as consultas para persistência dos dados.

Essas funcionalidades ainda precisam ser validadas por testes de integração, autenticação e controle de acesso.

## 3. Inventário de dados pessoais

| Dado | Finalidade | Quem acessa | Onde fica | Retenção | Situação |
|---|---|---|---|---|---|
| Nome completo | Identificar o usuário | Próprio usuário e backend autorizado | PostgreSQL (previsto) | A definir pela equipe | Previsto no cadastro |
| E-mail | Identificação e autenticação | Próprio usuário e backend autorizado | PostgreSQL (previsto) | A definir pela equipe | Previsto no cadastro |
| Senha | Autenticação da conta | Serviço de autenticação; não deve ser exibida em texto puro | Hash seguro no PostgreSQL (previsto) | A definir pela equipe | Implementação pendente |
| Telefone | Informações de contato | Próprio usuário e backend autorizado | PostgreSQL (previsto) | A definir pela equipe | Presente na interface |
| Perfil de investidor | Identificar preferências e perfil de risco | Próprio usuário e backend autorizado | PostgreSQL (previsto) | A definir pela equipe | Planejado |
| Dados dos investimentos | Gerenciar a carteira | Proprietário e backend autorizado | PostgreSQL (previsto) | A definir pela equipe | Planejado |

## 4. Armazenamento e proteção

O banco de dados escolhido para o projeto é o PostgreSQL.

Está previsto que os dados persistentes sejam armazenados nesse banco, com acesso realizado pelo backend da aplicação.

As senhas deverão ser armazenadas utilizando mecanismos seguros de hash, nunca em texto puro.

As credenciais de serviços externos e do banco de dados não deverão ser expostas no código-fonte.

## 5. Controle de acesso

A política prevista estabelece que:

- Cada usuário deverá acessar somente suas próprias informações.
- O acesso à carteira dependerá de autenticação.
- Operações de consulta e alteração deverão verificar a identidade do usuário.
- Usuários não autenticados não poderão acessar informações privadas.

Essas medidas deverão ser verificadas após a implementação da autenticação e autorização no backend.

## 6. Retenção e exclusão

Os períodos de retenção dos dados pessoais ainda precisam ser definidos pela equipe.

Também será necessário estabelecer o procedimento para exclusão ou anonimização de informações quando aplicável.

Até essa definição, não se considera implementada uma política completa de retenção e exclusão.


## 7. Questões pendentes

- [ ] Definir os períodos de retenção dos dados pessoais.
- [ ] Estabelecer o procedimento de exclusão de contas e dados pessoais.
- [ ] Validar o funcionamento dos controles de autenticação e autorização implementados no backend.
- [ ] Revisar as informações de segurança e privacidade apresentadas nas interfaces.

## 8. Considerações finais

O sistema deverá adotar medidas de segurança e privacidade compatíveis com os dados tratados, considerando os princípios da Lei Geral de Proteção de Dados Pessoais (LGPD).

Este documento deverá ser atualizado conforme a implementação das funcionalidades e as decisões da equipe.
