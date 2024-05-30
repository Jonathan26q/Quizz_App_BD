const { oracle } = require("./oracle");
const sql = oracle();

/*
*   FUNCIONES PARA ENVIAR INFORMACIÓN SOLICITADA POR EL FRONTEND
*   FUNCIONES PARA OPERAR INFORMACIÓN ENVIADA DESDE EL FRONTEND
*
*   VALIDA LAS ENTIDADES ANTES DE OPERAR Y NOTIFICA AL FRONTEND
*   DE CUALQUIER INCONVENIENTE, POR LO QUE LA INTERPRETACIÓN SE RESUME EN:
*
*   RESPUESTAS DEL BACKEND:
*
*   DATOS QUE SE ENVIAN DEL FRONTEND AL BACKEND (operateData) 
*       status == 400 - Si no eixste o se invalida la información en cualquier punto
*       status == 200 - Si la operación fue completada exitosamente, se notifica con el estado de la petición
*   
*   DATOS QUE SE ENVIAN DEL BACKEND AL FRONTEND (getData)
*       Object->null - Si no existe o se invalida la información en cualquier punto
*       JSON - Si existe, se responde con la informacíón solicitada por el frontend, en un JSON (string)
*       
*/

async function getData(params, query) {    
    let entity, classrooms, classroomCode, questions, bankId, data;
    switch(params.task) {
        case "getEntityName":
            entity = await obtainUser(query.username);
            if (!entity) return null;
            return entity.entityName;

        case "getRandomClassroomCode":
            classroomCode = await generateClassroomCode();
            if (!classroomCode) return null;
            return classroomCode; 

        case "getClassroomByCode":
            code = await validateClassroomCode(query.code);
            if (!code) return null;
            return code;

        case "getClassroomByClassroomId":
            entity = await getClassroomByClassroomId(query.code);
            if (!entity) return null;
            return entity;

        case "getClassroomsByTeacherUsername":
            entity = await obtainUser(query.username);
            if (!entity) return null;
            classrooms = await getClassroomsByTeacherUsername(query.username);
            if (isNullOrEmpty(classrooms)) return null;
            return JSON.stringify(classrooms);   

        case "getClassroomsByStudentUsername":
            entity = await obtainUser(query.username);
            if (!entity) return null;
            classrooms = await getClassroomsByStudentUsername(query.username);
            if (isNullOrEmpty(classrooms)) return null;
            return JSON.stringify(classrooms);   

        case "getStudentsByClassroomCode":
            entity = await obtainClassroom(query.code);
            if (!entity) return null;
            entities = await getStudentsByClassroomCode(query.code);
            if (isNullOrEmpty(entities)) return null;
            return JSON.stringify(entities);

        case "validateClassroomRegistered":
            data = query.data.split("-");
            entities = await validateClassroomStudentRegistered(data[0], data[1]);
            if (isNullOrEmpty(entities)) return null;
            return JSON.stringify(entities);
               
        case "getQuestionsByClassroomCode":
            entity = await obtainClassroom(query.code);
            if (!entity) return null;
            questions = await getQuestionsByClassroomCode(query.code);
            if (isNullOrEmpty(questions)) return null;
            return JSON.stringify(questions);

        case "getBankIdByClassroomCode":
            entity = await obtainClassroom(query.code);
            if (!entity) return null;
            bankId = await getBankIdByClassroomCode(query.code);
            return bankId;

        case "getQuestionsByPublicBank":
            questions = await getQuestionsByPublicBank();
            if (isNullOrEmpty(questions)) return null;
            return JSON.stringify(questions);

        case "getSurveysByClassroomCode":
            entity = await obtainClassroom(query.code);
            if (!entity) return null;
            surveys = await getSurveysByClassroomCode(query.code);
            if (isNullOrEmpty(surveys)) return null;
            return JSON.stringify(surveys);

        case "getSurveysByStudentUsernameAndClassroomCode":
            data = query.data.split("-");
            username = data[0];
            classroomCode = data[1];
            entity = await obtainUser(username);
            if (!entity) return null;
            entity = await obtainClassroom(classroomCode);
            if (!entity) return null;
            surveys = await getSurveysByStudentUsernameAndClassroomCode(username, classroomCode);
            if (isNullOrEmpty(surveys)) return null;
            return JSON.stringify(surveys);

        case "getSurveyBySurveyCode":
            entity = await obtainSurvey(query.code);
            if (!entity) return null;
            return entity;

        case "getQuestionsByIds":
            data = query.data.split("-");
            ids = JSON.parse(data[0]);
            quantity = data[1];
            classroomCode = data[2];
            entity = await obtainQuestionsByIds(ids, quantity, classroomCode);
            if (!entity) return null;
            return JSON.stringify(entity);

        case "getQuestionsByQuantity":
            data = query.data.split("-");
            quantity = data[0];
            classroomCode = data[1];
            entities = await getQuestionsByQuantity(quantity, classroomCode);
            if (isNullOrEmpty(entities)) return null;
            return JSON.stringify(entities);

        case "getScoresByUsername":
            entity = await obtainUser(query.username);
            if (!entity) return null;
            entities = await getScoresByUsername(query.username);
            if (isNullOrEmpty(entities)) return null;
            return JSON.stringify(entities);

        case "getScoresByClassroomCode":
            entity = await obtainClassroom(query.code);
            if (!entity) return null;
            entities = await getScoresByClassroomCode(query.code);
            if (isNullOrEmpty(entities)) return null;
            return JSON.stringify(entities);

        case "getIsNotified":
            entity = await obtainUser(query.username);
            if (!entity) return null;
            entities = await getIsNotified(query.username);
            if (isNullOrEmpty(entities)) return null;
            return JSON.stringify(entities);

        case "getLinksByUsername":
            entity = await obtainUser(query.username);
            if (!entity) return null;
            entities = await getLinksByUsername(query.username);
            if (isNullOrEmpty(entities)) return null;
            return JSON.stringify(entities);
    };
}

