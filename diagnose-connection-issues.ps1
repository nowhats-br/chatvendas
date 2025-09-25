# Script de diagnóstico para problemas de conexão do ChatVendas
# Este script ajuda a identificar problemas de conexão entre frontend e backend

Write-Host "=== Diagnóstico de Conexão do ChatVendas ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path ".env")) {
    Write-Host "❌ Arquivo .env não encontrado. Execute este script na raiz do projeto." -ForegroundColor Red
    exit 1
}

Write-Host "1. Verificando configurações do ambiente..." -ForegroundColor Yellow

# Ler configurações do .env
$envContent = Get-Content ".env" | Where-Object { $_ -notmatch "^#" -and $_ -ne "" }

$supabaseUrl = $envContent | Where-Object { $_ -match "VITE_SUPABASE_URL" } | ForEach-Object { ($_ -split "=")[1].Trim('"') }
$baileysUrl = $envContent | Where-Object { $_ -match "VITE_BAILEYS_URL" } | ForEach-Object { ($_ -split "=")[1] }
$webjsUrl = $envContent | Where-Object { $_ -match "VITE_WEBJS_URL" } | ForEach-Object { ($_ -split "=")[1] }

Write-Host "   Supabase URL: $supabaseUrl" -ForegroundColor White
Write-Host "   Baileys URL: $baileysUrl" -ForegroundColor White
Write-Host "   Web.js URL: $webjsUrl" -ForegroundColor White
Write-Host ""

Write-Host "2. Testando conexão com o Supabase..." -ForegroundColor Yellow
try {
    $supabaseTest = npx tsx test-supabase-connection.ts 2>$null
    if ($supabaseTest -match "✅ Supabase connection successful!") {
        Write-Host "   ✅ Conexão com Supabase OK" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Falha na conexão com Supabase" -ForegroundColor Red
        Write-Host "   Detalhes: $supabaseTest" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Erro ao testar conexão com Supabase: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "3. Testando conexão com serviços locais..." -ForegroundColor Yellow

# Função para testar conexão HTTP
function Test-HttpConnection {
    param([string]$Url, [string]$ServiceName)
    
    try {
        $request = [System.Net.WebRequest]::Create($Url)
        $request.Timeout = 5000  # 5 segundos
        $response = $request.GetResponse()
        $response.Close()
        Write-Host "   ✅ $ServiceName está acessível (Status: $($response.StatusCode))" -ForegroundColor Green
        return $true
    } catch {
        if ($_.Exception.InnerException) {
            Write-Host "   ❌ $ServiceName não está acessível: $($_.Exception.InnerException.Message)" -ForegroundColor Red
        } else {
            Write-Host "   ❌ $ServiceName não está acessível: $($_.Exception.Message)" -ForegroundColor Red
        }
        return $false
    }
}

# Testar serviços
$baileysWorking = Test-HttpConnection -Url $baileysUrl -ServiceName "Baileys Service"
$webjsWorking = Test-HttpConnection -Url $webjsUrl -ServiceName "Web.js Service"

Write-Host ""

Write-Host "4. Verificando se os serviços estão rodando localmente..." -ForegroundColor Yellow

# Verificar se PM2 está instalado
try {
    $pm2Version = pm2 --version 2>$null
    if ($pm2Version) {
        Write-Host "   ✅ PM2 está instalado (versão $pm2Version)" -ForegroundColor Green
        Write-Host "   Verificando processos PM2:" -ForegroundColor White
        pm2 list
    } else {
        Write-Host "   ⚠️  PM2 não encontrado. Você pode precisar instalá-lo com: npm install -g pm2" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  PM2 não encontrado. Você pode precisar instalá-lo com: npm install -g pm2" -ForegroundColor Yellow
}

Write-Host ""

Write-Host "5. Diagnóstico de rede..." -ForegroundColor Yellow

# Verificar se as portas estão escutando
$baileysPort = $baileysUrl -replace 'http://.*:(\d+)', '$1'
$webjsPort = $webjsUrl -replace 'http://.*:(\d+)', '$1'

Write-Host "   Verificando se a porta $baileysPort está escutando..." -ForegroundColor White
$netstatBaileys = netstat -an | Select-String ":$baileysPort "
if ($netstatBaileys) {
    Write-Host "   ✅ Porta $baileysPort está escutando" -ForegroundColor Green
} else {
    Write-Host "   ❌ Porta $baileysPort não está escutando" -ForegroundColor Red
}

Write-Host "   Verificando se a porta $webjsPort está escutando..." -ForegroundColor White
$netstatWebjs = netstat -an | Select-String ":$webjsPort "
if ($netstatWebjs) {
    Write-Host "   ✅ Porta $webjsPort está escutando" -ForegroundColor Green
} else {
    Write-Host "   ❌ Porta $webjsPort não está escutando" -ForegroundColor Red
}

Write-Host ""

Write-Host "=== Resumo do Diagnóstico ===" -ForegroundColor Cyan
Write-Host ""

if ($supabaseUrl -and $baileysUrl -and $webjsUrl) {
    Write-Host "✅ Configurações de ambiente encontradas" -ForegroundColor Green
} else {
    Write-Host "❌ Configurações de ambiente incompletas" -ForegroundColor Red
}

if ($baileysWorking -and $webjsWorking) {
    Write-Host "✅ Todos os serviços estão acessíveis" -ForegroundColor Green
    Write-Host "🎉 Sua aplicação deve funcionar corretamente!" -ForegroundColor Green
} else {
    Write-Host "❌ Alguns serviços não estão acessíveis" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Soluções possíveis:" -ForegroundColor Yellow
    Write-Host "   1. Verifique se os serviços backend estão rodando (Baileys e Web.js)" -ForegroundColor White
    Write-Host "   2. Se instalou no Ubuntu, certifique-se de que está acessando os serviços corretos" -ForegroundColor White
    Write-Host "   3. Verifique o firewall e as configurações de rede" -ForegroundColor White
    Write-Host "   4. Consulte o arquivo TROUBLESHOOTING_GUIDE.md para mais detalhes" -ForegroundColor White
}

Write-Host ""
Write-Host "Para mais informações, consulte o arquivo TROUBLESHOOTING_GUIDE.md" -ForegroundColor Cyan
Write-Host ""