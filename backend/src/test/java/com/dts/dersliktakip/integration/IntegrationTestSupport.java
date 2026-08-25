package com.dts.dersliktakip.integration;

import com.dts.dersliktakip.entity.AcademicPeriod;
import com.dts.dersliktakip.entity.Academician;
import com.dts.dersliktakip.entity.Building;
import com.dts.dersliktakip.entity.Classroom;
import com.dts.dersliktakip.entity.ClassroomType;
import com.dts.dersliktakip.entity.Course;
import com.dts.dersliktakip.entity.CourseType;
import com.dts.dersliktakip.entity.DeliveryType;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.Floor;
import com.dts.dersliktakip.entity.Role;
import com.dts.dersliktakip.entity.Semester;
import com.dts.dersliktakip.entity.TermType;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.entity.WeeklySchedule;
import com.dts.dersliktakip.repository.AcademicPeriodRepository;
import com.dts.dersliktakip.repository.AcademicianRepository;
import com.dts.dersliktakip.repository.BuildingRepository;
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.CourseRepository;
import com.dts.dersliktakip.repository.DepartmentRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import com.dts.dersliktakip.repository.FloorRepository;
import com.dts.dersliktakip.repository.UserRepository;
import com.dts.dersliktakip.repository.WeeklyScheduleRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

abstract class IntegrationTestSupport {

    static final String PASSWORD = "DtsTest123!";

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired UserRepository userRepository;
    @Autowired FacultyRepository facultyRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired BuildingRepository buildingRepository;
    @Autowired FloorRepository floorRepository;
    @Autowired ClassroomRepository classroomRepository;
    @Autowired AcademicianRepository academicianRepository;
    @Autowired AcademicPeriodRepository academicPeriodRepository;
    @Autowired CourseRepository courseRepository;
    @Autowired WeeklyScheduleRepository weeklyScheduleRepository;

    String loginToken(String email) throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", PASSWORD
                        ))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode json = objectMapper.readTree(response);
        return json.get("accessToken").asText();
    }

    Map<String, Object> payload(Object... entries) {
        Map<String, Object> payload = new LinkedHashMap<>();
        for (int i = 0; i < entries.length; i += 2) {
            payload.put((String) entries[i], entries[i + 1]);
        }
        return payload;
    }

    User user(String email, Role role, String facultyCode, String departmentCode) {
        User user = new User();
        user.setFirstName(role.name());
        user.setLastName("Integration");
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(PASSWORD));
        user.setRoles(Set.of(role));
        user.setFaculty(facultyCode);
        user.setDepartment(departmentCode);
        user.setActive(true);
        return userRepository.save(user);
    }

    CampusData campus(String suffix) {
        Faculty faculty = new Faculty();
        faculty.setName("Integration Faculty " + suffix);
        faculty.setCode("IF" + suffix);
        faculty = facultyRepository.save(faculty);

        Department department = new Department();
        department.setName("Computer Engineering " + suffix);
        department.setCode("CENG" + suffix);
        department.setFaculty(faculty);
        department = departmentRepository.save(department);

        Building building = new Building();
        building.setName("Integration Block " + suffix);
        building.setCode("IB" + suffix);
        building.setFaculty(faculty);
        building = buildingRepository.save(building);

        Floor floor = new Floor();
        floor.setName("1. Kat " + suffix);
        floor.setLevel(1);
        floor.setBuilding(building);
        floor = floorRepository.save(floor);

        Classroom classroom = classroom("D101" + suffix, "Derslik 101 " + suffix, 60, floor);
        return new CampusData(faculty, department, building, floor, classroom);
    }

    Classroom classroom(String code, String name, int capacity, Floor floor) {
        Classroom classroom = new Classroom();
        classroom.setCode(code);
        classroom.setName(name);
        classroom.setCapacity(capacity);
        classroom.setType(ClassroomType.CLASSROOM);
        classroom.setEquipment("Projeksiyon");
        classroom.setFloor(floor);
        return classroomRepository.save(classroom);
    }

    AcademicPeriod activePeriod(String suffix) {
        AcademicPeriod period = new AcademicPeriod();
        period.setAcademicYear("2026-" + suffix);
        period.setTermType(TermType.FALL);
        period.setDisplayName("2026 Guz " + suffix);
        period.setStartDate(LocalDate.of(2026, 9, 1));
        period.setEndDate(LocalDate.of(2027, 1, 15));
        period.setActive(true);
        return academicPeriodRepository.save(period);
    }

    Academician academician(String suffix, Faculty faculty, Department department) {
        Academician academician = new Academician();
        academician.setFirstName("Ada");
        academician.setLastName("Lovelace " + suffix);
        academician.setEmail("academician-" + suffix + "@dts.test");
        academician.setPhone("555000" + suffix.substring(0, Math.min(4, suffix.length())));
        academician.setTitle("Dr.");
        academician.setFaculty(faculty);
        academician.setDepartment(department);
        return academicianRepository.save(academician);
    }

    Course course(String code, Faculty faculty, Department department, Academician academician, AcademicPeriod period) {
        Course course = new Course();
        course.setCode(code);
        course.setName(code + " Integration Course");
        course.setFaculty(faculty);
        course.setDepartment(department);
        course.setAcademician(academician);
        course.setTheoreticalHours(2);
        course.setPracticalHours(0);
        course.setEcts(4);
        course.setCredits(3);
        course.setStudentCount(40);
        course.setCourseType(CourseType.ZORUNLU);
        course.setSemester(Semester.GUZ);
        course.setAcademicPeriod(period);
        course.setGrade(1);
        course.setActive(true);
        return courseRepository.save(course);
    }

    WeeklySchedule schedule(Course course, Classroom classroom, String day, String slot) {
        WeeklySchedule schedule = new WeeklySchedule();
        schedule.setCourse(course);
        schedule.setClassroom(classroom);
        schedule.setDayOfWeek(day);
        schedule.setTimeSlot(slot);
        schedule.setScheduleGroupId(UUID.randomUUID());
        schedule.setDeliveryType(DeliveryType.FACE_TO_FACE);
        return weeklyScheduleRepository.save(schedule);
    }

    record CampusData(Faculty faculty, Department department, Building building, Floor floor, Classroom classroom) {
    }
}