async function operateData(parcel) {
    parcel = JSON.parse(parcel);
    
    let entity, specialChars;
    switch(parcel.task) {
        case "register":
            entity = await obtainUser(parcel.data.username);
            if (entity) return null;
            specialChars = containsSpecialChars(parcel.data.username);
            if (specialChars) return null;
            await registerDB(parcel.entity, parcel.data.username, parcel.data.password);
            return true;

        case "login":
            entity = await obtainUser(parcel.data.username, parcel.data.password);
            if (!entity) return null;
            return entity;

        case "create_classroom":
            entity = await obtainUser(parcel.data.teacherUsername);
            if (!entity) return null;
            specialChars = containsSpecialChars(parcel.data.classroomName);
            if (specialChars) return null;
            return await registerClassroom(parcel.data);
            
        case "register_student_classroom":
            entity = await obtainUser(parcel.data.studentUsername);
            if (!entity) return null;
            return await joinToClassroom(parcel.data);

        case "register_question":
            if (parcel.data.bankId) {
                entity = await obtainBank(parcel.data.bankId);
                if (!entity) return null;
            }
            return await registerQuestion(parcel.data);

        case "delete_question":   
            entity = await obtainQuestion(parcel.data);
            if (!entity) return null;
            return await deleteQuestion(parcel.data);

        case "create_survey":
            entity = await obtainClassroom(parcel.data.classroomId);
            if (!entity) return null;
            return await createSurvey(parcel.data);

        case "set_scores":
            entity = await obtainUser(parcel.data.username);
            if (!entity) return null;
            entity = await obtainSurvey(parcel.data.key);
            if (!entity) return null;
            entity = await scoreActuallyExists(parcel.data);
            if (entity) return null;
            return await setScoreToStudent(parcel.data);

        case "delete_classroom_student":
            entity = await obtainUser(parcel.data.username);
            if (!entity) return null;
            entity = await obtainClassroom(parcel.data.classroomCode);
            if (!entity) return null;
            return await deleteStudent(parcel.data.username, parcel.data.classroomCode);

        case "save_links":
            entity = await obtainUser(parcel.data.username);
            if (!entity) return null;
            return await saveLinks(parcel.data);
    }
}

async function obtainBank(key) {
    let bank = await sql.prepare("SELECT * FROM banks WHERE key=?").get(parseInt(key));
    if (!bank) return null;
    return bank;
}

async function obtainClassroom(code) {
    let classroom = await sql.prepare("SELECT * FROM classrooms WHERE classroomCode=?").get(code);
    if (!classroom) return null;
    return classroom;
}

async function obtainQuestion(questionId) {
    let question = await sql.prepare("SELECT * FROM questions WHERE id=?").get(questionId);
    if (!question) return null;    
    return question;
}

