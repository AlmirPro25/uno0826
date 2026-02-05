
/**
 * AEGIS-VII TACTICAL CORE [SERVER.JS]
 * CLASSIFICATION: TOP SECRET
 * ARCHITECT: General Aegis-VII
 *
 * RESPONSIBILITY:
 * 1. Database Persistence (PostgreSQL via Prisma) - Auto-initialization/Seeding
 * 2. Simulation Loop (The "Heartbeat") - Manages resources, operations, units.
 * 3. REST API Interface - For frontend command and status retrieval.
 * 4. Authentication & Authorization (JWT) - Secure access for operators.
 * 5. Input Validation (Express-Validator) - Robust request body checks.
 */

require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client'); // Prisma Client for DB interaction
const jwt = require('jsonwebtoken'); // For JWT authentication
const bcrypt = require('bcryptjs'); // For password hashing
const { check, validationResult } = require('express-validator'); // For input validation

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_SECRET_AEGIS_KEY_CHANGE_IN_PROD';
const TICK_RATE_MS = parseInt(process.env.TICK_RATE_MS || '1000', 10);

const prisma = new PrismaClient(); // Initialize Prisma Client

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());
// Serve static files from the 'frontend/dist' directory (Vite build output)
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// --- Helper Functions ---
async function addLog(level, message) {
    try {
        await prisma.commsLog.create({
            data: { level, message }
        });
    } catch (error) {
        console.error(`[SYSTEM_FAILURE] Failed to add log to DB: ${error.message}`);
    }
}

// Global counter for unit designations, initialized on startup
let unitCounters = { MINER: 0, HUNTER: 0, GUARDIAN: 0 };
async function initializeUnitCounters() {
    try {
        const units = await prisma.tacticalUnit.findMany({ select: { type: true, designation: true } });
        units.forEach(unit => {
            const type = unit.type;
            if (unitCounters[type] !== undefined) {
                const num = parseInt(unit.designation.split('-')[1]);
                if (!isNaN(num)) {
                    unitCounters[type] = Math.max(unitCounters[type], num);
                }
            }
        });
        console.log("[SYSTEM_INFO] Unit counters initialized from existing units.");
    } catch (error) {
        console.error(`[SYSTEM_FAILURE] Failed to initialize unit counters: ${error.message}`);
        await addLog('CRITICAL', `UNIT COUNTER INIT FAILED: ${error.message}`);
    }
}

async function generateUnitDesignation(type) {
    if (unitCounters[type] === undefined) {
        // Fallback in case unitCounters wasn't initialized or type is new
        await initializeUnitCounters();
        if (unitCounters[type] === undefined) {
            unitCounters[type] = 0; // Initialize for new types
        }
    }
    unitCounters[type]++;
    return `${type.toUpperCase().substring(0, 3)}-${String(unitCounters[type]).padStart(2, '0')}`;
}

// --- Database Initialization & Seeding ---
async function initDbAndSeed() {
    try {
        // Connect to the database
        await prisma.$connect();
        console.log("[SYSTEM_INFO] Connected to PostgreSQL database via Prisma.");

        // Check if Command Center exists, if not, seed initial data
        let commandCenter = await prisma.commandCenter.findFirst();
        if (!commandCenter) {
            console.log("[SYSTEM_INFO] No Command Center data found. Seeding initial resources...");
            commandCenter = await prisma.commandCenter.create({
                data: {
                    id: uuidv4(),
                    cpu_cycles: 1000,
                    bandwidth: 500,
                    crypto_tokens: 50
                }
            });
            await addLog('INFO', 'AEGIS-VII C2 NODE ACTIVATED. INITIALIZING SYSTEMS.');
            console.log("[SYSTEM_INFO] Initial Command Center deployed.");
        } else {
            console.log("[SYSTEM_INFO] Command Center data detected. Resuming operations.");
        }

        // Check for default admin user
        let adminUser = await prisma.user.findFirst({ where: { username: 'admin' } });
        if (!adminUser) {
            console.log("[SYSTEM_INFO] No default admin user found. Creating 'admin' with password 'password'...");
            const hashedPassword = await bcrypt.hash('password', 10);
            await prisma.user.create({
                data: {
                    username: 'admin',
                    password: hashedPassword,
                    role: 'ADMIN'
                }
            });
            await addLog('INFO', 'Default admin user created (admin/password). CHANGE THIS IMMEDIATELY.');
            console.log("[SYSTEM_INFO] Default admin user created (admin/password).");
        }

        await initializeUnitCounters(); // Initialize counters from existing units

    } catch (error) {
        console.error(`[SYSTEM_CRITICAL] Database initialization or seeding failed: ${error.message}`);
        // Log to console, as DB might not be fully functional yet for CommsLog
        process.exit(1); // Exit process if critical DB error
    }
}

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        addLog('WARN', 'Unauthorized access attempt: No token provided.');
        return res.status(401).json({ message: 'Unauthorized: No token provided.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            addLog('WARN', `Unauthorized access attempt: Invalid token. Error: ${err.message}`);
            return res.status(403).json({ message: 'Forbidden: Invalid token.' });
        }
        req.user = user; // Attach user payload to request
        next();
    });
};

