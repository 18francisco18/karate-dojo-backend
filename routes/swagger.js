/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Graduation:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         student:
 *           type: string
 *           description: ID do estudante
 *         level:
 *           type: string
 *           enum: [branco, amarelo, azul, laranja, verde, roxo, castanho, preto]
 *         scope:
 *           type: string
 *           enum: [internal, regional, national]
 *         date:
 *           type: string
 *           format: date-time
 *         instructor:
 *           type: string
 *           description: ID do instrutor
 *         location:
 *           type: string
 *         availableSlots:
 *           type: number
 *         enrolledStudents:
 *           type: array
 *           items:
 *             type: string
 *             description: IDs dos estudantes inscritos
 *         studentEvaluations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               student:
 *                 type: string
 *                 description: ID do estudante
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               comments:
 *                 type: string
 *               evaluatedBy:
 *                 type: string
 *                 description: ID do instrutor avaliador
 *               evaluationDate:
 *                 type: string
 *                 format: date-time
 *               diplomaPath:
 *                 type: string
 *     MonthlyFee:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         student:
 *           type: string
 *           description: ID do estudante
 *         plan:
 *           type: string
 *           description: ID do plano mensal
 *         amount:
 *           type: number
 *           minimum: 0
 *         dueDate:
 *           type: string
 *           format: date-time
 *         paymentDate:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [pending, paid, late, cancelled]
 *         paymentMethod:
 *           type: string
 *           enum: [cash, card, transfer]
 *     Student:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         belt:
 *           type: string
 *           enum: [branco, amarelo, azul, laranja, verde, roxo, castanho, preto]
 *         instructor:
 *           type: string
 *           description: ID do instrutor
 *         active:
 *           type: boolean
 *         profileImage:
 *           type: string
 *     Instructor:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         students:
 *           type: array
 *           items:
 *             type: string
 *         active:
 *           type: boolean
 *         profileImage:
 *           type: string
 *     LoginResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *         user:
 *           type: object
 * 
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Authentication endpoints
 *   - name: Graduations
 *     description: Graduation management
 *   - name: Monthly Fees
 *     description: Monthly fees and payments
 *   - name: Students
 *     description: Student management
 *   - name: Instructors
 *     description: Instructor management
 *   - name: Profile
 *     description: Profile management
 *   - name: Plans
 *     description: Plan management
 * 
 * @swagger
 * /authStudent/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Student login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 * 
 * @swagger
 * /authInstructor/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Instructor login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 * 
 * @swagger
 * /password-recovery:
 *   post:
 *     tags: [Authentication]
 *     summary: Request password recovery
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Recovery email sent
 * 
 * @swagger
 * /password-reset:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 * 
 * @swagger
 * /graduation:
 *   get:
 *     tags: [Graduations]
 *     summary: List all graduations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of graduations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Graduation'
 *   post:
 *     tags: [Graduations]
 *     summary: Create new graduation (Instructor only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               level:
 *                 type: string
 *                 enum: [branco, amarelo, azul, laranja, verde, roxo, castanho, preto]
 *               location:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               availableSlots:
 *                 type: number
 *               scope:
 *                 type: string
 *                 enum: [internal, regional, national]
 *     responses:
 *       201:
 *         description: Graduation created
 * 
 * @swagger
 * /graduation/{id}:
 *   get:
 *     tags: [Graduations]
 *     summary: Get graduation details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Graduation details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Graduation'
 *   delete:
 *     tags: [Graduations]
 *     summary: Delete graduation (Instructor only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Graduation deleted
 * 
 * @swagger
 * /graduation/{id}/enroll:
 *   post:
 *     tags: [Graduations]
 *     summary: Enroll in graduation (Student only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrolled successfully
 * 
 * @swagger
 * /graduation/{id}/evaluate:
 *   put:
 *     tags: [Graduations]
 *     summary: Evaluate graduation (Instructor only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: number
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Evaluation recorded
 * 
 * @swagger
 * /monthly-fees:
 *   get:
 *     tags: [Monthly Fees]
 *     summary: List monthly fees (Student)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of monthly fees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MonthlyFee'
 * 
 * @swagger
 * /monthly-fees/{id}/pay:
 *   patch:
 *     tags: [Monthly Fees]
 *     summary: Pay monthly fee (Student)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment successful
 * 
 * @swagger
 * /instructor/monthly-fees/{id}/pay:
 *   patch:
 *     tags: [Monthly Fees]
 *     summary: Pay monthly fee (Instructor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment successful
 * 
 * @swagger
 * /student/details:
 *   get:
 *     tags: [Students]
 *     summary: Get logged in student details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 * 
 * @swagger
 * /students:
 *   get:
 *     tags: [Students]
 *     summary: List all students (Instructor only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Student'
 * 
 * @swagger
 * /instructor/students:
 *   get:
 *     tags: [Students]
 *     summary: List instructor's students (Instructor only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of instructor's students
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Student'
 * 
 * @swagger
 * /students/{id}:
 *   put:
 *     tags: [Students]
 *     summary: Update student data (Instructor only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student updated
 *   delete:
 *     tags: [Students]
 *     summary: Delete student (Instructor only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student deleted
 * 
 * @swagger
 * /instructors:
 *   get:
 *     tags: [Instructors]
 *     summary: List all instructors
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of instructors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Instructor'
 *   post:
 *     tags: [Instructors]
 *     summary: Add new instructor
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Instructor created
 * 
 * @swagger
 * /instructors/{id}:
 *   put:
 *     tags: [Instructors]
 *     summary: Update instructor data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Instructor updated
 *   delete:
 *     tags: [Instructors]
 *     summary: Delete instructor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Instructor deleted
 * 
 * @swagger
 * /profile:
 *   get:
 *     tags: [Profile]
 *     summary: Get profile data
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *   put:
 *     tags: [Profile]
 *     summary: Update profile data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *   delete:
 *     tags: [Profile]
 *     summary: Delete account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 * 
 * @swagger
 * /profile-image/upload:
 *   post:
 *     tags: [Profile]
 *     summary: Upload profile image
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded
 * 
 * @swagger
 * /plans:
 *   get:
 *     tags: [Plans]
 *     summary: List all available plans
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of plans
 *   post:
 *     tags: [Plans]
 *     summary: Create new plan (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               graduationScopes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [internal, regional, national]
 *     responses:
 *       201:
 *         description: Plan created
 * 
 * @swagger
 * /plans/{id}:
 *   put:
 *     tags: [Plans]
 *     summary: Update plan (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               graduationScopes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [internal, regional, national]
 *     responses:
 *       200:
 *         description: Plan updated
 *   delete:
 *     tags: [Plans]
 *     summary: Delete plan (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan deleted
 */