async function obtainSurvey(surveyId) {
    let survey = await sql.prepare("SELECT * FROM surveys WHERE key=?").get(surveyId);
    if (!survey) return null;    
    return survey;
}

async function registerQuestion(data) {
    let options = JSON.stringify(data.options);

    await sql.prepare("INSERT INTO questions (title, url, options, isPublic, bankId, showToStudents, questionType) VALUES (?,?,?,?,?,?,?)")
        .run(data.title, data.url, options, data.isPublic, data.bankId, data.showToStudents, data.questionType);

    return true;
}

async function deleteQuestion(questionId) {
    await sql.prepare("DELETE FROM questions WHERE id=?").run(questionId);
    return true;
}

async function deleteStudent(username, code) {
    let classrooms = await sql.prepare("SELECT * FROM classrooms").all();
    for(let classroom of classrooms) {
        let studentList = getParsedArray(classroom.studentsusernamelist)
        studentList = studentList.filter(elem => elem != username);
    
        await sql.prepare("UPDATE classrooms SET studentsUsernameList=? WHERE classroomCode=?").run(JSON.stringify(studentList), classroom.classroomcode);
    };

    let queue = await sql.prepare("SELECT classroomCodes FROM students WHERE username=?").get(username);
    let codes = JSON.parse(queue.classroomcodes);
    codes = codes.filter(elem => elem != code);
    await sql.prepare("UPDATE students SET classroomCodes=? WHERE username=?").run(JSON.stringify(codes), username);

    await sql.prepare("DELETE FROM scores WHERE studentUsername=?").run(username);
    return true;
}

async function saveLinks(data) {
    let student = await sql.prepare("SELECT * FROM students WHERE username=?").get(data.username);
    let answers = JSON.parse(student.answers);
    answers.push(data.inputValue);
    answers = JSON.stringify(answers);
    await sql.prepare("UPDATE students SET answers=?, getNotified=? WHERE username=?").run(answers, 0, data.username);

    return true;
}

async function createSurvey(data) {
    let key = await generateSurveyId();
    
    await sql.prepare("INSERT INTO surveys (key, surveyTitle, classroomId, quantity, percent, umbral, questionsToInclude, timeSurvey, dateSurvey) VALUES (?,?,?,?,?,?,?,?,?)").run(key, data.surveyTitle, data.classroomId, data.quantity, data.percent, data.umbral, JSON.stringify(data.questionsToInclude), data.timeSurvey, data.dateSurvey);
    await asignSurveyToEntities(key, data.surveyTitle, data.classroomId, data.quantity, data.percent, data.umbral, data.questionsToInclude, data.timeSurvey, data.dateSurvey);
    
    return true;
}

async function asignSurveyToEntities(key, surveyTitle, classroomId, quantity, percent, umbral, questionsToInclude, timeSurvey, dateSurvey) {
    let classrooms = await sql.prepare("SELECT * FROM classrooms").all();
    let classroom = classrooms.find(elem => elem.classroomcode == classroomId)

    let survey = {
        key: key,
        surveyTitle: surveyTitle,
        classroomId: classroomId,
        quantity: quantity,
        percent: percent,
        umbral: umbral,
        questionsToInclude: questionsToInclude,
        timeSurvey: timeSurvey,
        dateSurvey: dateSurvey
    };

    // Asignar a classrooom
    let surveys = JSON.parse(classroom.surveys);  
    surveys.push(survey);
    
    await sql.prepare("UPDATE classrooms SET surveys=? WHERE classroomCode=?")
        .run(JSON.stringify(surveys), classroom.classroomcode);

    // Asignar a estudiantes del classroom
    surveys = surveys.map(elem => Object.assign(elem, { isPending: true }));
    let students = JSON.parse(classroom.studentsusernamelist);
    
    for(const username of students) {
        await sql.prepare("UPDATE students SET surveys=?, getNotified=? WHERE username=?").run(JSON.stringify(surveys), 1, username);
    }
    
    return true;
}

async function obtainUser(username, password) {
    let teacher = await sql.prepare("SELECT * FROM teachers WHERE username=?").get(username);
    if (password) {
        teacher = await sql.prepare("SELECT * FROM teachers WHERE username=? AND password=?").get(username, password);
    }
    if (teacher) return {entityName: "teacher", entity: teacher};

    let student = await sql.prepare("SELECT * FROM students WHERE username=?").get(username);
    if (password) {
        student = await sql.prepare("SELECT * FROM students WHERE username=? AND password=?").get(username, password);
    }
    if (student) return {entityName: "student", entity: student};

    return null;
}