// --- API Routes ---

// AUTHENTICATION ROUTES
app.post('/api/auth/register',
    [
        check('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.')
                         .isAlphanumeric().withMessage('Username must contain only letters and numbers.'),
        check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
                         .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
                         .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character.')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            await addLog('WARN', `Registration attempt failed due to validation errors: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;
        try {
            const existingUser = await prisma.user.findUnique({ where: { username } });
            if (existingUser) {
                await addLog('WARN', `Registration attempt failed: Username '${username}' already exists.`);
                return res.status(409).json({ message: 'Username already exists.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await prisma.user.create({
                data: {
                    username,
                    password: hashedPassword,
                    role: 'OPERATOR' // Default role
                }
            });

            const token = jwt.sign({ id: newUser.id, username: newUser.username, role: newUser.role }, JWT_SECRET, { expiresIn: '1h' });
            await addLog('SUCCESS', `New operator registered: ${username}.`);
            res.status(201).json({ token, user: { id: newUser.id, username: newUser.username, role: newUser.role } });
        } catch (error) {
            console.error(`[SYSTEM_FAILURE] Registration error: ${error.message}`);
            await addLog('CRITICAL', `USER REGISTRATION FAILED: ${error.message}`);
            res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    }
);

app.post('/api/auth/login',
    [
        check('username').notEmpty().withMessage('Username is required.'),
        check('password').notEmpty().withMessage('Password is required.')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            await addLog('WARN', `Login attempt failed due to validation errors: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;
        try {
            const user = await prisma.user.findUnique({ where: { username } });
            if (!user) {
                await addLog('WARN', `Login attempt failed: Invalid username '${username}'.`);
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                await addLog('WARN', `Login attempt failed for '${username}': Incorrect password.`);
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
            await addLog('INFO', `Operator '${username}' successfully logged in.`);
            res.status(200).json({ token, user: { id: user.id, username: user.username, role: user.role } });
        } catch (error) {
            console.error(`[SYSTEM_FAILURE] Login error: ${error.message}`);
            await addLog('CRITICAL', `USER LOGIN FAILED: ${error.message}`);
            res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    }
);

// PROTECTED TACTICAL ROUTES
app.get('/api/status', authenticateToken, async (req, res) => {
    try {
        const resources = await prisma.commandCenter.findFirst({
            select: { id: true, cpu_cycles: true, bandwidth: true, crypto_tokens: true, defense_level: true, last_tick: true }
        });
        if (!resources) {
            await addLog('CRITICAL', 'Command Center data unavailable during status fetch.');
            return res.status(500).json({ message: "Command Center data unavailable." });
        }
        const units = await prisma.tacticalUnit.findMany({
            select: { id: true, designation: true, type: true, level: true, status: true, operation_id: true, efficiency: true, created_at: true }
        });
        const operations = await prisma.operation.findMany({
            select: { id: true, name: true, type: true, difficulty: true, start_time: true, end_time: true, duration_ms: true, reward_cpu: true, reward_bw: true, reward_crypto: true, unit_id: true }
        });
        const logs = await prisma.commsLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100 // Last 100 logs
        });

        // Convert timestamps to milliseconds for frontend consumption
        const formattedOperations = operations.map(op => ({
            ...op,
            start_time: op.start_time.getTime(),
            end_time: op.end_time.getTime()
        }));

        res.json({ resources, units, operations: formattedOperations, logs: logs.reverse() }); // Logs in chronological order for console
    } catch (error) {
        console.error(`[SYSTEM_FAILURE] Failed to retrieve status: ${error.message}`);
        await addLog('CRITICAL', `STATUS RETRIEVAL FAILED: ${error.message}`);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

app.post('/api/fabricate', authenticateToken,
    [
        check('type').isIn(['MINER', 'HUNTER', 'GUARDIAN']).withMessage('Invalid unit type.')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            await addLog('WARN', `Fabrication attempt failed due to validation errors: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }

        const { type } = req.body;

        const UNIT_COSTS = { // Define costs here for backend validation
            MINER: { cpu: 50, bw: 10, name: "MINER DROID" },
            HUNTER: { cpu: 120, bw: 40, name: "HUNTER KILLER" },
            GUARDIAN: { cpu: 200, bw: 20, name: "GUARDIAN DEFENSE UNIT" }
        };

        try {
            const commandCenter = await prisma.commandCenter.findFirst();
            if (!commandCenter) {
                await addLog('CRITICAL', 'Command Center not initialized during fabrication attempt.');
                return res.status(500).json({ message: "Command Center not initialized." });
            }

            const costs = UNIT_COSTS[type];
            if (commandCenter.cpu_cycles < costs.cpu || commandCenter.bandwidth < costs.bw) {
                await addLog('WARN', `Insufficient resources for ${costs.name} by user ${req.user.username}. Required: ${costs.cpu} CPU, ${costs.bw} BW. Available: ${commandCenter.cpu_cycles} CPU, ${commandCenter.bandwidth} BW.`);
                return res.status(402).json({ message: 'Insufficient resources.' });
            }

            const updatedCommandCenter = await prisma.commandCenter.update({
                where: { id: commandCenter.id },
                data: {
                    cpu_cycles: commandCenter.cpu_cycles - costs.cpu,
                    bandwidth: commandCenter.bandwidth - costs.bw
                }
            });

            const unitId = uuidv4();
            const designation = await generateUnitDesignation(type);
            const newUnit = await prisma.tacticalUnit.create({
                data: {
                    id: unitId,
                    designation,
                    type,
                    status: 'IDLE',
                    level: 1,
                    efficiency: 1.0
                }
            });

            await addLog('INFO', `Operator ${req.user.username} fabricated new unit: ${designation} (${type}).`);
            res.status(201).json(newUnit);
        } catch (error) {
            console.error(`[SYSTEM_FAILURE] Fabrication error: ${error.message}`);
            await addLog('CRITICAL', `FABRICATION FAILED: ${error.message}`);
            res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    }
);

app.post('/api/deploy', authenticateToken,
    [
        check('unitId').isUUID().withMessage('Invalid unit ID format.'),
        check('missionType').isIn(['DATA_MINING', 'FIREWALL_ASSAULT', 'GRID_DEFENSE']).withMessage('Invalid mission type.')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            await addLog('WARN', `Deployment attempt failed due to validation errors: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }

        const { unitId, missionType } = req.body;

        const MISSION_SPECS = { // Define mission specs here for backend validation
            DATA_MINING: {
                name: "DATA MINING OPERATION", type: "FORAGE", difficulty: 1, duration_ms: 10 * 1000,
                reward_cpu: 75, reward_bw: 20, reward_crypto: 5
            },
            FIREWALL_ASSAULT: {
                name: "FIREWALL ASSAULT", type: "COMBAT", difficulty: 2, duration_ms: 30 * 1000,
                reward_cpu: 150, reward_bw: 50, reward_crypto: 15
            },
            GRID_DEFENSE: {
                name: "GRID DEFENSE PATROL", type: "DEFENSE", difficulty: 3, duration_ms: 60 * 1000,
                reward_cpu: 250, reward_bw: 100, reward_crypto: 30
            }
        };

        try {
            const unit = await prisma.tacticalUnit.findUnique({ where: { id: unitId } });
            if (!unit) {
                await addLog('WARN', `Deployment failed by user ${req.user.username}: Unit ${unitId} not found.`);
                return res.status(404).json({ message: 'Unit not found.' });
            }
            if (unit.status !== 'IDLE') {
                await addLog('WARN', `Deployment failed by user ${req.user.username}: Unit ${unit.designation} is not IDLE (current status: ${unit.status}).`);
                return res.status(400).json({ message: 'Unit is not idle.' });
            }

            const mission = MISSION_SPECS[missionType];
            if (!mission) { // Should be caught by validation, but a safeguard
                await addLog('WARN', `Deployment failed: Mission type ${missionType} not recognized.`);
                return res.status(400).json({ message: 'Invalid mission type.' });
            }

            const operationId = uuidv4();
            const startTime = Date.now();
            const endTime = startTime + mission.duration_ms;

            const newOperation = await prisma.operation.create({
                data: {
                    id: operationId,
                    name: mission.name,
                    type: mission.type,
                    difficulty: mission.difficulty,
                    start_time: new Date(startTime),
                    end_time: new Date(endTime),
                    duration_ms: mission.duration_ms,
                    reward_cpu: mission.reward_cpu,
                    reward_bw: mission.reward_bw,
                    reward_crypto: mission.reward_crypto,
                    unit_id: unitId
                }
            });
            await prisma.tacticalUnit.update({
                where: { id: unitId },
                data: { status: 'DEPLOYED', operation_id: operationId }
            });

            await addLog('INFO', `Operator ${req.user.username} deployed unit ${unit.designation} to mission: '${mission.name}'.`);
            res.status(200).json({ ...newOperation, start_time: newOperation.start_time.getTime(), end_time: newOperation.end_time.getTime() });
        } catch (error) {
            console.error(`[SYSTEM_FAILURE] Deployment error: ${error.message}`);
            await addLog('CRITICAL', `DEPLOYMENT FAILED: ${error.message}`);
            res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    }
);

app.post('/api/purge', authenticateToken, async (req, res) => {
    // Ideally, this route would also check for req.user.role === 'ADMIN'
    if (req.user.role !== 'ADMIN') {
        await addLog('ALERT', `Unauthorized purge attempt by non-admin user ${req.user.username}.`);
        return res.status(403).json({ message: 'Forbidden: Admin access required for purge.' });
    }

    try {
        await prisma.operation.deleteMany();
        await prisma.tacticalUnit.deleteMany();
        await prisma.commsLog.deleteMany();
        await prisma.commandCenter.deleteMany(); // Delete and recreate to reset ID and resources

        const initialId = uuidv4();
        await prisma.commandCenter.create({
            data: { id: initialId, cpu_cycles: 1000, bandwidth: 500, crypto_tokens: 50 }
        });

        unitCounters = { MINER: 0, HUNTER: 0, GUARDIAN: 0 }; // Reset unit counters
        await addLog('ALERT', `SYSTEM PURGE INITIATED by ${req.user.username}. ALL DATA WIPED. REBOOTING COMMAND CENTER.`);
        res.status(200).json({ message: 'System purged and re-initialized.' });
    } catch (error) {
        console.error(`[SYSTEM_FAILURE] Purge error: ${error.message}`);
        await addLog('CRITICAL', `PURGE FAILED: ${error.message}`);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

// --- Simulation Mechanics ---
async function gameTick() {
    try {
        const commandCenter = await prisma.commandCenter.findFirst();
        if (!commandCenter) {
            console.error("[SYSTEM_FAILURE] No Command Center found. Simulation halted.");
            await addLog('CRITICAL', 'COMMAND CENTER LOST. RE-INITIALIZATION REQUIRED.');
            return;
        }

        const now = new Date();
        // Passive bandwidth regeneration (capped)
        const newBandwidth = Math.min(commandCenter.bandwidth + 10, 1000);
        await prisma.commandCenter.update({
            where: { id: commandCenter.id },
            data: { bandwidth: newBandwidth, last_tick: now }
        });

        // Process completed operations
        const activeOperations = await prisma.operation.findMany();
        for (const op of activeOperations) {
            if (op.end_time.getTime() <= now.getTime()) {
                // Operation complete
                await prisma.commandCenter.update({
                    where: { id: commandCenter.id },
                    data: {
                        cpu_cycles: { increment: op.reward_cpu },
                        bandwidth: { increment: op.reward_bw },
                        crypto_tokens: { increment: op.reward_crypto }
                    }
                });
                await prisma.tacticalUnit.update({
                    where: { id: op.unit_id },
                    data: { status: 'IDLE', operation_id: null }
                });
                await prisma.operation.delete({ where: { id: op.id } });
                await addLog('SUCCESS', `Operation '${op.name}' completed by unit ${op.unit_id}. Resources acquired.`);
            }
        }
    } catch (error) {
        console.error(`[SYSTEM_FAILURE] Game tick processing error: ${error.message}`);
        await addLog('CRITICAL', `CORE SIMULATION FAILURE: ${error.message}`);
    }
}


// For any other route, serve the frontend's index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

// --- Server Start ---
initDbAndSeed().then(() => {
    app.listen(PORT, () => {
        console.log(`[SYSTEM_INFO] Aegis-VII Tactical Core running on port ${PORT}`);
        setInterval(gameTick, TICK_RATE_MS); // Start the simulation loop
    });
}).catch(error => {
    console.error(`[SYSTEM_CRITICAL] Failed to start server due to DB or seeding error: ${error.message}`);
    process.exit(1);
});
