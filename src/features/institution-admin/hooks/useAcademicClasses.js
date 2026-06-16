import { useState, useEffect } from "react";
import { getCurrentUser } from "../../../services/auth/authService";
import { fetchAcademicClasses, createAcademicClass, enrollStudentInClass, removeStudentFromClass } from "../../../services/academic/academicClassService";

export function useAcademicClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  const loadClasses = async () => {
    setLoading(true);
    const data = await fetchAcademicClasses(user?.institutionId);
    setClasses(data);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    if (user?.institutionId) {
      loadClasses().then(() => {
        if (!mounted) return;
      });
    } else {
      setLoading(false);
    }
    return () => { mounted = false; };
  }, [user?.institutionId]);

  const addClass = async (payload) => {
    // Assuming admin creates it for themselves as teacher if no teacher specified, 
    // or we just default to the current user as teacher for minimal scope
    const teacherId = payload.teacherId || user?.id;
    const created = await createAcademicClass(user?.institutionId, teacherId, payload);
    if (created) {
      await loadClasses(); // refresh to get aggregated counts
      return created;
    }
    return null;
  };

  const addStudent = async (classId, studentId) => {
    const success = await enrollStudentInClass(user?.institutionId, classId, studentId);
    if (success) {
      await loadClasses();
    }
    return success;
  };

  const removeStudent = async (classId, studentId) => {
    const success = await removeStudentFromClass(user?.institutionId, classId, studentId);
    if (success) {
      await loadClasses();
    }
    return success;
  };

  return {
    classes,
    loading,
    addClass,
    addStudent,
    removeStudent,
    refresh: loadClasses
  };
}
