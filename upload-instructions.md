# 🚀 Instruções para Upload do NEAT Trading System

## Problema Atual
Estamos enfrentando um erro de permissão (403) ao tentar fazer push para o repositório. Isso acontece porque as credenciais atuais não têm acesso ao repositório.

## Solução: Fazer Upload Manual

### Opção 1: Usando GitHub Desktop
1. Instale o [GitHub Desktop](https://desktop.github.com/)
2. Abra o GitHub Desktop e faça login na sua conta
3. Clique em "File" > "Add local repository"
4. Navegue até a pasta do projeto NEAT Trading System
5. Selecione o repositório e clique em "Add repository"
6. Clique em "Publish repository"
7. Selecione seu repositório "NEAT100" e clique em "Publish"

### Opção 2: Usando Git na Linha de Comando

```bash
# No seu computador pessoal, navegue até a pasta do projeto
cd caminho/para/NEAT-Trading-System

# Configure suas credenciais
git config user.name "Seu Nome"
git config user.email "seu.email@exemplo.com"

# Adicione o repositório remoto
git remote add origin https://github.com/Lulucsqa/NEAT100.git

# Faça o push
git push -u origin main
```

Se for solicitado login, use suas credenciais do GitHub.

### Opção 3: Usando Token de Acesso Pessoal

1. Acesse [GitHub > Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Clique em "Generate new token"
3. Dê um nome ao token (ex: "NEAT Upload")
4. Selecione o escopo "repo"
5. Clique em "Generate token"
6. Copie o token gerado

```bash
# Configure o remote com o token
git remote set-url origin https://SEU_TOKEN@github.com/Lulucsqa/NEAT100.git

# Faça o push
git push -u origin main
```

## Verificação

Após o upload, acesse https://github.com/Lulucsqa/NEAT100 para verificar se todos os arquivos foram enviados corretamente.

## Arquivos Importantes

O projeto está completamente reorganizado e pronto para uso:

- `src/` - Código principal reorganizado
- `README.md` - Documentação completa
- `index.html` - Interface web
- `package.json` - Dependências e scripts

## Próximos Passos

1. Clone o repositório em seu ambiente de desenvolvimento
2. Execute `npm install` para instalar as dependências
3. Execute `npm start` para iniciar o sistema
4. Execute `npm test` para rodar os testes

## Suporte

Se encontrar problemas, verifique:
- Se você tem permissões de escrita no repositório
- Se suas credenciais do GitHub estão corretas
- Se o repositório existe e está acessível