async function registerDB(table, username, password) {
    if (table == "students") {
        await sql.prepare(`INSERT INTO ${table} (username, password, classroomCodes, surveys, answers, getNotified) VALUES (?,?,?,?,?,?)`).run(username, password, '[]', '[]', '[]', 0);
    } else if (table == "teachers") {
        await sql.prepare(`INSERT INTO ${table} (username, password, classroomCodes) VALUES (?,?,?)`).run(username, password, '[]');
    }
    return true;
}

async function getSurveysByClassroomCode(code) {
    let classrooms = await sql.prepare("SELECT * FROM classrooms WHERE classroomCode=?").get(code);
    if (classrooms.length == 0) return null;

    let surveys = JSON.parse(classrooms.surveys);
    if (surveys.length == 0) return null;

    return surveys;
}

async function getSurveysByStudentUsernameAndClassroomCode(username, classroomCode) {
    let student = await sql.prepare("SELECT * FROM students WHERE username=?").get(username);
    let surveys = JSON.parse(student.surveys);
    if (surveys.length == 0) return null;
    surveys = surveys.filter(elem => elem.classroomId == classroomCode);
    if (surveys.length == 0) return null;

    return surveys;
}

async function obtainQuestionsByIds(ids, quantity, classroomCode) {
    let questions = [];

    let privatebank = await sql.prepare("SELECT * FROM banks WHERE classroomCode=?").get(classroomCode);

    for(let id of ids) {
        let question = await sql.prepare("SELECT * FROM questions WHERE id=? AND bankId=?").get(id, privatebank.key);
        if (!question) continue;
        questions.push(question);
    }

    if (questions.length != quantity) {
        for(let id of ids) {
            let question = await sql.prepare("SELECT * FROM questions WHERE id=? AND bankId=1").get(id); 
            if (!question) continue;
            questions.push(question);
        }
    }

    // Llena lo que falte con preguntas del banco 1
    if (questions.length != quantity) {
        let res = await sql.prepare("SELECT * FROM questions WHERE bankId=1").all();
        for(let question of res) {
            if (questions.length == quantity) break;
            questions.push(question);
        }
    };

    return questions;
}

async function getQuestionsByQuantity(quantity, classroomCode) {
    let questions;
    let privatebank = await sql.prepare("SELECT * FROM banks WHERE classroomCode=?").get(classroomCode);

    let publicQuestions = await sql.prepare("SELECT * FROM questions WHERE bankId=?").all(1);
    let privateQuestions = await sql.prepare("SELECT * FROM questions WHERE bankId=?").all(privatebank.key);

    if (publicQuestions.length != 0 && privateQuestions.length != 0) questions = privateQuestions.concat(publicQuestions);
    else if (privateQuestions.length != 0) questions = privateQuestions;
    else if (publicQuestions != 0) questions = publicQuestions;
    else return [];

    //shuffle(questions); // Sortear los preguntas
    return questions.slice(0, quantity);
}

async function getScoresByUsername(studentUsername) {
    let scores = await sql.prepare("SELECT * FROM scores WHERE studentUsername=?").all(studentUsername);
    for (let score of scores) {
        score.data = await score.data.getData();
        score.data = JSON.parse(score.data);
    }
    return scores;
}

// scores no tiene classroomId, tiene surveyId
async function getScoresByClassroomCode(classroomCode) {
    let listScores = [];
    let classrooms = await sql.prepare("SELECT * FROM classrooms").all();
    for(let classroom of classrooms) {
        if (classroom.classroomcode != classroomCode) continue;
        const usernames = JSON.parse(classroom.studentsusernamelist);
        for(let username of usernames) {
            const scores = await getScoresByUsername(username);
            listScores.push(scores);
        }
    }

    return listScores;
}

async function getIsNotified(studentUsername) {
    let data = await sql.prepare("SELECT getNotified FROM students WHERE username=?").get(studentUsername);
    return data;
}

async function getLinksByUsername(studentUsername) {
    let data = await sql.prepare("SELECT answers FROM students WHERE username=?").get(studentUsername);
    return data;
}

async function getQuestionsByClassroomCode(classroomCode) {
    let bankKey = await getBankIdByClassroomCode(classroomCode);
    if (!bankKey) return null;

    let questions = await sql.prepare("SELECT * FROM questions WHERE bankId=?").all(bankKey);
    if (questions.length == 0) return null;

    return questions;
}

