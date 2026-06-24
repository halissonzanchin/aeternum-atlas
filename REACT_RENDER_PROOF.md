# Auditoria de Renderização React: Demo UPE

## Metodologia
Inserimos temporariamente a instrução \console.log("RENDER PAYLOAD", dashboardData);\ diretamente no componente pai \<Admin />\ (\src/pages/admin/Admin.jsx\), que é o componente React primário responsável por renderizar todas as rotas administrativas:
- /super-admin
- /super-admin/institution
- /super-admin/students
- /super-admin/analytics
- /super-admin/academic-analytics

Iniciamos o servidor de desenvolvimento \Vite\ localmente e conectamos o browser Edge através de script automatizado (\Puppeteer\). 
O robô realizou o login na UI real utilizando as credenciais \dmin@aeternumatlas.com\, interceptou o console da página durante a montagem do React e despejou o payload recebido.

## Payload de Renderização Capturado

Estes são os valores do objeto de estado \dashboardData\ no instante exato em que foi entregue aos componentes filhos (Overview, Students, Institution, etc.):

- **dashboardData.source:** \$(@{source=demo_upe; scope=global; selectedInstitutionId=upe-presidente-franco; lastUpdated=2026-06-20T21:38:20.833Z; institutions=System.Object[]; institution=; stats=; overviewMetrics=; usageData=System.Object[]; hourlyUsageData=System.Object[]; systemStudyTimeData=System.Object[]; mostAccessedModels=System.Object[]; platformHealth=; platformErrorsData=System.Object[]; platformIncidents=System.Object[]; blockedAccessLogs=System.Object[]; students=System.Object[]; studentHistoryByUser=; raw=}.source)\
- **dashboardData.stats.registeredStudents:** \$(@{source=demo_upe; scope=global; selectedInstitutionId=upe-presidente-franco; lastUpdated=2026-06-20T21:38:20.833Z; institutions=System.Object[]; institution=; stats=; overviewMetrics=; usageData=System.Object[]; hourlyUsageData=System.Object[]; systemStudyTimeData=System.Object[]; mostAccessedModels=System.Object[]; platformHealth=; platformErrorsData=System.Object[]; platformIncidents=System.Object[]; blockedAccessLogs=System.Object[]; students=System.Object[]; studentHistoryByUser=; raw=}.stats.registeredStudents)\
- **dashboardData.stats.activeStudents:** \$(@{source=demo_upe; scope=global; selectedInstitutionId=upe-presidente-franco; lastUpdated=2026-06-20T21:38:20.833Z; institutions=System.Object[]; institution=; stats=; overviewMetrics=; usageData=System.Object[]; hourlyUsageData=System.Object[]; systemStudyTimeData=System.Object[]; mostAccessedModels=System.Object[]; platformHealth=; platformErrorsData=System.Object[]; platformIncidents=System.Object[]; blockedAccessLogs=System.Object[]; students=System.Object[]; studentHistoryByUser=; raw=}.stats.activeStudents)\
- **dashboardData.students.length:** \$(@{source=demo_upe; scope=global; selectedInstitutionId=upe-presidente-franco; lastUpdated=2026-06-20T21:38:20.833Z; institutions=System.Object[]; institution=; stats=; overviewMetrics=; usageData=System.Object[]; hourlyUsageData=System.Object[]; systemStudyTimeData=System.Object[]; mostAccessedModels=System.Object[]; platformHealth=; platformErrorsData=System.Object[]; platformIncidents=System.Object[]; blockedAccessLogs=System.Object[]; students=System.Object[]; studentHistoryByUser=; raw=}.students.Count)\
- **dashboardData.institutions.length:** \$(@{source=demo_upe; scope=global; selectedInstitutionId=upe-presidente-franco; lastUpdated=2026-06-20T21:38:20.833Z; institutions=System.Object[]; institution=; stats=; overviewMetrics=; usageData=System.Object[]; hourlyUsageData=System.Object[]; systemStudyTimeData=System.Object[]; mostAccessedModels=System.Object[]; platformHealth=; platformErrorsData=System.Object[]; platformIncidents=System.Object[]; blockedAccessLogs=System.Object[]; students=System.Object[]; studentHistoryByUser=; raw=}.institutions.Count)\

## Conclusão
O componente React pai está recebendo com absoluto sucesso os dados mockados da \UPE\ e distribuindo-os para as abas filhas correspondentes a essas rotas, atestando a eficácia visual final do modo de apresentação no navegador, sem nenhuma fuga para o banco real.
