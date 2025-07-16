# 🚀 Setup do Repositório NEAT Trading System

## Passos para subir o projeto para o GitHub:

### 1. Criar o Repositório no GitHub
1. Acesse [GitHub](https://github.com)
2. Clique em "New repository" ou vá para https://github.com/new
3. Configure o repositório:
   - **Repository name**: `NEAT`
   - **Description**: `Advanced NEAT-based algorithmic trading system with technical and fundamental analysis`
   - **Visibility**: Public (ou Private se preferir)
   - **NÃO** marque "Add a README file"
   - **NÃO** marque "Add .gitignore"
   - **NÃO** marque "Choose a license"
4. Clique em "Create repository"

### 2. Comandos para executar no terminal:

```bash
# Verificar status atual
git status

# Fazer push para o novo repositório
git push -u origin main
```

### 3. Se der erro de autenticação:

#### Opção A - HTTPS com Token:
```bash
# Configure seu token de acesso pessoal
git remote set-url origin https://[SEU_TOKEN]@github.com/Lulucsqa/NEAT.git
git push -u origin main
```

#### Opção B - SSH (recomendado):
```bash
# Configure SSH (se ainda não tiver)
git remote set-url origin git@github.com:Lulucsqa/NEAT.git
git push -u origin main
```

### 4. Verificar se funcionou:
- Acesse https://github.com/Lulucsqa/NEAT
- Você deve ver todos os arquivos do projeto

## 📋 Checklist pós-upload:

- [ ] Repositório criado no GitHub
- [ ] Código enviado com sucesso
- [ ] README.md aparecendo corretamente
- [ ] Estrutura de pastas organizada
- [ ] .gitignore funcionando (node_modules não deve aparecer)

## 🎯 Próximos passos após o upload:

1. **Configurar GitHub Pages** (opcional):
   - Settings → Pages → Source: Deploy from a branch
   - Branch: main, folder: / (root)
   - Sua interface web ficará disponível em: https://lulucsqa.github.io/NEAT/

2. **Configurar Actions** (opcional):
   - Criar workflows para testes automáticos
   - Deploy automático

3. **Adicionar badges ao README**:
   - Status dos testes
   - Versão do Node.js
   - Licença

## 🔧 Comandos úteis para manutenção:

```bash
# Atualizar repositório
git add .
git commit -m "Descrição das mudanças"
git push

# Criar nova branch para features
git checkout -b feature/nova-funcionalidade
git push -u origin feature/nova-funcionalidade

# Ver histórico
git log --oneline

# Ver diferenças
git diff
```

## 📞 Suporte:

Se encontrar problemas:
1. Verifique se o repositório foi criado no GitHub
2. Confirme suas credenciais de acesso
3. Tente usar SSH em vez de HTTPS
4. Verifique se não há arquivos muito grandes (>100MB)