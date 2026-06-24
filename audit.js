// Mock localStorage
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

import { loadInstitutionDashboardData } from './src/services/admin/institutionDashboardService.js';
import { supabase } from './src/lib/supabase.js';

async function audit() {
  console.log('--- Iniciando Auditoria de Runtime ---');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@aeternumatlas.com',
    password: 'AeternumDemo2026!'
  });
  
  if (error) {
    console.error('Falha no login:', error.message);
    return;
  }
  
  console.log('1. Autenticado como:', data.user.email);
  
  const dashboardData = await loadInstitutionDashboardData();
  
  console.log('\n--- RESULTADOS DO CONSOLE (SIMULADO) ---');
  console.log('dashboardData.source =', dashboardData.source);
  console.log('dashboardData.stats =', dashboardData.stats);
  console.log('dashboardData.students.length =', dashboardData.students?.length);
  console.log('dashboardData.institutions.length =', dashboardData.institutions?.length);
  console.log('----------------------------------------\n');
}

audit();