async function getBankIdByClassroomCode(classroomCode) {
    let bank = await sql.prepare("SELECT * FROM banks WHERE classroomCode=?").get(classroomCode);
    if (!bank) return null;
    return bank.key;
}

async function getQuestionsByPublicBank() {
    let questions = await sql.prepare("SELECT * FROM questions WHERE bankId=?").all(1);
    if (questions.length == 0) return null;
    return questions;
}

async function getClassroomByClassroomId(code) {
    let classroom = await sql.prepare("SELECT * FROM classrooms WHERE classroomCode=?").get(code);
    if (!classroom) return null;
    return classroom;
}

async function getClassroomsByTeacherUsername(teacherUsername) {
    let classrooms = await sql.prepare("SELECT * FROM classrooms WHERE teacherUsername=?").all(teacherUsername);
    if (classrooms.length == 0) return null;
    return classrooms;
}

async function getClassroomsByStudentUsername(studentUsername) {
    let student = await sql.prepare("SELECT * FROM students WHERE username=?").get(studentUsername);
    let classroomCodes = getParsedArray(student.classroomcodes);
    let classroomsLoaded = [];

    for(let classroomCode of classroomCodes) {
        let classroomFetched = await sql.prepare("SELECT * FROM classrooms WHERE classroomCode=?").get(classroomCode);
        classroomsLoaded.push(classroomFetched); 
        classroomsLoaded = [...new Set(classroomsLoaded)]; // Evitar repetidos
    }

    if (classroomsLoaded.length == 0) return null;
    return classroomsLoaded;
}

async function getStudentsByClassroomCode(code) {
    let classroom = await sql.prepare("SELECT * FROM classrooms WHERE classroomCode=?").get(code);
    let studentsUsernameList = getParsedArray(classroom.studentsusernamelist);
    return studentsUsernameList;
}

async function getBankIdByClassroomCode(code) {
    let bank = await sql.prepare("SELECT * FROM banks WHERE classroomCode=?").get(code);
    if (!bank) return null;
    return bank.key;
}

async function registerClassroom(data) {
    await sql.prepare("INSERT INTO classrooms (classroomCode, classroomName, classroomSection, classroomSubject, classroomPlace, teacherUsername, studentsUsernameList, totalStudents, surveys) VALUES (?,?,?,?,?,?,?,?,?)")
        .run(data.classroomCode, data.classroomName, data.classroomSection, data.classroomSubject, data.classroomPlace, data.teacherUsername, data.studentsUsernameList, data.totalStudents, '[]');    
    
    await generatePrivateBank(data.classroomCode);
    await registerClassroomCodeToEntity(data.classroomCode, {table: "teachers", username: data.teacherUsername});
    return true;
}

async function generatePrivateBank(classroomCode) {
    let key = await generateBankId();
    await sql.prepare(`INSERT INTO banks (key, classroomCode) VALUES (?,?)`).run(key, classroomCode);
}

async function registerClassroomCodeToEntity(classroomCode, entityData) {
    const entity = await sql.prepare(`SELECT * FROM ${entityData.table} WHERE username=?`).get(entityData.username);
    let entityClassroomCodes = getParsedArray(entity.classroomcodes);

    entityClassroomCodes.push(classroomCode);
    entityClassroomCodes = [...new Set(entityClassroomCodes)];
    entityClassroomCodes = JSON.stringify(entityClassroomCodes);

    await sql.prepare(`UPDATE ${entityData.table} SET classroomCodes=? WHERE username=?`).run(entityClassroomCodes, entityData.username);
}

async function joinToClassroom(data) {
    const classroom = await sql.prepare("SELECT * FROM classrooms WHERE classroomCode=?").get(data.classroomCode);
    let studentsUsernameList = getParsedArray(classroom.studentsusernamelist);

    await asignSurveysToStudent(data.studentUsername, classroom);
    await registerStudentToClassroomStudentsList(data.classroomCode, studentsUsernameList, data.studentUsername);
    await registerClassroomCodeToEntity(data.classroomCode, {table: "students", username: data.studentUsername});
    
    return true;
}

