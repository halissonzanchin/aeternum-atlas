' Script VBScript para inicializacao 100% silenciosa do Servidor de IA Aeternum Vita
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\halis\OneDrive\Documentos\Aeternum Atlas - Codex\aeternum-vita"

' Inicia os containers Docker em segundo plano
WshShell.Run "docker compose up -d", 0, True

' Inicia o tunel Cloudflare em segundo plano
WshShell.Run """C:\Users\halis\OneDrive\Documentos\Aeternum Atlas - Codex\aeternum-vita\tools\cloudflared.exe"" tunnel --url http://localhost:7880", 0, False
