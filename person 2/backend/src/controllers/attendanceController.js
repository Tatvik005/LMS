const prisma = require('../config/db');

// Mark attendance for a single student or batch of students
exports.markAttendance = async (req, res) => {
  try {
    const { courseId, records, date } = req.body; 
    // records: [{ studentId: "...", status: "PRESENT" | "ABSENT" | "LATE" }]

    const attendanceDate = date ? new Date(date) : new Date();

    const createdRecords = await Promise.all(records.map(async (record) => {
      return prisma.attendance.upsert({
        where: {
          studentId_courseId_date: {
            studentId: record.studentId,
            courseId: courseId,
            date: attendanceDate
          }
        },
        update: {
          status: record.status
        },
        create: {
          studentId: record.studentId,
          courseId: courseId,
          date: attendanceDate,
          status: record.status
        }
      });
    }));

    res.status(201).json(createdRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get monthly attendance report for a course
exports.getCourseAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    const records = await prisma.attendance.findMany({
      where: { courseId },
      include: { student: { select: { id: true, name: true } } },
      orderBy: { date: 'asc' }
    });
    
    // Compute percentages
    const report = {};
    records.forEach(r => {
      if (!report[r.studentId]) {
        report[r.studentId] = { student: r.student, present: 0, late: 0, absent: 0, total: 0 };
      }
      report[r.studentId].total++;
      if (r.status === 'PRESENT') report[r.studentId].present++;
      else if (r.status === 'LATE') report[r.studentId].late++;
      else if (r.status === 'ABSENT') report[r.studentId].absent++;
    });

    for (const key in report) {
      report[key].percentage = ((report[key].present + (report[key].late * 0.5)) / report[key].total) * 100;
    }

    res.json(Object.values(report));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Student view their own attendance
exports.getMyAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    const records = await prisma.attendance.findMany({
      where: { 
        courseId,
        studentId: req.user.id
      },
      orderBy: { date: 'asc' }
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
