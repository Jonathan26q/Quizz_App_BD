function databaseSetup(sql) {
    sql.prepare("CREATE TABLE IF NOT EXISTS teachers (id INTEGER PRIMARY KEY, username TEXT, password TEXT, classroomCodes TEXT)").run()
    sql.prepare("CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY, username TEXT, password TEXT, classroomCodes TEXT, surveys TEXT, answers TEXT, getNotified INTEGER)").run()
    sql.prepare("CREATE TABLE IF NOT EXISTS classrooms (id INTEGER PRIMARY KEY, classroomCode INTEGER, classroomName TEXT, classroomSection TEXT, classroomSubject TEXT, classroomPlace TEXT, teacherUsername TEXT, studentsUsernameList TEXT, totalStudents INTEGER, surveys TEXT)").run()
    sql.prepare("CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY, title TEXT, url TEXT, options TEXT, isPublic INTEGER, bankId INTEGER, showToStudents INTEGER)").run()
    sql.prepare("CREATE TABLE IF NOT EXISTS banks (id INTEGER PRIMARY KEY, key INTEGER, classroomCode INTEGER)").run()
    sql.prepare("CREATE TABLE IF NOT EXISTS surveys (id INTEGER PRIMARY KEY, key INTEGER, surveyTitle TEXT, classroomId INTEGER, quantity INTEGER)").run();
    sql.prepare("CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY, studentUsername TEXT, surveyId TEXT, score INTEGER, maxScore INTEGER)").run();

    setupPublicBank(sql);
}

function setupPublicBank(sql) {
    let publicBank = sql.prepare("SELECT * FROM banks WHERE key=?").get("1");
    if (!publicBank) {
        sql.prepare("INSERT INTO banks (key) VALUES (?)").run("1");
    }
}

module.exports = {databaseSetup}