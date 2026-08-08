import { academicianService } from '@/services/academicianService';
import { courseService } from '@/services/courseService';
import { facultyService } from '@/services/facultyService';
import { Role } from '@/types';

export type GlobalSearchResultType = 'FACULTY' | 'COURSE' | 'ACADEMICIAN';

export type GlobalSearchResult = {
  id: string;
  type: GlobalSearchResultType;
  title: string;
  subtitle?: string;
  targetUrl: string;
};

const normalize = (value: string) => value.toLocaleLowerCase('tr-TR');

const includesQuery = (value: string | null | undefined, query: string) => normalize(value ?? '').includes(query);

const courseTarget = (role?: Role) => (role === 'DEPARTMENT_ADMIN' ? '/department-admin/dersler' : '/super-admin/dersler');

const academicianTarget = (role?: Role) => (role === 'DEPARTMENT_ADMIN' ? '/department-admin/dersler' : '/super-admin/kullanicilar');

export const globalSearchService = {
  search: async (query: string, role?: Role): Promise<GlobalSearchResult[]> => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      return [];
    }

    const searchQuery = normalize(trimmedQuery);
    const [facultyResponse, courses, academicians] = await Promise.all([
      facultyService.getAll(),
      courseService.getAll(),
      academicianService.getAll(),
    ]);

    const faculties = facultyResponse.faculties
      .filter((faculty) => includesQuery(faculty.name, searchQuery) || includesQuery(faculty.code, searchQuery))
      .slice(0, 5)
      .map<GlobalSearchResult>((faculty) => ({
        id: faculty.id,
        type: 'FACULTY',
        title: faculty.name,
        subtitle: faculty.code,
        targetUrl: role === 'SUPER_ADMIN' ? `/super-admin/fakulteler/${faculty.id}` : '/dashboard',
      }));

    const courseResults = courses
      .filter(
        (course) =>
          includesQuery(course.name, searchQuery) ||
          includesQuery(course.code, searchQuery) ||
          includesQuery(course.academicianName, searchQuery) ||
          includesQuery(course.departmentName, searchQuery),
      )
      .slice(0, 5)
      .map<GlobalSearchResult>((course) => ({
        id: course.id,
        type: 'COURSE',
        title: course.code,
        subtitle: `${course.name} • ${course.academicianName}`,
        targetUrl: courseTarget(role),
      }));

    const academicianResults = academicians
      .filter((academician) => {
        const fullName = `${academician.firstName} ${academician.lastName}`;
        return (
          includesQuery(fullName, searchQuery) ||
          includesQuery(academician.title, searchQuery) ||
          includesQuery(academician.departmentName, searchQuery)
        );
      })
      .slice(0, 5)
      .map<GlobalSearchResult>((academician) => ({
        id: academician.id,
        type: 'ACADEMICIAN',
        title: `${academician.title} ${academician.firstName} ${academician.lastName}`.trim(),
        subtitle: academician.departmentName,
        targetUrl: academicianTarget(role),
      }));

    return [...courseResults, ...academicianResults, ...faculties];
  },
};