async function asignSurveysToStudent(username, classroom) {
    let surveys = JSON.parse(classroom.surveys);
    let surveysToAdd = [];
    
    for(let survey of surveys) {
        let entity = {
            key: survey.key,
            surveyTitle: survey.surveyTitle,
            classroomId: survey.classroomId,
            quantity: survey.quantity,
            percent: survey.percent,
            umbral: survey.umbral,
            questionsToInclude: survey.questionsToInclude,
            timeSurvey: survey.timeSurvey,
            dateSurvey: survey.dateSurvey
        }

        surveysToAdd.push(entity);
    };

    await sql.prepare("UPDATE students SET surveys=?, getNotified=? WHERE username=?").run(JSON.stringify(surveysToAdd), 1, username);
}

async function scoreActuallyExists(data) {
    let score = await sql.prepare("SELECT * FROM scores WHERE studentUsername=? AND surveyId=?").get(data.username, data.key);
    return score;
}

async function setScoreToStudent(data) {
    let score = parseInt(data.score);
    await sql.prepare("INSERT INTO scores (studentUsername, surveyId, score, maxScore, data) VALUES (?,?,?,?,?)")
        .run(data.username, data.key, score, data.maxScore, JSON.stringify(data.dataScoreSave));
        
    const student = await sql.prepare("SELECT * FROM students WHERE username=?").get(data.username);
    let surveys = getParsedArray(student.surveys);
    surveys = surveys.filter(elem => elem.key != data.key);
    surveys = JSON.stringify(surveys);
    await sql.prepare("UPDATE students SET surveys=?, getNotified=? WHERE username=?").run(surveys, 0, data.username);

    return true;
}

async function registerStudentToClassroomStudentsList(classroomCode, classroomStudentsList, studentUsername) {
    classroomStudentsList.push(studentUsername);
    classroomStudentsList = [...new Set(classroomStudentsList)];
    classroomStudentsList = JSON.stringify(classroomStudentsList);

    await sql.prepare("UPDATE classrooms SET studentsUsernameList=?, totalStudents=totalStudents+1 WHERE classroomCode=?").run(classroomStudentsList, classroomCode);
}

async function validateClassroomCode(code) {
    const actualCode = await sql.prepare("SELECT * FROM classrooms WHERE classroomCode=?").get(code);    
    if (!actualCode) return null;
    return actualCode;
}

async function validateClassroomStudentRegistered(username, classroomCode) {
    const classroom = await sql.prepare("SELECT * FROM classrooms WHERE classroomCode=?").get(classroomCode);
    let studentsUsernameList = getParsedArray(classroom.studentsusernamelist);
    if (studentsUsernameList.includes(username)) return studentsUsernameList;
    return null;
}

// Función para asegurarnos de obtener siempre un numero unico de classroom
async function generateClassroomCode() {
    let sixDigitsRandomNumber = generateRandomSixDigitsNumber();
    let classroom = await sql.prepare("SELECT * FROM classrooms WHERE classroomCode=?").get(sixDigitsRandomNumber);
    if (classroom) {
        return await generateClassroomCode();
    } else {
        return sixDigitsRandomNumber;
    }
}

// Función para asegurarnos de obtener siempre un numero unico de banco privado
async function generateBankId() {
    let sixDigitsRandomNumber = generateRandomSixDigitsNumber();
    let bank = await sql.prepare("SELECT * FROM banks WHERE key=?").get(sixDigitsRandomNumber);
    if (bank) {
        return await generateBankId();
    } else {
        return sixDigitsRandomNumber;
    }
}

// Función para asegurarnos de obtener siempre un numero unico de encuesta
async function generateSurveyId() {
    let sixDigitsRandomNumber = generateRandomSixDigitsNumber();
    let question = await sql.prepare("SELECT * FROM surveys WHERE key=?").get(sixDigitsRandomNumber);
    if (question) {
        return await generateSurveyId();
    } else {
        return sixDigitsRandomNumber;
    }
}

// Función para asegurarnos de obtener siempre un arreglo
function getParsedArray(string) {
    let arr = JSON.parse(string);
    if (!Array.isArray(arr)) {
        return [];
    } 
    return arr;
}

function generateRandomSixDigitsNumber() {
    return 100000 + Math.floor(Math.random() * 900000);
}

function containsSpecialChars(str) {
    const specialChars = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    return specialChars.test(str);
}

function isNullOrEmpty(arr) {
    if (!arr) return true;
    if (arr.length == 0) return true;
    return false;
}

function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
  }

module.exports = {operateData,getData}