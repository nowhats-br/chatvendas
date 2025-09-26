# Script de limpeza do repositório ChatVendas
# Execute este script como administrador para remover arquivos obsoletos e desnecessários
# Autor: ChatVendas

Write-Host "Iniciando limpeza do repositório ChatVendas..." -ForegroundColor Green

# Lista de diretórios a serem removidos
$diretoriosParaRemover = @(
    # Diretórios de autenticação temporária do WhatsApp
    ".\server\baileys-service\auth_info_baileys",
    ".\server\baileys-service\auth_info_baileys_*",
    ".\server\webjs-service\.wwebjs_auth",
    
    # Diretórios de build e cache
    ".\dist",
    ".\logs"
)

# Função para remover diretórios com segurança
function Remove-DiretorioSeguro {
    param (
        [string]$caminho
    )
    
    $diretoriosEncontrados = Get-Item -Path $caminho -ErrorAction SilentlyContinue
    
    if ($diretoriosEncontrados) {
        foreach ($dir in $diretoriosEncontrados) {
            try {
                Write-Host "Removendo $($dir.FullName)..." -ForegroundColor Yellow
                
                # Primeiro, tenta remover com Remove-Item
                Remove-Item -Path $dir.FullName -Recurse -Force -ErrorAction Stop
                Write-Host "✓ Removido com sucesso: $($dir.FullName)" -ForegroundColor Green
            }
            catch {
                Write-Host "! Erro ao remover com Remove-Item: $($_.Exception.Message)" -ForegroundColor Red
                
                # Se falhar, tenta com rmdir
                try {
                    Write-Host "Tentando método alternativo (rmdir)..." -ForegroundColor Yellow
                    cmd /c "rmdir /s /q `"$($dir.FullName)`""
                    
                    if (-not (Test-Path $dir.FullName)) {
                        Write-Host "✓ Removido com sucesso usando rmdir: $($dir.FullName)" -ForegroundColor Green
                    }
                    else {
                        Write-Host "✗ Não foi possível remover: $($dir.FullName)" -ForegroundColor Red
                    }
                }
                catch {
                    Write-Host "✗ Falha em todos os métodos de remoção para: $($dir.FullName)" -ForegroundColor Red
                }
            }
        }
    }
    else {
        Write-Host "Nenhum diretório encontrado para o padrão: $caminho" -ForegroundColor Blue
    }
}

# Remover diretórios desnecessários
Write-Host "`n=== Removendo diretórios desnecessários ===" -ForegroundColor Cyan
foreach ($dir in $diretoriosParaRemover) {
    Write-Host "Processando: $dir" -ForegroundColor White
    Remove-DiretorioSeguro -caminho $dir
}

# Atualizar .gitignore para evitar commits de arquivos temporários
$gitignorePath = ".\.gitignore"
$gitignoreContent = @"
# Dependências
node_modules/
.pnp/
.pnp.js

# Build
dist/
build/
out/

# Arquivos de ambiente
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Arquivos temporários
.DS_Store
.cache/
*.tmp
*.temp
.Spotlight-V100
.Trashes
Thumbs.db
ehthumbs.db

# Arquivos de autenticação WhatsApp
server/baileys-service/auth_info_baileys*/
server/webjs-service/.wwebjs_auth/

# Arquivos de IDE
.idea/
.vscode/
*.swp
*.swo
"@

Write-Host "`n=== Atualizando .gitignore ===" -ForegroundColor Cyan
try {
    Set-Content -Path $gitignorePath -Value $gitignoreContent -Force
    Write-Host "✓ Arquivo .gitignore atualizado com sucesso" -ForegroundColor Green
}
catch {
    Write-Host "✗ Erro ao atualizar .gitignore: $($_.Exception.Message)" -ForegroundColor Red
}

# Resumo da limpeza
Write-Host "`n=== Limpeza concluída ===" -ForegroundColor Green
Write-Host "Recomendações adicionais:" -ForegroundColor Cyan
Write-Host "1. Execute 'npm prune --production' para remover dependências de desenvolvimento" -ForegroundColor White
Write-Host "2. Execute 'git gc' para limpar o histórico do repositório Git" -ForegroundColor White
Write-Host "3. Para iniciar os serviços novamente, execute:" -ForegroundColor White
Write-Host "   - cd server/baileys-service && npm start" -ForegroundColor White
Write-Host "   - cd server/webjs-service && npm start" -ForegroundColor White