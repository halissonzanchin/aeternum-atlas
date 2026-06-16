import { supabase } from "../../lib/supabase";

/**
 * Parses a CSV file into an array of objects.
 * Handles commas inside quotes.
 */
export async function parseCsv(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length < 2) {
        return reject(new Error("O arquivo CSV está vazio ou sem cabeçalhos."));
      }

      const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
      
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].trim() : "";
        });
        rows.push(row);
      }
      resolve(rows);
    };
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo CSV."));
    reader.readAsText(file, 'UTF-8');
  });
}

function parseCsvLine(text) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && text[i+1] === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function validateRows(rawRows) {
  const validRows = [];
  const invalidRows = [];
  let duplicates = 0;

  const seenEnrollments = new Set();
  const detectedCourses = new Set();
  const detectedSubjects = new Set();
  const detectedClasses = new Set();

  rawRows.forEach((row, index) => {
    const email = row["email"] || row["e-mail"];
    const name = row["nome"] || row["name"];
    const course = row["curso"] || row["course"];
    const subject = row["disciplina"] || row["subject"];
    const academicClass = row["turma"] || row["class"];
    const campus = row["campus"] || "";
    const term = row["semestre"] || row["período"] || row["periodo"] || row["term"] || "";
    const registration = row["matrícula"] || row["matricula"] || row["registration"] || "";

    const missingFields = [];
    if (!email) missingFields.push("Email");
    if (!name) missingFields.push("Nome");
    if (!course) missingFields.push("Curso");
    if (!subject) missingFields.push("Disciplina");
    if (!academicClass) missingFields.push("Turma");

    const standardizedEmail = email ? email.toLowerCase() : "";

    if (missingFields.length > 0) {
      invalidRows.push({
        line: index + 2,
        email: email || "N/A",
        name: name || "N/A",
        reason: `Campos obrigatórios ausentes: ${missingFields.join(", ")}`
      });
      return;
    }

    // CORREÇÃO 1: Chave de Matrícula Múltipla (Email + Turma + Curso)
    // Permite que o mesmo aluno faça dois cursos ou duas turmas diferentes na mesma planilha.
    const enrollmentKey = `${standardizedEmail}|${academicClass}|${subject}|${term}`;

    if (seenEnrollments.has(enrollmentKey)) {
      duplicates++;
      invalidRows.push({
        line: index + 2,
        email: standardizedEmail,
        name,
        reason: "Matrícula exata duplicada na mesma planilha (mesmo aluno na mesma turma)."
      });
      return;
    }

    seenEnrollments.add(enrollmentKey);
    detectedCourses.add(course);
    detectedSubjects.add(subject);
    detectedClasses.add(academicClass);

    validRows.push({
      line: index + 2,
      email: standardizedEmail,
      name,
      course,
      subject,
      academicClass,
      campus,
      term,
      registration
    });
  });

  return {
    total: rawRows.length,
    validRows,
    invalidRows,
    duplicates,
    detectedCourses: detectedCourses.size,
    detectedSubjects: detectedSubjects.size,
    detectedClasses: detectedClasses.size
  };
}

/**
 * Helper para executar BATCH Inserts minimizando selects
 */
async function syncEntity(table, institutionId, entities, matchKeys, insertFields) {
  if (entities.length === 0) return new Map();
  
  // Extrai valores únicos para as queries de busca
  const uniqueNames = [...new Set(entities.map(e => e.name))].filter(Boolean);
  if (uniqueNames.length === 0) return new Map();

  const { data: existing, error: errExist } = await supabase
    .from(table)
    .select("id, name, " + Object.keys(matchKeys).join(", "))
    .eq("institution_id", institutionId)
    .in("name", uniqueNames);

  if (errExist) throw errExist;

  const existingMap = new Map();
  existing?.forEach(row => {
    // Cria chave composta para garantir que Curso "Medicina" do Campus "A" não sobrescreva o do "B"
    const compKey = `${row.name.toLowerCase()}_` + Object.keys(matchKeys).map(k => row[k]).join("_");
    existingMap.set(compKey, row.id);
  });

  const toInsert = [];
  const insertedMap = new Map();

  entities.forEach(entity => {
    const compKey = `${entity.name.toLowerCase()}_` + Object.keys(matchKeys).map(k => entity[k]).join("_");
    if (!existingMap.has(compKey) && !insertedMap.has(compKey)) {
      const payload = { institution_id: institutionId, name: entity.name };
      insertFields.forEach(f => payload[f] = entity[f]);
      toInsert.push(payload);
      insertedMap.set(compKey, true); // Evitar duplicação no próprio array de insert
    }
  });

  if (toInsert.length > 0) {
    const { data: inserted, error: errIns } = await supabase
      .from(table)
      .insert(toInsert)
      .select("id, name, " + Object.keys(matchKeys).join(", "));
    
    if (errIns) throw errIns;
    inserted?.forEach(row => {
      const compKey = `${row.name.toLowerCase()}_` + Object.keys(matchKeys).map(k => row[k]).join("_");
      existingMap.set(compKey, row.id);
    });
  }

  return existingMap;
}

/**
 * Execute the actual cascading import to Supabase with BATCH Processing.
 */
