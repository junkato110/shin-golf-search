import data from "@/data/courses.json";
import type { CoursesData, Course } from "@/types";

export function getAllCourses(): Course[] {
  return (data as CoursesData).courses;
}

export function getCourseById(id: string): Course | undefined {
  return getAllCourses().find((c) => c.id === id);
}
