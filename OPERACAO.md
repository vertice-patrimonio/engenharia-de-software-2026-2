## **Operação do sistema Vértice — Carteira de Investimentos**

Este documento descreve como executar, implantar e acompanhar o sistema Vértice. Ele registra o estado atual do projeto e as atividades que ainda dependem de implementação ou de decisões da equipe.

## **Onde roda**

**Desenvolvimento**  
**\- Status: Implementado.**  
A aplicação é executada localmente nas máquinas dos integrantes durante o desenvolvimento.  
\- A aplicação está na pasta \`carteira-investimentos\` e utiliza Next.js e TypeScript.  
\- Para iniciar o ambiente de desenvolvimento:  
	1\. cd carteira-investimentos  
2\. npm install  
3\. npm run dev  
A aplicação ficará disponível no endereço local informado pelo Next.js, normalmente [http\://localhost:3000](http://localhost:3000).

**Ambiente Publicado**  
**\- Status: Publicado na Vercel.**  
A aplicação possui uma versão pública hospedada na Vercel:  
\[Acessar Aplicação VÉRTICE\]([https\://engenharia-de-software-2026-2.vercel.app/](https://engenharia-de-software-2026-2.vercel.app/))

A classificação desse ambiente como produção, demonstração ou homologação ainda deverá ser definida pela equipe.

**Homologação**  
**\- Status: Pendente de Definição.**  
Ainda não foi identificado um ambiente separado de homologação. A equipe ainda deve definir se será utilizado um ambiente específico para validar alterações antes de disponibilizá-las na versão pública.

**Banco de dados**  
O projeto utiliza o Supabase como serviço de banco de dados, baseado em PostgreSQL, com acesso realizado pela biblioteca oficial \`@supabase/supabase-js\`.

Também existem configurações para conexão PostgreSQL direta utilizando a biblioteca \`pg\`, além de um ambiente local configurado pelo Docker Compose.  
A utilização desses ambientes e a integração entre eles devem ser verificadas pela equipe.

## **Configuração**

**Status: Variáveis de ambiente identificadas; configuração dos ambientes em validação.**

A aplicação utiliza variáveis de ambiente para configurar a conexão com o banco de dados, o acesso ao serviço de cotações e a proteção das sessões de autenticação.

| Variável | Finalidade |
| ----- | :---: |
| \`SUPABASE\_URL\` | Endereço do projeto Supabase  |
| \`NEXT\_PUBLIC\_SUPABASE\_PUBLISHABLE\_KEY\` | Chave pública para acesso ao Supabase  |
| \`SUPABASE\_SERVICE\_ROLE\_KEY\` | Chave privada para operações administrativas no servidor  |
| \`AUTH\_SECRET\` | proteção das assinaturas das sessões  |
| \`BRAPI\_KEY\` | Acesso à API de cotações da BRAPI  |
| \`DATABASE\_URL\` | Conexão PostgreSQL utilizada pelo script de sincronização de ativos  |

**Desenvolvimento**  
As variáveis devem ser configuradas em um arquivo local de ambiente, como \`.env.local\`, dentro da pasta \`carteira-investimentos.\`  
Os valores devem ser fornecidos e mantidos pelos responsáveis pela configuração do ambiente.

**Configuração na hospedagem**  
Para a versão hospedada na Vercel, as variáveis necessárias devem ser cadastradas nas configurações do projeto, na seção de variáveis de ambiente.  
Caso o script de sincronização de ativos seja executado em um ambiente hospedado, a variável \`DATABASE\_URL\` deverá apontar para um banco acessível por esse ambiente. O endereço \`localhost\` representa a própria máquina ou ambiente onde o script está sendo executado. 

### **Segurança**

### 1\. Não inserir senhas, tokens, chaves de API ou segredos diretamente no código. 2\. Não enviar arquivos com credenciais para o GitHub. 3\. Manter os arquivos de ambiente local protegidos pelo \`.gitignore.\` 4\. Utilizar configurações próprias para desenvolvimento e hospedagem. 5\. Em caso de exposição de credenciais, realizar a substituição dos valores comprometidos e atualizar os ambientes correspondentes.

Um arquivo \`.env.example\` poderá ser mantido no repositório, contendo somente os nomes das variáveis e valores fictícios de exemplo.

## **Testes e integração contínua**

**Status: Configurado no GitHub Actions.**

O projeto possui um fluxo automatizado definido em:  
\`.github/workflows/teste.yml\`  
Esse fluxo é executado em alterações direcionadas à branch main, incluindo envios e pull requests.

As verificações configuradas são:

1\. Instalação das dependências.  
2\. Verificação de código com ESLint.  
3\. Verificação de formatação com Prettier.  
4\. Execução de testes de unidade e componentes com cobertura.  
5\. Execução de testes ponta a ponta com Playwright.

Os testes podem ser executados localmente dentro da pasta \`carteira-investimentos\`:  
npm test  
npm run test:coverage  
npm run test:e2e  
npm run lint  
npm run format:check

O resultado das verificações deve ser acompanhado na aba Actions do GitHub.  
Referências: \`TESTES.md\` e \`.github/workflows/teste.yml\`.

## **Implantação de versões**

**Status: Publicação existente; procedimento a documentar.**

A aplicação já possui uma versão hospedada na Vercel.

Antes de disponibilizar alterações, a equipe deverá:

1\. Verificar se as alterações foram integradas à branch principal.  
2\. Conferir os resultados dos testes automatizados no GitHub Actions.  
3\. Verificar se a publicação na Vercel foi concluída.  
4\. Acessar a aplicação publicada e validar os principais fluxos.  
5\. Registrar problemas encontrados e correções necessárias.

A equipe ainda deverá documentar o mecanismo de publicação utilizado pela Vercel e definir um procedimento de retorno à versão anterior.

**Banco de dados e segurança**

**Status: Implementação inicial, com validações pendentes.**  
A aplicação utiliza o Supabase para acessar os dados de usuários, carteiras e investimentos.  
O projeto também possui uma estrutura PostgreSQL local, configurada pelo Docker Compose, com tabelas para usuários, ativos, carteiras, investimentos e operações.  
A integração e a sincronização entre esses ambientes ainda precisam ser verificadas pela equipe. A integração completa e a validação da persistência ainda dependem de testes.  
O backend possui mecanismos iniciais de proteção, incluindo:  
1\. Proteção de senhas com \`bcryptjs\`  
2\. Sessões assinadas com HMAC-SHA256  
3\. Validade padrão das sessões de 7 dias  
4\. Cookies configurados como HTTP-only   
5\. Proteção do cookie em produção com \`Secure\`

Ainda são necessárias verificações dos controles de acesso, da integração dos formulários com as APIs e da exposição de informações técnicas.  
Referência: \`DADOS-PESSOAIS.md.\`

**Cópias de segurança e recuperação**

**Status: Pendente de definição.**  
A equipe deverá estabelecer:  
1\. Frequência das cópias de segurança.  
2\. Local seguro de armazenamento.  
3\. Responsáveis pela execução.  
4\. Procedimento de restauração.  
5\. Periodicidade dos testes de recuperação.

Os procedimentos deverão ser registrados depois de definidos e testados.

**Responsáveis pela operação**

**Status: Pendente de definição.**  
As responsabilidades técnicas de frontend, backend e banco de dados estão descritas em \`docs/arquitetura.md\`.  
A equipe deverá definir também os responsáveis pela publicação, manutenção da hospedagem, cópias de segurança e acompanhamento de possíveis falhas.

**Pendências Operacionais**

**Status: Pendente de definição.**

* Definir a classificação do ambiente hospedado na Vercel.  
* Documentar o procedimento de publicação e retorno de versão.  
* Atualizar os nomes e identificar onde cada variável é utilizada.  
* Validar a integração com Supabase e esclarecer a utilização do PostgreSQL local.  
* Testar os controles de autenticação e autorização.  
* Definir procedimentos de backup e restauração.  
* Definir os responsáveis pelas atividades operacionais.