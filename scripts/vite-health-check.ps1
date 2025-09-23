# Vite Health Check Script (Windows PowerShell Version)
# Verifica a integridade da instalação do Vite e corrige problemas automaticamente

param(
    [string]$ProjectPath = ".",
    [string]$User = $env:USERNAME
)

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Test-ViteIntegrity {
    param([string]$Path)
    
    Write-Log "Iniciando verificação de integridade do Vite..." "INFO"
    
    # Verificar se estamos no diretório correto
    if (-not (Test-Path "$Path\package.json")) {
        Write-Log "Arquivo package.json não encontrado em $Path" "ERROR"
        return $false
    }
    
    # Verificar se node_modules existe
    if (-not (Test-Path "$Path\node_modules")) {
        Write-Log "Diretório node_modules não encontrado" "ERROR"
        return $false
    }
    
    # Verificar se Vite está instalado
    if (-not (Test-Path "$Path\node_modules\vite")) {
        Write-Log "Vite não encontrado em node_modules" "ERROR"
        return $false
    }
    
    # Testar se Vite é executável
    try {
        Push-Location $Path
        
        # Verificar se Vite está listado nas dependências
        $npmListOutput = & npm list vite 2>&1 | Out-String
        $npmListExitCode = $LASTEXITCODE
        
        if ($npmListExitCode -eq 0 -and $npmListOutput -match "vite@") {
            Write-Log "Vite encontrado nas dependências: $($npmListOutput | Select-String 'vite@')" "SUCCESS"
            
            # Testar se npx vite funciona
            $viteTestOutput = & npx vite --version 2>&1 | Out-String
            $viteTestExitCode = $LASTEXITCODE
            
            if ($viteTestExitCode -eq 0) {
                Write-Log "Vite executável e funcional: versão $viteTestOutput" "SUCCESS"
                return $true
            } else {
                Write-Log "Vite instalado mas não executável: $viteTestOutput" "WARN"
                return $false
            }
        } else {
            Write-Log "Vite não está corretamente instalado: $npmListOutput" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Erro ao verificar Vite: $($_.Exception.Message)" "ERROR"
        return $false
    }
    finally {
        Pop-Location
    }
}

function Repair-ViteInstallation {
    param([string]$Path)
    
    Write-Log "Iniciando reparo da instalação do Vite..." "WARN"
    
    try {
        Push-Location $Path
        
        # Limpar cache do Vite
        Write-Log "Limpando cache do Vite..." "INFO"
        if (Test-Path "node_modules\.vite") {
            Remove-Item "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        # Limpar pasta dist
        if (Test-Path "dist") {
            Remove-Item "dist" -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        # Remover arquivos timestamp corrompidos
        Get-ChildItem -Filter "*.timestamp-*.mjs" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
        
        # Limpar cache do npm
        Write-Log "Limpando cache do npm..." "INFO"
        & npm cache clean --force 2>$null
        
        # Reinstalar dependências
        Write-Log "Reinstalando dependências..." "INFO"
        & npm install --legacy-peer-deps 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Reparo concluído com sucesso" "SUCCESS"
            return $true
        } else {
            Write-Log "Falha no reparo da instalação" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Erro durante o reparo: $($_.Exception.Message)" "ERROR"
        return $false
    }
    finally {
        Pop-Location
    }
}

function Test-ViteConfig {
    param([string]$Path)
    
    $configFile = "$Path\vite.config.ts"
    if (-not (Test-Path $configFile)) {
        $configFile = "$Path\vite.config.js"
        if (-not (Test-Path $configFile)) {
            Write-Log "Arquivo de configuração do Vite não encontrado" "WARN"
            return $true # Não é crítico
        }
    }
    
    Write-Log "Validando configuração do Vite..." "INFO"
    # Verificação básica de sintaxe seria complexa no PowerShell
    # Por enquanto, apenas verificamos se o arquivo existe
    Write-Log "Configuração do Vite encontrada: $(Split-Path $configFile -Leaf)" "SUCCESS"
    return $true
}

function Test-ViteBuild {
    param([string]$Path)
    
    Write-Log "Executando teste de build do Vite..." "INFO"
    
    try {
        Push-Location $Path
        
        # Teste rápido de build (dry-run)
        $buildTest = & npx vite build --mode development --minify false --write false 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Teste de build bem-sucedido" "SUCCESS"
            return $true
        } else {
            Write-Log "Teste de build falhou" "ERROR"
            Write-Log "Saída do build: $buildTest" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Erro durante teste de build: $($_.Exception.Message)" "ERROR"
        return $false
    }
    finally {
        Pop-Location
    }
}

# Função principal
function Main {
    Write-Log "=== VERIFICAÇÃO DE INTEGRIDADE DO VITE (Windows) ===" "INFO"
    Write-Log "Diretório do projeto: $ProjectPath" "INFO"
    Write-Log "Usuário: $User" "INFO"
    Write-Log "" "INFO"
    
    $success = $true
    
    # Verificar integridade básica
    if (-not (Test-ViteIntegrity $ProjectPath)) {
        Write-Log "Problemas detectados na instalação do Vite" "WARN"
        
        # Tentar reparar
        if (Repair-ViteInstallation $ProjectPath) {
            # Verificar novamente após reparo
            if (-not (Test-ViteIntegrity $ProjectPath)) {
                Write-Log "Reparo falhou - Vite ainda não está funcional" "ERROR"
                $success = $false
            }
        } else {
            Write-Log "Falha no reparo automático" "ERROR"
            $success = $false
        }
    }
    
    # Verificar configuração
    if (-not (Test-ViteConfig $ProjectPath)) {
        Write-Log "Problemas na configuração do Vite" "ERROR"
        $success = $false
    }
    
    # Teste de build (opcional no Windows)
    Write-Log "Pulando teste de build no ambiente Windows" "INFO"
    
    if ($success) {
        Write-Log "=== VERIFICAÇÃO CONCLUÍDA COM SUCESSO ===" "SUCCESS"
        exit 0
    } else {
        Write-Log "=== VERIFICAÇÃO FALHOU - INTERVENÇÃO MANUAL NECESSÁRIA ===" "ERROR"
        exit 1
    }
}

# Executar função principal
Main