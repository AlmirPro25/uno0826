@echo off
echo 🚀 Iniciando deploy na Vercel...
echo.

echo ✅ Verificando build...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build falhou! Verifique os erros acima.
    pause
    exit /b 1
)

echo.
echo ✅ Build concluído com sucesso!
echo.

echo 📋 Para continuar o deploy:
echo 1. Acesse: https://vercel.com
echo 2. Faça login com GitHub
echo 3. Clique em "New Project"
echo 4. Selecione este repositório
echo 5. Configure as variáveis de ambiente:
echo.
echo    VITE_GEMINI_API_KEY=AIzaSyAjgKsqqyXh4_m7oejzIEkBpJmkGj-CnA4
echo    VITE_SUPABASE_URL=https://qmalyenyrdsrmagwuhqm.supabase.co
echo    VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtYWx5ZW55cmRzcm1hZ3d1aHFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Njk3MjAsImV4cCI6MjA3NTM0NTcyMH0.AFwh5tffrJn4FxDeeuE9G8A92L_4RpdYdvmb5t8UVJc
echo    VITE_MERCADO_PAGO_ACCESS_TOKEN=TEST-2750340988674130-100614-9792a18c3299f159187535d8d0078ceb-307936631
echo    VITE_MERCADO_PAGO_PUBLIC_KEY=TEST-436ba3a5-27da-4a08-9909-da61b41b8ce7
echo.
echo 6. Clique em "Deploy"
echo.
echo 📖 Guia completo: DEPLOY_VERCEL.md
echo.
pause