export async function executeImport(validRows, institutionId) {
  const result = {
    processed: validRows.length,
    usersCreated: 0,
    usersExisting: 0,
    linksCreated: 0,
    linksIgnored: 0,
    errors: []
  };

  if (!institutionId) {
    result.errors.push({ email: "Geral", reason: "Institution ID não definido." });
    return result;
  }

  // 1. Fetch existing users globally for this institution to link them
  const emails = [...new Set(validRows.map(r => r.email))];
  
  // Limitação do IN () - quebrando em blocos de 500 se necessário, mas para esse contexto assumimos < 5000 nativo
  const { data: existingUsers, error: usersErr } = await supabase
    .from("users")
    .select("id, email")
    .eq("institution_id", institutionId)
    .in("email", emails);

  if (usersErr) {
    result.errors.push({ email: "Geral", reason: "Falha ao consultar usuários existentes." });
    return result;
  }

  const existingUsersMap = new Map();
  existingUsers?.forEach(u => existingUsersMap.set(u.email.toLowerCase(), u.id));

  // Remove rows without valid users
  const rowsToProcess = [];
  for (const row of validRows) {
    const userId = existingUsersMap.get(row.email);
    if (!userId) {
      result.errors.push({
        email: row.email,
        name: row.name,
        reason: "Aluno não cadastrado na plataforma. Necessita envio de convite/registro."
      });
    } else {
      row.userId = userId;
      rowsToProcess.push(row);
      result.usersExisting++;
    }
  }

  if (rowsToProcess.length === 0) return result;

  try {
    // CORREÇÃO 2: BATCH INSERTS HIERÁRQUICOS
    
    // STAGE A: Campuses
    const campuses = rowsToProcess.map(r => ({ name: r.campus })).filter(c => c.name);
    const campusesMap = await syncEntity("academic_campuses", institutionId, campuses, {}, []);

    // STAGE B: Terms
    const terms = rowsToProcess.map(r => ({ name: r.term })).filter(t => t.name);
    const termsMap = await syncEntity("academic_terms", institutionId, terms, {}, []);

    // STAGE C: Courses
    const courses = rowsToProcess.map(r => {
      const campusId = campusesMap.get(`${r.campus?.toLowerCase()}_`) || null;
      return { name: r.course, campus_id: campusId };
    });
    const coursesMap = await syncEntity("academic_courses", institutionId, courses, { campus_id: null }, ["campus_id"]);

    // STAGE D: Subjects
    const subjects = rowsToProcess.map(r => {
      const campusId = campusesMap.get(`${r.campus?.toLowerCase()}_`) || null;
      const courseId = coursesMap.get(`${r.course.toLowerCase()}_${campusId}`);
      return { name: r.subject, course_id: courseId };
    });
    const subjectsMap = await syncEntity("academic_subjects", institutionId, subjects, { course_id: null }, ["course_id"]);

    // STAGE E: Classes
    const classes = rowsToProcess.map(r => {
      const campusId = campusesMap.get(`${r.campus?.toLowerCase()}_`) || null;
      const courseId = coursesMap.get(`${r.course.toLowerCase()}_${campusId}`);
      const subjectId = subjectsMap.get(`${r.subject.toLowerCase()}_${courseId}`);
      const termId = termsMap.get(`${r.term?.toLowerCase()}_`) || null;
      return { name: r.academicClass, campus_id: campusId, course_id: courseId, subject_id: subjectId, term_id: termId };
    });
    const classesMap = await syncEntity("academic_classes", institutionId, classes, { subject_id: null, term_id: null }, ["campus_id", "course_id", "subject_id", "term_id"]);

    // STAGE F: Enrollments (academic_class_students)
    // Gather all valid enrollments
    const enrollmentsToInsert = [];
    const enrollmentKeys = new Set(); // Para deduplicar em memoria antes de bater no banco
    const userIds = [];
    const classIds = [];

    rowsToProcess.forEach(r => {
      const campusId = campusesMap.get(`${r.campus?.toLowerCase()}_`) || null;
      const courseId = coursesMap.get(`${r.course.toLowerCase()}_${campusId}`);
      const subjectId = subjectsMap.get(`${r.subject.toLowerCase()}_${courseId}`);
      const termId = termsMap.get(`${r.term?.toLowerCase()}_`) || null;
      const classId = classesMap.get(`${r.academicClass.toLowerCase()}_${subjectId}_${termId}`);

      if (r.userId && classId) {
        const key = `${r.userId}_${classId}`;
        if (!enrollmentKeys.has(key)) {
          enrollmentsToInsert.push({ user_id: r.userId, class_id: classId });
          enrollmentKeys.add(key);
          userIds.push(r.userId);
          classIds.push(classId);
        }
      }
    });

    if (enrollmentsToInsert.length === 0) return result;

    // Precisamos checar quais vinculos JÁ existem no banco para nao duplicar
    const { data: existingLinks, error: linksErr } = await supabase
      .from("academic_class_students")
      .select("user_id, class_id")
      .in("user_id", [...new Set(userIds)]);
      // Idealmente filtraria por in class_id tambem, mas o Supabase via HTTP nao tem WHERE (A,B) IN ((A1,B1))

    if (linksErr) throw linksErr;

    const existingLinksSet = new Set(existingLinks?.map(l => `${l.user_id}_${l.class_id}`));

    const finalBatch = enrollmentsToInsert.filter(e => !existingLinksSet.has(`${e.user_id}_${e.class_id}`));
    result.linksIgnored = enrollmentsToInsert.length - finalBatch.length;

    if (finalBatch.length > 0) {
      // BATCH INSERT SUPREMO
      const { error: batchErr } = await supabase
        .from("academic_class_students")
        .insert(finalBatch);

      if (batchErr) throw batchErr;
      result.linksCreated = finalBatch.length;
    }

  } catch (err) {
    result.errors.push({
      email: "Geral",
      name: "Infraestrutura",
      reason: `Falha técnica durante o BATCH de hierarquia: ${err.message}`
    });
  }

  return result;
}
